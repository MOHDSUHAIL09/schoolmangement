import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import { generateToken } from '../utils/generateToken.js';
import './setup.js';

describe('Attendance System & Absence Notification Tests', () => {
  let teacherToken, teacherUser, studentRecord, parentUser, parentToken;

  beforeAll(async () => {
    teacherUser = await User.create({
      name: 'Teacher Attendance',
      email: 'teacher.attend@schoolsphere.com',
      password: 'password123',
      role: 'teacher'
    });
    teacherToken = generateToken(teacherUser);

    parentUser = await User.create({
      name: 'Parent Attend',
      email: 'parent.attend@schoolsphere.com',
      password: 'password123',
      role: 'parent'
    });
    parentToken = generateToken(parentUser);

    studentRecord = await Student.create({
      studentId: 'STU-ATT-001',
      admissionNumber: 'ADM-ATT-001',
      rollNumber: '1',
      firstName: 'Oliver',
      lastName: 'Queen',
      name: 'Oliver Queen',
      dateOfBirth: '2011-01-01',
      gender: 'Male',
      classGrade: 'Class 8',
      section: 'A',
      parentIds: [parentUser._id]
    });
  });

  it('should mark attendance as Present', async () => {
    const today = new Date().toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/attendance/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classGrade: 'Class 8',
        section: 'A',
        date: today,
        records: [
          {
            studentId: studentRecord._id,
            status: 'Present',
            remarks: 'On time'
          }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const recordInDb = await Attendance.findOne({ studentId: studentRecord._id });
    expect(recordInDb).not.toBeNull();
    expect(recordInDb.status).toBe('Present');
  });

  it('should update rather than duplicate record when re-marking same student and date', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Update from Present to Absent
    const res = await request(app)
      .post('/api/attendance/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classGrade: 'Class 8',
        section: 'A',
        date: today,
        records: [
          {
            studentId: studentRecord._id,
            status: 'Absent',
            remarks: 'Verified sick leave'
          }
        ]
      });

    expect(res.status).toBe(200);

    const count = await Attendance.countDocuments({ studentId: studentRecord._id });
    expect(count).toBe(1); // No duplicates!

    const updated = await Attendance.findOne({ studentId: studentRecord._id });
    expect(updated.status).toBe('Absent');
  });

  it('should calculate attendance percentage accurately in student summary', async () => {
    // Add additional historical days
    const pastDate1 = new Date(Date.now() - 24 * 60 * 60 * 1000);
    pastDate1.setHours(0, 0, 0, 0);

    await Attendance.create({
      studentId: studentRecord._id,
      classGrade: 'Class 8',
      section: 'A',
      date: pastDate1,
      status: 'Present',
      markedBy: teacherUser._id
    });

    const res = await request(app)
      .get(`/api/attendance/student/${studentRecord._id}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalDays).toBe(2);
    // 1 present, 1 absent = 50%
    expect(res.body.data.summary.percentage).toBe(50);
  });
});
