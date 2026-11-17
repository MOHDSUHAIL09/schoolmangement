import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Fee from '../models/Fee.js';
import './setup.js';

describe('Comprehensive Security Hardening & Penetration Defense Tests', () => {
  let superAdminToken;
  let teacherToken;
  let student1Token;
  let student2Token;
  let student1Record;
  let student2Record;
  let student2Fee;

  beforeAll(async () => {
    // 1. Create a Super Admin
    const adminUser = await User.create({
      name: 'Security Admin',
      email: 'secadmin@schoolsphere.com',
      password: 'SecAdminPassword123!',
      role: 'super_admin'
    });

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'secadmin@schoolsphere.com', password: 'SecAdminPassword123!' });
    superAdminToken = adminLoginRes.body.data.token;

    // 2. Create a Teacher
    const teacherUser = await User.create({
      name: 'Security Teacher',
      email: 'secteacher@schoolsphere.com',
      password: 'SecTeacherPassword123!',
      role: 'teacher'
    });
    const teacherLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'secteacher@schoolsphere.com', password: 'SecTeacherPassword123!' });
    teacherToken = teacherLoginRes.body.data.token;

    // 3. Create Student 1
    const student1User = await User.create({
      name: 'Alice Student',
      email: 'alice.student@schoolsphere.com',
      password: 'AlicePassword123!',
      role: 'student'
    });
    const s1LoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice.student@schoolsphere.com', password: 'AlicePassword123!' });
    student1Token = s1LoginRes.body.data.token;

    student1Record = await Student.create({
      name: 'Alice Student',
      firstName: 'Alice',
      lastName: 'Student',
      email: 'alice.student@schoolsphere.com',
      studentId: 'STU-SEC-001',
      dateOfBirth: new Date('2011-01-01'),
      gender: 'Female',
      userId: student1User._id,
      admissionNumber: 'SEC-STU-001',
      rollNumber: '101',
      classGrade: 'Class 9',
      section: 'A'
    });

    // 4. Create Student 2
    const student2User = await User.create({
      name: 'Bob Student',
      email: 'bob.student@schoolsphere.com',
      password: 'BobPassword123!',
      role: 'student'
    });
    const s2LoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob.student@schoolsphere.com', password: 'BobPassword123!' });
    student2Token = s2LoginRes.body.data.token;

    student2Record = await Student.create({
      name: 'Bob Student',
      firstName: 'Bob',
      lastName: 'Student',
      email: 'bob.student@schoolsphere.com',
      studentId: 'STU-SEC-002',
      dateOfBirth: new Date('2011-02-02'),
      gender: 'Male',
      userId: student2User._id,
      admissionNumber: 'SEC-STU-002',
      rollNumber: '102',
      classGrade: 'Class 9',
      section: 'A'
    });

    // Create a fee record for Student 2
    student2Fee = await Fee.create({
      studentId: student2Record._id,
      classGrade: 'Class 9',
      month: 'November',
      tuitionFee: 2500,
      totalAmount: 2500,
      paidAmount: 0,
      remainingAmount: 2500,
      status: 'Pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({ email: /secadmin|secteacher|alice\.student|bob\.student|hacker/ });
    await Student.deleteMany({ admissionNumber: /SEC-STU/ });
    if (student2Fee?._id) {
      await Fee.deleteMany({ _id: student2Fee._id });
    }
  }, 30000);

  // TEST 1: Enterprise Security Headers (Helmet)
  it('should deliver enterprise security headers on HTTP responses (Helmet Hardening)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  // TEST 2: Anti-Privilege Escalation in Public Registration
  it('should block unauthenticated attempts to self-register as super_admin, principal, or teacher', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker SuperAdmin',
        email: 'hacker.admin@evil.com',
        password: 'HackerPassword123!',
        role: 'super_admin'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Privilege escalation rejected/i);

    // Verify user was NOT created
    const hacker = await User.findOne({ email: 'hacker.admin@evil.com' });
    expect(hacker).toBeNull();
  });

  // TEST 3: Safe Public Registration for Student
  it('should allow legitimate public self-registration for students', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Legit New Student',
        email: 'legit.student@schoolsphere.com',
        password: 'StudentPassword123!',
        role: 'student'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('student');

    // Clean up
    await User.deleteOne({ email: 'legit.student@schoolsphere.com' });
  });

  // TEST 4: NoSQL Injection Neutralization
  it('should sanitize and strip NoSQL injection operators ($gt, $ne) from request body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: { $gt: '' },
        password: 'Password123!'
      });

    // Because email was an object with $gt, the sanitizer stripped it, leading to missing email validation
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // TEST 5: XSS Script Injection Sanitization
  it('should sanitize dangerous XSS script tags from user inputs', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        receiverId: student2Record.userId,
        message: 'Hello <script>alert("XSS Attack!")</script>world!'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.message).toBe('Hello world!');
    expect(res.body.data.message).not.toContain('<script>');
  });

  // TEST 6: Parameter Pollution Defense
  it('should protect against HTTP parameter pollution arrays without server errors', async () => {
    const res = await request(app)
      .get('/api/students?page=1&page=2&search=Alice&search=Test')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // TEST 7: RBAC Protection - Students blocked from Payroll
  it('should strictly forbid students and parents from accessing payroll records (RBAC)', async () => {
    const res = await request(app)
      .get('/api/payroll')
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // TEST 8: IDOR Defense - Student cannot view another student fee invoice
  it('should strictly forbid a student from accessing another student fee receipt by ID (IDOR)', async () => {
    const res = await request(app)
      .get(`/api/fees/${student2Fee._id}`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Unauthorized access/i);
  });

  // TEST 9: Algorithm Pinning - Reject forged JWTs with "none" or malformed signatures
  it('should reject forged or unsigned JWT tokens', async () => {
    const fakeToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6IjEyMzQ1NiIsInJvbGUiOiJzdXBlcl9hZG1pbiJ9.';
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // TEST 10: Anti-User Enumeration
  it('should return identical error messages for non-existent users and incorrect passwords', async () => {
    const resNonExistent = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost.user.999@schoolsphere.com', password: 'SomePassword123!' });

    const resWrongPass = await request(app)
      .post('/api/auth/login')
      .send({ email: 'secadmin@schoolsphere.com', password: 'CompletelyWrongPassword!' });

    expect(resNonExistent.status).toBe(401);
    expect(resWrongPass.status).toBe(401);
    expect(resNonExistent.body.message).toBe(resWrongPass.body.message);
  });

  // TEST 11: Account Lockout after Consecutive Failed Attempts
  it('should trigger account lockout (HTTP 423) after 5 consecutive failed login attempts', async () => {
    const testUser = await User.create({
      name: 'Brute Force Target',
      email: 'target.brute@schoolsphere.com',
      password: 'RealTargetPassword123!',
      role: 'teacher'
    });

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'target.brute@schoolsphere.com', password: 'WrongPasswordAttempt' });
    }

    const lockedRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'target.brute@schoolsphere.com', password: 'RealTargetPassword123!' });

    expect(lockedRes.status).toBe(423);
    expect(lockedRes.body.success).toBe(false);
    expect(lockedRes.body.message).toMatch(/temporarily locked/i);
  });

  // TEST 12: Anti-Reconnaissance Technology Concealment
  it('should not expose X-Powered-By header to callers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  // TEST 13: ReDoS & Regex Metacharacters Neutralization
  it('should safely handle and sanitize regex metacharacters in query parameters without throwing errors', async () => {
    const res = await request(app)
      .get('/api/users?search=.*+?^${}()|[]\\')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // TEST 14: Weak Password Rejection
  it('should reject common weak passwords on registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak Pass User',
        email: 'weakpass@schoolsphere.com',
        password: 'password'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/too common/i);
  });

  // TEST 15: Session Revocation / Token Invalidation after Password Change
  it('should invalidate old JWT tokens after the user changes their password', async () => {
    // 1. Create a user
    const victimUser = await User.create({
      name: 'Session Revocation Target',
      email: 'revocation.target@schoolsphere.com',
      password: 'InitialPassword123!',
      role: 'student'
    });

    // 2. Log in and get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'revocation.target@schoolsphere.com', password: 'InitialPassword123!' });
    const oldToken = loginRes.body.data.token;

    // 3. Change password with old token
    const changeRes = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${oldToken}`)
      .send({
        currentPassword: 'InitialPassword123!',
        newPassword: 'BrandNewSecurePassword456!'
      });
    expect(changeRes.status).toBe(200);

    // 4. Try using the oldToken again on a protected endpoint
    const protectedRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);

    expect(protectedRes.status).toBe(401);
    expect(protectedRes.body.message).toMatch(/recently changed/i);
  });
});
