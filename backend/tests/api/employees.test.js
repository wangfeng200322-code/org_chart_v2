// Placeholder tests
import request from 'supertest';
import app from '../../src/app.js';

describe('Employees API', () => {
  const skip = process.env.SKIP_DB_TESTS === '1';
  const maybe = skip ? test.skip : test;

  maybe('search returns 200', async () => {
    process.env.TEST_API_KEY = 'test-key';
    const res = await request(app)
      .get('/api/employees/search?q=John')
      .set('X-API-Key', 'test-key');
    expect(res.statusCode).toBe(200);
  });
});
