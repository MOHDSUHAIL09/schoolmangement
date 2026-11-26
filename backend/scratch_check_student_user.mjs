import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';
import Student from './models/Student.js';

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const studentUsers = await User.find({ role: 'student' }).select('name email role');
  console.log('Student Users:', studentUsers);
  const students = await Student.find().select('name email studentId userId');
  console.log('Students in DB:', students);
  await mongoose.disconnect();
}
check();
