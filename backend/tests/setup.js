import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Helper to create test users with tokens
export const createTestUsers = async () => {
  const admin = await User.create({
    name: 'Test Admin',
    email: 'admin.test@schoolsphere.com',
    password: 'password123',
    role: 'super_admin'
  });

  const principal = await User.create({
    name: 'Test Principal',
    email: 'principal.test@schoolsphere.com',
    password: 'password123',
    role: 'principal'
  });

  const teacher = await User.create({
    name: 'Test Teacher',
    email: 'teacher.test@schoolsphere.com',
    password: 'password123',
    role: 'teacher'
  });

  const parent = await User.create({
    name: 'Test Parent',
    email: 'parent.test@schoolsphere.com',
    password: 'password123',
    role: 'parent'
  });

  const student = await User.create({
    name: 'Test Student',
    email: 'student.test@schoolsphere.com',
    password: 'password123',
    role: 'student'
  });

  return {
    admin: { user: admin, token: generateToken(admin) },
    principal: { user: principal, token: generateToken(principal) },
    teacher: { user: teacher, token: generateToken(teacher) },
    parent: { user: parent, token: generateToken(parent) },
    student: { user: student, token: generateToken(student) }
  };
};
