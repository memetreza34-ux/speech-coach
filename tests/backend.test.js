import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../server.js';
import { getFirestore } from 'firebase-admin/firestore';

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(() => [{ name: '[DEFAULT]' }]),
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user-123' })
  })),
}));

const { getMock, setMock, runTransactionMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  const setMock = vi.fn();
  const runTransactionMock = vi.fn(async (cb) => {
    return cb({
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ analyze: 0, progress: 0, persona: 0, interviewTurn: 0 }) }),
      set: setMock,
    });
  });
  return { getMock, setMock, runTransactionMock };
});

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
vi.stubGlobal('fetch', vi.fn());

describe('Backend API Tests', () => {
  let app;
  let request;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    app = createApp();
    request = supertest(app);
    
    // Default mocks
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({ isPremium: false })
    });
  });

  describe('GET /api/health', () => {
    it('returns 200 OK', async () => {
      const res = await request.get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('POST /api/analyze', () => {
    const validBody = {
      transcript: 'Das ist ein Test.',
      metrics: { wpm: 120, pauseCount: 2, longestPauseMs: 1000, speakingRatio: 90, dynamics: 50, durationMs: 10000 },
      mode: 'impromptu'
    };
    
    const validGeminiResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              fillers: 2,
              confidenceScore: 80,
              aiTip: {
                summary: "Gute Antwort.",
                strengths: "Flüssig.",
                improvements: "Weniger Füllwörter.",
                actionTip: "Achte auf Pausen.",
                bodyLanguage: null
              }
            })
          }]
        }
      }]
    };

    it('returns 200 for valid Gemini response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validGeminiResponse
      });

      const res = await request.post('/api/analyze')
        .set('Authorization', 'Bearer token123')
        .send(validBody);
        
      expect(res.status).toBe(200);
      expect(res.body.fillers).toBe(2);
    });

    it('returns 502 + refund when summary is missing', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: JSON.stringify({
              fillers: 2, confidenceScore: 80, aiTip: { strengths: "x", improvements: "x", actionTip: "x" }
            })}] }
          }]
        })
      });

      const res = await request.post('/api/analyze')
        .set('Authorization', 'Bearer token')
        .send(validBody);
        
      expect(res.status).toBe(502);
      expect(res.body.error).toBe('INVALID_AI_RESPONSE');
      expect(res.body.details).toBe('summary missing');
    });

    it('returns 400 and NO QUOTA consume for invalid metrics', async () => {
      const res = await request.post('/api/analyze')
        .set('Authorization', 'Bearer token')
        .send({ ...validBody, metrics: { ...validBody.metrics, wpm: 9999 } });
        
      expect(res.status).toBe(400);
      expect(runTransactionMock).not.toHaveBeenCalled();
    });

    it('returns 403 for free user using camera (frames)', async () => {
      const res = await request.post('/api/analyze')
        .set('Authorization', 'Bearer token')
        .send({ ...validBody, frames: ['data:image/jpeg;base64,12345'] });
        
      expect(res.status).toBe(403);
    });

    it('returns 504 on Gemini timeout', async () => {
      fetch.mockRejectedValueOnce({ name: 'AbortError' });
      
      const res = await request.post('/api/analyze')
        .set('Authorization', 'Bearer token')
        .send(validBody);
        
      expect(res.status).toBe(504);
    });
    
    it('returns 502 on Gemini 500 error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });
      
      const res = await request.post('/api/analyze')
        .set('Authorization', 'Bearer token')
        .send(validBody);
        
      expect(res.status).toBe(502);
    });
  });

  describe('POST /api/interview', () => {
    const validBody = {
      messages: [{ role: 'user', text: 'Hallo' }],
      mode: 'interview_standard'
    };

    it('returns 403 for free user', async () => {
      const res = await request.post('/api/interview')
        .set('Authorization', 'Bearer token')
        .send(validBody);
        
      expect(res.status).toBe(403);
    });

    it('returns 200 for premium user with valid response', async () => {
      getMock.mockResolvedValue({
        exists: true,
        data: () => ({ isPremium: true })
      });
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: JSON.stringify({
              interviewerSpeech: "Guten Tag.", feedback: "Gut.", isFinished: false
            })}] }
          }]
        })
      });

      const res = await request.post('/api/interview')
        .set('Authorization', 'Bearer token')
        .send(validBody);
        
      expect(res.status).toBe(200);
      expect(res.body.interviewerSpeech).toBe("Guten Tag.");
    });
    
    it('returns 400 for invalid role', async () => {
      getMock.mockResolvedValue({
        exists: true,
        data: () => ({ isPremium: true })
      });
      
      const res = await request.post('/api/interview')
        .set('Authorization', 'Bearer token')
        .send({ messages: [{ role: 'system', text: 'Hallo' }] });
        
      expect(res.status).toBe(400);
      expect(runTransactionMock).not.toHaveBeenCalled();
    });
  });
});
