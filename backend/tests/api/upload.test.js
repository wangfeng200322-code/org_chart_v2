import request from 'supertest';
import app from '../../src/app.js';

describe('Upload API', () => {
  test('upload requires file', async () => {
    const res = await request(app).post('/api/upload/csv');
    expect(res.statusCode).toBe(400);
  });
});