const express = require('express');
const { createApp } = require('./server.js');
const supertest = require('supertest');
const { getAuth } = require('firebase-admin/auth');

// we just use the real server.js, but we stub out fetch
const app = createApp();

const run = async () => {
  const request = supertest(app);
  const res = await request.post('/api/analyze')
    .set('Authorization', 'Bearer dummy')
    .send({ transcript: 't', metrics: {wpm: 1}, mode: 'impromptu' });
  console.log("STATUS:", res.status);
  console.log("BODY:", res.body);
  console.log("TEXT:", res.text);
};

run().catch(console.error);
