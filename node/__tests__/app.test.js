const request = require('supertest');
const app = require('../index');

describe('API Health Check', () => {
  test('GET /health should return OK', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('OK');
  });
});

describe('API Root Endpoint', () => {
  test('GET / should return HTML content', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });
});
