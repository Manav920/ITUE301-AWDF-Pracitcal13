// ==============================================================================
// ITUE301: Advanced Web Development Frameworks - Practical 12
// Student: Manav Lathiya (ID: 24CS048)
// Automated API Test Suite for CI/CD Pipeline with GitHub Actions
// ==============================================================================

const request = require('supertest');
const app = require('./server');

describe('Practical 12: CI/CD Automated Test Pipeline', () => {

  // Test 1: Root route status & metadata (Fixed pipeline - returns 200)
  test('GET / returns 200 and confirms API metadata', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200); // Fixed assertion: expects 200 and receives 200
    expect(res.body).toHaveProperty('student');
    expect(res.body.student).toContain('24CS048');
  });

  // Test 2 (Student Assignment): Health Check endpoint returns valid status
  test('GET /health returns 200 or 503 with service health info', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('service', 'task_manager_backend');
  });

  // Test 3: Event-Driven telemetry endpoint (Practical 10 integration)
  test('GET /events/history returns 200 and event history array', async () => {
    const res = await request(app).get('/events/history');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.history)).toBe(true);
  });

  // Test 4: Protected endpoint security validation
  test('GET /tasks without auth token returns 401 Unauthorized', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  // Test 5: 404 handler for undefined route
  test('GET /undefined-route returns 404 Route Not Found', async () => {
    const res = await request(app).get('/some-nonexistent-route-for-ci');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Route not found');
  });

  // ==============================================================================
  // PRACTICAL 13: AI API Integration & Graceful Degradation Tests
  // ==============================================================================

  // Test 6: AI Description Generation with Graceful Degradation Fallback
  test('POST /api/ai/generate-description returns 200 with editable description & disclaimer', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .send({ title: 'Configure JWT Authentication Pipeline' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('description');
    expect(typeof res.body.description).toBe('string');
    expect(res.body.description.length).toBeGreaterThan(10);
    expect(res.body).toHaveProperty('disclaimer');
    expect(res.body).toHaveProperty('fallback');
  }, 15000);

  // Test 7: Validation error when title is missing
  test('POST /api/ai/generate-description returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Task title is required');
  });

  // Test 8: Graceful fallback guarantees no crash on invalid API key
  test('POST /api/ai/generate-description gracefully falls back without throwing 500', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .send({ title: 'Build Docker Container with Multi-Stage Build' });

    expect(res.statusCode).toBe(200);
    expect(res.body.fallback).toBeDefined();
    expect(res.body.suggestedPriority).toMatch(/^(low|medium|high)$/);
  }, 15000);

  // Test 9 (Supplementary Problem 2): Rate limiting returns 429 on rapid consecutive requests
  test('POST /api/ai/generate-description enforces rate limiting (Supplementary Problem 2)', async () => {
    // First request
    const firstRes = await request(app)
      .post('/api/ai/generate-description')
      .set('x-client-id', 'test-rate-limit-user-1')
      .send({ title: 'Setup GitHub Actions CI' });
    expect(firstRes.statusCode).toBe(200);

    // Second immediate request from same client -> rate limit triggered
    const secondRes = await request(app)
      .post('/api/ai/generate-description')
      .set('x-client-id', 'test-rate-limit-user-1')
      .send({ title: 'Setup GitHub Actions CI Again' });
    expect(secondRes.statusCode).toBe(429);
    expect(secondRes.body).toHaveProperty('rateLimited', true);
    expect(secondRes.body).toHaveProperty('waitSeconds');
  }, 15000);
});

