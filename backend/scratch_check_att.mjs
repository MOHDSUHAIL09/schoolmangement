import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Attendance from './models/Attendance.js';
import Student from './models/Student.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await Attendance.countDocuments();
  console.log("Total Attendance docs:", total);
  const sample = await Attendance.find().limit(3);
  console.log("Sample docs:", sample);
  const students = await Student.find().select("name studentId rollNumber").limit(5);
  console.log("Students:", students);
  await mongoose.disconnect();
}
run();
