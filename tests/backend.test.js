import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../server.js';

let mockUsage = 0;

const { getMock, runTransactionMock, verifyIdTokenMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  const verifyIdTokenMock = vi.fn();
  
  const runTransactionMock = vi.fn(async (cb) => {
    const transaction = {
      get: getMock,
      set: vi.fn((_ref, data) => {
         // simulate consumption or refund
         if (data.analyze !== undefined) mockUsage = data.analyze;
         if (data.interviewTurn !== undefined) mockUsage = data.interviewTurn;
         if (data.progress !== undefined) mockUsage = data.progress;
         if (data.persona !== undefined) mockUsage = data.persona;
      }),
      update: vi.fn((_ref, data) => {
         if (data.analyze !== undefined) mockUsage = data.analyze;
         if (data.interviewTurn !== undefined) mockUsage = data.interviewTurn;
         if (data.progress !== undefined) mockUsage = data.progress;
         if (data.persona !== undefined) mockUsage = data.persona;
      })
    };
    return cb(transaction);
  });
  return { getMock, runTransactionMock, verifyIdTokenMock };
});

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(() => [{ name: '[DEFAULT]' }]),
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: verifyIdTokenMock
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

vi.stubGlobal('fetch', vi.fn());

describe('Backend API Tests', () => {
  let app;
  let request;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.FREE_DAILY_ANALYSES = '5';
    app = createApp();
    app.use((err, req, res, next) => {
      console.log('EXPRESS UNHANDLED ERROR:', err);
      res.status(500).json({ error: 'unhandled', details: err.message });
    });
    request = supertest(app);
    mockUsage = 0;
    
    // Auth mock
    verifyIdTokenMock.mockResolvedValue({ uid: 'test-user-123' });

    // DB mock
    getMock.mockImplementation(() => ({
      exists: true,
      data: () => ({ isPremium: false, analyze: mockUsage, interviewTurn: mockUsage, progress: mockUsage, persona: mockUsage })
    }));
  });

  describe('Auth Middleware', () => {
    it('returns 401 without Authorization header', async () => {
      const res = await request.post('/api/analyze').send({});
      expect(res.status).toBe(401);
    });

    it('returns 401 if token is not Bearer', async () => {
      const res = await request.post('/api/analyze').set('Authorization', 'Basic 123').send({});
      expect(res.status).toBe(401);
    });

    it('returns 401 for invalid Firebase token', async () => {
      verifyIdTokenMock.mockRejectedValueOnce(new Error('Invalid token'));
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer invalid').send({});
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/usage', () => {
    it('returns usage correctly', async () => {
      mockUsage = 2;
      const res = await request.get('/api/usage').set('Authorization', 'Bearer valid');
      expect(res.status).toBe(200);
      expect(res.body.plan).toBe('FREE');
      expect(res.body.usage.analyze).toBe(2);
      expect(res.body.limits.analyze).toBe(5);
    });
  });

  describe('POST /api/analyze Quota Refunds', () => {
    const validBody = { transcript: 'test', metrics: { wpm: 120 }, mode: 'impromptu' };

    it('consumes quota (counter + 1) on success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ fillers: 1, confidenceScore: 80, aiTip: { summary: "x", strengths: "x", improvements: "x", actionTip: "x" } }) }] } }]
        })
      });
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(200);
      expect(mockUsage).toBe(1); // Consumed 1
    });

    it('refunds quota on Gemini timeout (504)', async () => {
      fetch.mockRejectedValueOnce({ name: 'AbortError' });
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(504);
      expect(mockUsage).toBe(0); // Refunded back to 0
    });

    it('refunds quota on upstream 500', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Error' });
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send(validBody);
      if (res.status !== 502) throw new Error('EXPECTED 502, GOT: ' + res.status + ' BODY: ' + JSON.stringify(res.body));
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });

    it('refunds quota on invalid JSON', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "not json" }] } }]
        })
      });
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
    
    it('refunds quota on invalid AI schema (missing summary)', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ fillers: 1, confidenceScore: 80, aiTip: { strengths: "x" } }) }] } }]
        })
      });
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
  });

  describe('POST /api/interview Error & Refund Tests', () => {
    const validBody = { messages: [{ role: 'user', text: 'Hallo' }], mode: 'interview_standard' };
    
    beforeEach(() => {
      getMock.mockImplementation(() => ({ exists: true, data: () => ({ isPremium: true, interviewTurn: mockUsage }) }));
    });

    it('refunds on invalid AI response (missing interviewerSpeech)', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ feedback: "x", isFinished: false }) }] } }]
        })
      });
      const res = await request.post('/api/interview').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });

    it('refunds on upstream error', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Error' });
      const res = await request.post('/api/interview').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });

    it('does NOT consume quota if validation fails (message > 2000 chars)', async () => {
      const res = await request.post('/api/interview').set('Authorization', 'Bearer token')
        .send({ mode: 'interview_standard', messages: [{ role: 'user', text: 'a'.repeat(2001) }] });
      expect(res.status).toBe(400);
      expect(mockUsage).toBe(0); // Never consumed
    });
  });
  
  describe('POST /api/analyze-progress Error & Refund Tests', () => {
    const validBody = { history: [{id: 1}] };
    
    it('refunds on invalid output (insight empty)', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ insight: "", strengths: ["A"], improvements: ["A"] }) }] } }] })
      });
      const res = await request.post('/api/analyze-progress').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
    
    it('refunds if strengths has > 3 items', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ insight: "X", strengths: ["A", "B", "C", "D"], improvements: ["A"] }) }] } }] })
      });
      const res = await request.post('/api/analyze-progress').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
  });

  describe('POST /api/analyze-persona Error & Refund Tests', () => {
    const validBody = { profile: { role: 'x', hobbies: 'x' } };

    it('returns 400 without quota consumption if profile is empty', async () => {
      const res = await request.post('/api/analyze-persona').set('Authorization', 'Bearer token').send({ profile: { role: '', hobbies: '' } });
      expect(res.status).toBe(400);
      expect(mockUsage).toBe(0);
    });

    it('refunds on empty archetype', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ archetype: "", description: "x", tone: "x", strengths: ["x"], blindspots: ["x"], quote: "x" }) }] } }] })
      });
      const res = await request.post('/api/analyze-persona').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
  });
});
