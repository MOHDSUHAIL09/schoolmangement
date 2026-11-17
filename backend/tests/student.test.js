import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { generateToken } from '../utils/generateToken.js';
import './setup.js';

describe('Student Management & Multi-Child System Tests', () => {
  let adminToken, parentToken, strangerParentToken, parentUser;

  beforeAll(async () => {
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin.studenttest@schoolsphere.com',
      password: 'password123',
      role: 'super_admin'
    });
    adminToken = generateToken(admin);

    parentUser = await User.create({
      name: 'Parent User',
      email: 'parent.studenttest@schoolsphere.com',
      password: 'password123',
      role: 'parent'
    });
    parentToken = generateToken(parentUser);

    const strangerParent = await User.create({
      name: 'Stranger Parent',
      email: 'stranger.parent@schoolsphere.com',
      password: 'password123',
      role: 'parent'
    });
    strangerParentToken = generateToken(strangerParent);
  });

  it('should allow admin to create a student with firstName and lastName', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Emma',
        lastName: 'Watson',
        dateOfBirth: '2011-05-15',
        gender: 'Female',
        classGrade: 'Class 8',
        section: 'A',
        rollNumber: '801',
        admissionNumber: 'ADM-2026-TEST01',
        parentIds: [parentUser._id]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Emma Watson');
    expect(res.body.data.admissionNumber).toBe('ADM-2026-TEST01');
  });

  it('should prevent duplicate admission number', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Another',
        lastName: 'Student',
        name: 'Another Student',
        dateOfBirth: '2011-06-20',
        gender: 'Male',
        classGrade: 'Class 8',
        section: 'A',
        rollNumber: '802',
        admissionNumber: 'ADM-2026-TEST01' // Duplicate!
      });

    expect(res.status).toBe(400); // Handled duplicate error
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/duplicate/i);
  });

  it('should allow parent to retrieve only their linked children (Multi-Child Parent System)', async () => {
    // Create second child for the same parent
    const createRes = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Leo',
        lastName: 'Watson',
        dateOfBirth: '2014-08-10',
        gender: 'Male',
        classGrade: 'Class 5',
        section: 'B',
        rollNumber: '501',
        admissionNumber: 'ADM-2026-TEST02',
        parentIds: [parentUser._id]
      });

    expect(createRes.status).toBe(201);

    const res = await request(app)
      .get('/api/students/my-children')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.map((c) => c.name)).toEqual(expect.arrayContaining(['Emma Watson', 'Leo Watson']));
  });

  it('should strictly forbid another parent from viewing non-linked child record', async () => {
    const child = await Student.findOne({ admissionNumber: 'ADM-2026-TEST01' });

    const res = await request(app)
      .get(`/api/students/${child._id}`)
      .set('Authorization', `Bearer ${strangerParentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
