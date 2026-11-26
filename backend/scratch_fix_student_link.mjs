import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';
import Student from './models/Student.js';

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const u1 = await User.findOne({ email: 'student@school.com' });
  if (u1) {
    const res = await Student.updateOne(
      { name: 'Aarav Sharma' },
      { $set: { userId: u1._id, email: u1.email } }
    );
    console.log('Updated Student Aarav Sharma:', res);
  }
  await mongoose.disconnect();
}
fix();
