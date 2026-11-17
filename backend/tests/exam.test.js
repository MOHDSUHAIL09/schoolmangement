import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Exam from '../models/Exam.js';
import { generateToken } from '../utils/generateToken.js';
import { generateExamQuestions } from '../services/aiExamService.js';
import './setup.js';

describe('Exam System & Gemini AI MCQ Engine Tests', () => {
  let teacherToken, studentToken, studentUser, studentRecord;

  beforeAll(async () => {
    const teacher = await User.create({
      name: 'Dr. Exam Creator',
      email: 'teacher.exam@schoolsphere.com',
      password: 'password123',
      role: 'teacher'
    });
    teacherToken = generateToken(teacher);

    studentUser = await User.create({
      name: 'Pupil Alice',
      email: 'alice.exam@schoolsphere.com',
      password: 'password123',
      role: 'student'
    });
    studentToken = generateToken(studentUser);

    studentRecord = await Student.create({
      userId: studentUser._id,
      studentId: 'STU-EXAM-001',
      admissionNumber: 'ADM-EXAM-001',
      rollNumber: '1',
      firstName: 'Alice',
      lastName: 'Wonderland',
      name: 'Alice Wonderland',
      dateOfBirth: '2011-03-12',
      gender: 'Female',
      classGrade: 'Class 8',
      section: 'A'
    });
  });

  it('should validate AI Exam Generator service output format and fallback safety', async () => {
    const result = await generateExamQuestions({
      classGrade: 'Class 8',
      subject: 'Science',
      topic: 'Force and Pressure',
      difficulty: 'Medium',
      numberOfQuestions: 4
    });

    expect(result.success).toBe(true);
    expect(result.questions).toBeInstanceOf(Array);
    expect(result.questions.length).toBe(4);

    const firstQ = result.questions[0];
    expect(firstQ).toHaveProperty('question');
    expect(firstQ).toHaveProperty('options');
    expect(firstQ.options.length).toBe(4);
    expect(firstQ).toHaveProperty('correctAnswer');
    expect(firstQ).toHaveProperty('marks');
    expect(firstQ).toHaveProperty('explanation');
  });

  it('should allow teacher to create and publish an exam', async () => {
    const res = await request(app)
      .post('/api/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Midterm Science Assessment',
        classGrade: 'Class 8',
        section: 'A',
        subject: 'Science',
        durationMinutes: 30,
        questions: [
          {
            question: 'What is the unit of Force?',
            options: ['Newton', 'Pascal', 'Watt', 'Joule'],
            correctAnswer: 0,
            marks: 5,
            explanation: 'Force is measured in Newtons (N).'
          },
          {
            question: 'Atmospheric pressure is measured with which instrument?',
            options: ['Thermometer', 'Barometer', 'Voltmeter', 'Anemometer'],
            correctAnswer: 1,
            marks: 5,
            explanation: 'A barometer measures atmospheric pressure.'
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalMarks).toBe(10);
    expect(res.body.data.status).toBe('Published');
  });

  it('should protect correct answers from students before submission', async () => {
    const exam = await Exam.findOne({ title: 'Midterm Science Assessment' });

    const res = await request(app)
      .get(`/api/exams/${exam._id}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.hasSubmitted).toBe(false);

    // Ensure correctAnswer is stripped for anti-cheat
    const firstQ = res.body.data.questions[0];
    expect(firstQ).not.toHaveProperty('correctAnswer');
    expect(firstQ).not.toHaveProperty('explanation');
  });

  it('should auto-grade student exam submission with instant scoring and pass/fail status', async () => {
    const exam = await Exam.findOne({ title: 'Midterm Science Assessment' });

    // Submit: answer Q0 correctly (0) and Q1 correctly (1)
    const res = await request(app)
      .post(`/api/exams/${exam._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: studentRecord._id,
        answers: [
          { questionIndex: 0, selectedOption: 0 },
          { questionIndex: 1, selectedOption: 1 }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBe(10);
    expect(res.body.data.totalMarks).toBe(10);
    expect(res.body.data.percentage).toBe(100);
    expect(res.body.data.isPassed).toBe(true);
  });
});
