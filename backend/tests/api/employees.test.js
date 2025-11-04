// Placeholder tests
import request from 'supertest';
import app from '../../src/app.js';

describe('Employees API', () => {
  test('search returns 200', async () => {
    const res = await request(app).get('/api/employees/search?q=John');
    expect(res.statusCode).toBe(200);
  });
});
