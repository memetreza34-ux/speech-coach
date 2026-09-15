import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../server.js';
import * as admin from 'firebase-admin';

const { getMock, setMock, runTransactionMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  const setMock = vi.fn();
  const runTransactionMock = vi.fn(async (cb) => {
    return cb({
      get: getMock,
      update: setMock,
    });
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

  it('rejects creation if limit is reached for free user', async () => {
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({ isPremium: false, customModes: [{id: 'mode1'}] })
    });
    
    // For transactions
    runTransactionMock.mockImplementationOnce(async (cb) => {
      throw new Error('Limit für eigene Szenarien (1) erreicht.');
    });

    const res = await request.post('/api/custom-modes')
      .set('Authorization', 'Bearer token')
      .send({ title: 'New', color: 'bg-red-500', prompt: 'prompt', icon: 'Star' });
      
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Limit');
  });

  it('allows creation if under limit', async () => {
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({ isPremium: false, customModes: [] })
    });
    
    // Simulate transaction success
    runTransactionMock.mockImplementationOnce(async (cb) => {
      return { id: 'new-id' };
    });

    const res = await request.post('/api/custom-modes')
      .set('Authorization', 'Bearer token')
      .send({ title: 'New', color: 'bg-red-500', prompt: 'prompt', icon: 'Star' });
      
    expect(res.status).toBe(200);
  });

  it('uses safe defaults if env is invalid', async () => {
    process.env.FREE_CUSTOM_MODES = 'invalid';
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({ isPremium: false, customModes: [{id: 'mode1'}] })
    });
    
    runTransactionMock.mockImplementationOnce(async (cb) => {
      throw new Error('Limit für eigene Szenarien (1) erreicht.');
    });

    const res = await request.post('/api/custom-modes')
      .set('Authorization', 'Bearer token')
      .send({ title: 'New', color: 'bg-red-500', prompt: 'prompt', icon: 'Star' });
      
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Limit für eigene Szenarien (1) erreicht.');
  });
  
  it('allows deletion', async () => {
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({ isPremium: false, customModes: [{id: 'mode1'}] })
    });
    
    runTransactionMock.mockImplementationOnce(async (cb) => {
       return true;
    });

    const res = await request.delete('/api/custom-modes/mode1')
      .set('Authorization', 'Bearer token');
      
    expect(res.status).toBe(200);
  });
});
