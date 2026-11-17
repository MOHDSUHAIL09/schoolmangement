import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Fee from '../models/Fee.js';
import { generateToken } from '../utils/generateToken.js';
import './setup.js';

describe('Fee & Bursary Management Tests', () => {
  let adminToken, parentToken, strangerToken, student;

  beforeAll(async () => {
    const admin = await User.create({
      name: 'Fee Admin',
      email: 'admin.fee@schoolsphere.com',
      password: 'password123',
      role: 'super_admin'
    });
    adminToken = generateToken(admin);

    const parent = await User.create({
      name: 'Fee Parent',
      email: 'parent.fee@schoolsphere.com',
      password: 'password123',
      role: 'parent'
    });
    parentToken = generateToken(parent);

    const stranger = await User.create({
      name: 'Stranger',
      email: 'stranger.fee@schoolsphere.com',
      password: 'password123',
      role: 'parent'
    });
    strangerToken = generateToken(stranger);

    student = await Student.create({
      studentId: 'STU-FEE-001',
      admissionNumber: 'ADM-FEE-001',
      rollNumber: '1',
      firstName: 'Chloe',
      lastName: 'Decker',
      name: 'Chloe Decker',
      dateOfBirth: '2012-04-10',
      gender: 'Female',
      classGrade: 'Class 8',
      section: 'A',
      parentIds: [parent._id]
    });
  });

  it('should automatically calculate total amount from breakdown fields on creation', async () => {
    const res = await request(app)
      .post('/api/fees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: student._id,
        classGrade: 'Class 8',
        month: 'November 2026',
        tuition: 500,
        game: 50,
        transport: 100,
        exam: 50,
        events: 30,
        other: 20,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const created = res.body.data;
    // 500 + 50 + 100 + 50 + 30 + 20 = 750
    expect(created.totalAmount).toBe(750);
    expect(created.remainingAmount).toBe(750);
    expect(created.status).toBe('Pending');
  });

  it('should update remaining amount and transition status to Partial on partial payment', async () => {
    const fee = await Fee.findOne({ studentId: student._id });

    const res = await request(app)
      .put(`/api/fees/${fee._id}/pay`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 350,
        paymentMethod: 'Credit Card',
        remarks: 'Partial installment'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.paidAmount).toBe(350);
    expect(res.body.data.remainingAmount).toBe(400); // 750 - 350 = 400
    expect(res.body.data.status).toBe('Partial');
  });

  it('should transition status to Paid when full balance is settled', async () => {
    const fee = await Fee.findOne({ studentId: student._id });

    const res = await request(app)
      .put(`/api/fees/${fee._id}/pay`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 400,
        paymentMethod: 'Bank Transfer'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.paidAmount).toBe(750);
    expect(res.body.data.remainingAmount).toBe(0);
    expect(res.body.data.status).toBe('Paid');
  });

  it('should prevent non-authorized parents from viewing fee receipts of other children', async () => {
    const fee = await Fee.findOne({ studentId: student._id });

    const res = await request(app)
      .get(`/api/fees/${fee._id}`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
