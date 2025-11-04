import request from 'supertest';
import app from '../../src/app.js';

describe('Health API', () => {
  test('health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });
});