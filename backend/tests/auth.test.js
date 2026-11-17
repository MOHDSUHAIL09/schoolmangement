import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import User from '../models/User.js';
import './setup.js';

describe('Authentication & Security Tests', () => {
  let adminUser;

  beforeAll(async () => {
    adminUser = await User.create({
      name: 'Dr. Sterling Admin',
      email: 'admin.auth@schoolsphere.com',
      password: 'SecurePassword123!',
      role: 'super_admin'
    });
  });

  it('should successfully authenticate with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.auth@schoolsphere.com',
        password: 'SecurePassword123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('admin.auth@schoolsphere.com');
    expect(res.body.data.user.role).toBe('super_admin');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('should reject login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.auth@schoolsphere.com',
        password: 'WrongPassword999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('should reject login for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody@nowhere.com',
        password: 'Password123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should enforce password hashing and never store plaintext passwords', async () => {
    const userInDb = await User.findOne({ email: 'admin.auth@schoolsphere.com' }).select('+password');
    expect(userInDb.password).not.toBe('SecurePassword123!');
    expect(userInDb.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash signature
  });

  it('should block unauthorized requests without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should block requests with malformed or invalid JWT', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_garbage_token_123');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should enforce role-based access control (RBAC) on protected endpoints', async () => {
    // Create a student user
    const student = await User.create({
      name: 'Pupil Johnny',
      email: 'johnny.student@schoolsphere.com',
      password: 'password123',
      role: 'student'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'johnny.student@schoolsphere.com', password: 'password123' });

    const studentToken = loginRes.body.data.token;

    // Student attempts to access payroll (restricted to super_admin and principal)
    const payrollRes = await request(app)
      .get('/api/payroll')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(payrollRes.status).toBe(403);
    expect(payrollRes.body.success).toBe(false);
  });
});
