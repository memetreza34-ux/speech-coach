import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../server.js';

let currentUsage = 0;

const { getMock, runTransactionMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  // Echte Firestore-Transaktionen laufen nicht verschränkt (bei Konflikten wiederholt Firestore sie).
  // Ohne diese Warteschlange konnten sich zwei get/set-Paare überlappen → der Test war flaky.
  let queue = Promise.resolve();
  const runTransactionMock = vi.fn((cb) => {
    const transaction = {
      get: async () => ({ exists: true, data: () => ({ analyze: currentUsage }) }),
      set: (ref, data) => { currentUsage = data.analyze; },
      update: vi.fn()
    };
    const run = queue.then(() => cb(transaction));
    queue = run.catch(() => {});
    return run;
  });
  return { getMock, runTransactionMock };
});

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(() => [{ name: '[DEFAULT]' }]),
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user-123' })
  })),
}));

vi.mock('firebase-admin/firestore', () => {
  const docMock = vi.fn(() => ({
    get: getMock,
    collection: vi.fn(() => ({ doc: docMock })),
  }));
  const collectionMock = vi.fn(() => ({ doc: docMock }));
  
  return {
    getFirestore: vi.fn(() => ({
      collection: collectionMock,
      runTransaction: runTransactionMock,
    }))
  };
});

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{
        content: { parts: [{ text: JSON.stringify({ fillers: 1, confidenceScore: 80, aiTip: { summary: "x", strengths: "x", improvements: "x", actionTip: "x", bodyLanguage: null } }) }] }
      }]
    })
}));

describe('Concurrency Tests', () => {
  let app;
  let request;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.FREE_DAILY_ANALYSES = '3';
    currentUsage = 0;
    app = createApp();
    request = supertest(app);
    getMock.mockResolvedValue({ exists: true, data: () => ({ isPremium: false }) });
  });

  it('handles parallel requests without exceeding quota limit', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request.post('/api/analyze')
          .set('Authorization', 'Bearer token')
          .send({ transcript: 'test', mode: 'impromptu' })
      );
    }
    
    const results = await Promise.all(promises);
    
    const successes = results.filter(r => r.status === 200);
    const ratelimited = results.filter(r => r.status === 429);
    const others = results.filter(r => r.status !== 200 && r.status !== 429);
    
    expect(others.length).toBe(0);
    expect(successes.length).toBe(3);
    expect(ratelimited.length).toBe(7);
  });
});
