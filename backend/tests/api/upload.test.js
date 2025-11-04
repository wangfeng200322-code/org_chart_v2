import request from 'supertest';
import app from '../../src/app.js';

describe('Upload API', () => {
  test('upload requires file', async () => {
    process.env.TEST_API_KEY = 'test-key';
    const res = await request(app)
      .post('/api/upload/csv')
      .set('X-API-Key', 'test-key');
    expect(res.statusCode).toBe(400);
  });
});