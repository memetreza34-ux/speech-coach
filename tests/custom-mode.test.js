import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../server.js';


const { getMock, runTransactionMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  
  const runTransactionMock = vi.fn(async (cb) => {
    // In our tests we inject mockDbState behavior through getMock and transaction
    const transaction = {
      get: getMock,
      update: vi.fn((_ref, data) => {
        // mock update
      })
    };
    return cb(transaction);
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

describe('Custom Mode Tests', () => {
  let app;
  let request;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FREE_CUSTOM_MODES = '1';
    process.env.PRO_CUSTOM_MODES = '20';
    app = createApp();
    request = supertest(app);
  });

  const setupMock = (isPremium, modesCount) => {
    const modes = Array.from({length: modesCount}, (_, i) => ({ id: `m${i}` }));
    
    // Setup for regular reads (like /api/usage)
    getMock.mockImplementation((_ref) => {
       return {
         exists: true,
         data: () => ({ isPremium, customModes: modes })
       };
    });
  };

  it('rejects creation if limit is reached for free user (1 mode)', async () => {
    setupMock(false, 1);

    const res = await request.post('/api/custom-modes')
      .set('Authorization', 'Bearer token')
      .send({ title: 'New', color: 'bg-red-500', prompt: 'prompt', icon: 'Star' });
      
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Limit für eigene Szenarien');
  });

  it('allows creation if under limit for free user (0 modes)', async () => {
    setupMock(false, 0);

    const res = await request.post('/api/custom-modes')
      .set('Authorization', 'Bearer token')
      .send({ title: 'New', color: 'bg-red-500', prompt: 'prompt', icon: 'Star' });
      
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('allows creation if under limit for pro user (19 modes)', async () => {
    setupMock(true, 19);

    const res = await request.post('/api/custom-modes')
      .set('Authorization', 'Bearer token')
      .send({ title: 'New', color: 'bg-red-500', prompt: 'prompt', icon: 'Star' });
      
    expect(res.status).toBe(200);
  });

  it('rejects creation if limit is reached for pro user (20 modes)', async () => {
    setupMock(true, 20);

    const res = await request.post('/api/custom-modes')
      .set('Authorization', 'Bearer token')
      .send({ title: 'New', color: 'bg-red-500', prompt: 'prompt', icon: 'Star' });
      
    expect(res.status).toBe(403);
  });

  it('uses safe defaults if env is invalid', async () => {
    process.env.FREE_CUSTOM_MODES = 'invalid_abc'; // strict parser drops this -> fallback 1
    setupMock(false, 1);

    const res = await request.post('/api/custom-modes')
      .set('Authorization', 'Bearer token')
      .send({ title: 'New', color: 'bg-red-500', prompt: 'prompt', icon: 'Star' });
      
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Limit für eigene Szenarien (1) erreicht');
  });
  
  it('allows deletion of existing mode', async () => {
    setupMock(false, 1);

    const res = await request.delete('/api/custom-modes/m0')
      .set('Authorization', 'Bearer token');
      
    expect(res.status).toBe(200);
  });
  
  it('rejects deletion of unknown mode', async () => {
    setupMock(false, 1); // has m0

    const res = await request.delete('/api/custom-modes/unknown-mode')
      .set('Authorization', 'Bearer token');
      
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Szenario nicht gefunden');
  });
});
