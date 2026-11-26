import 'dotenv/config';
import mongoose from 'mongoose';
import Fee from './models/Fee.js';
import Student from './models/Student.js';
import { ENV } from './config/env.js';

async function migrateFeeStudentNames() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    const uri = process.env.MONGO_URI || ENV.MONGO_URI || 'mongodb+srv://suhailmohd7799_db_user:tvXT9LSrfvXTG2Wp@cluster0.ojmhmmx.mongodb.net/schoolmanagement?retryWrites=true&w=majority';
    await mongoose.connect(uri);
    console.log('Connected! Scanning fee records...');

    const fees = await Fee.find({});
    console.log(`Found ${fees.length} fee records.`);

    let updatedCount = 0;
    for (const fee of fees) {
      if (!fee.studentName || !fee.rollNumber) {
        const student = await Student.findById(fee.studentId);
        if (student) {
          fee.studentName = student.name || 'Student';
          fee.rollNumber = student.rollNumber || '';
          fee.admissionNumber = student.admissionNumber || '';
          if (fee.payments && fee.payments.length > 0) {
            fee.payments.forEach(p => {
              if (!p.studentName) p.studentName = student.name;
            });
          }
          await fee.save();
          updatedCount++;
          console.log(`Updated Fee ${fee._id} with Student Name: ${student.name}`);
        }
      }
    }

    console.log(`Successfully migrated ${updatedCount} fee records with persistent Student Names in MongoDB Atlas!`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateFeeStudentNames();
