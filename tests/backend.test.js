import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
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
    process.env.PRO_DAILY_ANALYSES = '50';
    app = createApp();
    app.use((err, req, res, next) => {
      res.status(500).json({ error: 'unhandled', details: err.message });
    });
    request = supertest(app);
    mockUsage = 0;
    
    verifyIdTokenMock.mockResolvedValue({ uid: 'test-user-123' });

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
  });

  describe('GET /api/usage', () => {
    it('returns usage correctly for Free defaults', async () => {
      mockUsage = 2;
      const res = await request.get('/api/usage').set('Authorization', 'Bearer valid');
      expect(res.status).toBe(200);
      expect(res.body.plan).toBe('FREE');
      expect(res.body.usage.analyze).toBe(2);
      expect(res.body.limits.analyze).toBe(5);
    });

    it('returns usage correctly for Pro defaults', async () => {
      getMock.mockImplementation(() => ({
        exists: true,
        data: () => ({ isPremium: true, analyze: 10 })
      }));
      const res = await request.get('/api/usage').set('Authorization', 'Bearer valid');
      expect(res.status).toBe(200);
      expect(res.body.plan).toBe('PRO');
      expect(res.body.usage.analyze).toBe(10);
      expect(res.body.limits.analyze).toBe(50);
    });
  });

  describe('POST /api/analyze', () => {
    const validBody = { transcript: 'test', metrics: { wpm: 120 }, mode: 'impromptu' };

    it('consumes quota on success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ fillers: 1, confidenceScore: 80, aiTip: { summary: "x", strengths: "x", improvements: "x", actionTip: "x" } }) }] } }]
        })
      });
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(200);
      expect(mockUsage).toBe(1);
    });

    it('allows Free User with frames: [] and consumes quota', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ fillers: 1, confidenceScore: 80, aiTip: { summary: "x", strengths: "x", improvements: "x", actionTip: "x" } }) }] } }]
        })
      });
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send({ ...validBody, frames: [] });
      expect(res.status).toBe(200);
      expect(mockUsage).toBe(1);
    });

    it('rejects Free User with actual frames', async () => {
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send({ ...validBody, frames: ['data:image/jpeg;base64,123'] });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('PREMIUM_REQUIRED');
      expect(mockUsage).toBe(0);
    });

    it('allows Pro User with actual frames', async () => {
      getMock.mockImplementation(() => ({
        exists: true,
        data: () => ({ isPremium: true, analyze: 0 })
      }));
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ fillers: 1, confidenceScore: 80, aiTip: { summary: "x", strengths: "x", improvements: "x", actionTip: "x" } }) }] } }]
        })
      });
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send({ ...validBody, frames: ['data:image/jpeg;base64,123'] });
      expect(res.status).toBe(200);
      expect(mockUsage).toBe(1);
    });
    
    it('validates customPrompt type', async () => {
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send({ ...validBody, customPrompt: 123 });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
      expect(mockUsage).toBe(0);
    });

    it('refunds quota on Gemini timeout (504)', async () => {
      fetch.mockRejectedValueOnce({ name: 'AbortError' });
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(504);
      expect(res.body.code).toBe('AI_TIMEOUT');
      expect(mockUsage).toBe(0);
    });

    it('refunds quota on upstream 500', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Error' });
      const res = await request.post('/api/analyze').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(res.body.code).toBe('UPSTREAM_ERROR');
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
      expect(res.body.code).toBe('INVALID_AI_RESPONSE');
      expect(mockUsage).toBe(0);
    });
  });

  describe('POST /api/interview', () => {
    const validBody = { messages: [{ role: 'user', text: 'Hallo' }], mode: 'interview_standard' };
    
    beforeEach(() => {
      getMock.mockImplementation(() => ({ exists: true, data: () => ({ isPremium: true, interviewTurn: mockUsage }) }));
    });
    
    it('consumes quota on success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ feedback: "x", isFinished: false, interviewerSpeech: "x" }) }] } }]
        })
      });
      const res = await request.post('/api/interview').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(200);
      expect(mockUsage).toBe(1);
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
      expect(res.body.code).toBe('INVALID_AI_RESPONSE');
      expect(mockUsage).toBe(0);
    });
    
    it('refunds on invalid JSON', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "not json" }] } }]
        })
      });
      const res = await request.post('/api/interview').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
    
    it('refunds on Gemini timeout', async () => {
      fetch.mockRejectedValueOnce({ name: 'AbortError' });
      const res = await request.post('/api/interview').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(504);
      expect(res.body.code).toBe('AI_TIMEOUT');
      expect(mockUsage).toBe(0);
    });

    it('refunds on upstream error', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Error' });
      const res = await request.post('/api/interview').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(res.body.code).toBe('UPSTREAM_ERROR');
      expect(mockUsage).toBe(0);
    });
  });
  
  describe('POST /api/analyze-progress', () => {
    const validBody = { history: [{id: 1}] };
    
    it('consumes quota on success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ insight: "X", strengths: ["A"], improvements: ["A"] }) }] } }] })
      });
      const res = await request.post('/api/analyze-progress').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(200);
      expect(mockUsage).toBe(1);
    });
    
    it('refunds on invalid output (insight empty)', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ insight: "", strengths: ["A"], improvements: ["A"] }) }] } }] })
      });
      const res = await request.post('/api/analyze-progress').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
    
    it('refunds on invalid JSON', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "not json" }] } }] })
      });
      const res = await request.post('/api/analyze-progress').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
    
    it('refunds on Gemini timeout', async () => {
      fetch.mockRejectedValueOnce({ name: 'AbortError' });
      const res = await request.post('/api/analyze-progress').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(504);
      expect(mockUsage).toBe(0);
    });
    
    it('refunds on upstream error', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Error' });
      const res = await request.post('/api/analyze-progress').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
  });

  describe('POST /api/analyze-persona', () => {
    const validBody = { profile: { role: 'x', hobbies: 'x' } };

    it('consumes quota on success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ archetype: "X", description: "X", superpower: "X", trap: "X" }) }] } }] })
      });
      const res = await request.post('/api/analyze-persona').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(200);
      expect(mockUsage).toBe(1);
    });

    it('returns 400 without quota consumption if profile is empty', async () => {
      const res = await request.post('/api/analyze-persona').set('Authorization', 'Bearer token').send({ profile: { role: '', hobbies: '' } });
      expect(res.status).toBe(400);
      expect(mockUsage).toBe(0);
    });

    it('refunds on empty archetype', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ archetype: "", description: "x", superpower: "X", trap: "x" }) }] } }] })
      });
      const res = await request.post('/api/analyze-persona').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
    
    it('refunds on invalid JSON', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "not json" }] } }] })
      });
      const res = await request.post('/api/analyze-persona').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
    
    it('refunds on Gemini timeout', async () => {
      fetch.mockRejectedValueOnce({ name: 'AbortError' });
      const res = await request.post('/api/analyze-persona').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(504);
      expect(mockUsage).toBe(0);
    });
    
    it('refunds on upstream error', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Error' });
      const res = await request.post('/api/analyze-persona').set('Authorization', 'Bearer token').send(validBody);
      expect(res.status).toBe(502);
      expect(mockUsage).toBe(0);
    });
  });
  describe('Usage Endpoint with Env Overrides', () => {
    let originalEnv;
    beforeAll(() => {
      originalEnv = process.env;
    });
    
    afterAll(() => {
      process.env = originalEnv;
    });

    it('returns default values if no env set', async () => {
      process.env = { ...originalEnv, FREE_DAILY_ANALYSES: '', PRO_DAILY_ANALYSES: '' };
      getMock.mockResolvedValueOnce({ exists: true, data: () => ({ isPremium: false }) });
      const res = await supertest(app).get('/api/usage').set('Authorization', 'Bearer valid-token');
      expect(res.body.limits.analyze).toBe(5);
    });

    it('returns custom free values if env set', async () => {
      process.env = { ...originalEnv, FREE_DAILY_ANALYSES: '3' };
      getMock.mockResolvedValueOnce({ exists: true, data: () => ({ isPremium: false }) });
      const res = await supertest(app).get('/api/usage').set('Authorization', 'Bearer valid-token');
      expect(res.body.limits.analyze).toBe(3);
    });

    it('returns custom pro values if env set', async () => {
      process.env = { ...originalEnv, PRO_DAILY_ANALYSES: '73' };
      getMock.mockResolvedValueOnce({ exists: true, data: () => ({ isPremium: true }) });
      const res = await supertest(app).get('/api/usage').set('Authorization', 'Bearer valid-token');
      expect(res.body.limits.analyze).toBe(73);
    });
  });

});
