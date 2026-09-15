import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../server.js';
import * as admin from 'firebase-admin';

// Reusing same mock strategy
let transactionCount = 0;
let currentUsage = 0;

const { getMock, setMock, runTransactionMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  const setMock = vi.fn();
  const runTransactionMock = vi.fn(async (cb) => {
    // Basic simulation of transaction loop locking (not perfectly accurate to firestore but counts)
    const transaction = {
      get: async () => ({ exists: true, data: () => ({ analyze: currentUsage }) }),
      set: (ref, data) => { currentUsage = data.analyze; },
      update: vi.fn()
    };
    return cb(transaction);
  });
  return { getMock, setMock, runTransactionMock };
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
    })),
    FieldValue: {
      serverTimestamp: vi.fn(),
    }
  };
});

// Mock fetch for Gemini API
const globalFetch = global.fetch;
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
    process.env.FREE_DAILY_ANALYZE = '5';
    currentUsage = 0;
    app = createApp();
    request = supertest(app);
    getMock.mockResolvedValue({ exists: true, data: () => ({ isPremium: false }) });
  });

  it('handles parallel requests without exceeding quota limit', async () => {
    // 10 concurrent requests
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request.post('/api/analyze')
          .set('Authorization', 'Bearer token')
          .send({ transcript: 'test', mode: 'impromptu' })
      );
    }
    
    const results = await Promise.all(promises);
    
    // We mocked the transaction simply, so it processes sequentially in the mock
    // In reality Firestore would handle race conditions. We just check how many succeed.
    const successes = results.filter(r => r.status !== 429);
    const ratelimited = results.filter(r => r.status === 429);
    
    expect(successes.length).toBeLessThanOrEqual(5);
    expect(ratelimited.length).toBeGreaterThanOrEqual(5);
  });
});
