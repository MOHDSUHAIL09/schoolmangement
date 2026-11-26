import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import Fee from './models/Fee.js';
import Student from './models/Student.js';

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const fees = await Fee.find().populate('studentId', 'name rollNumber classGrade section');
    console.log('Count:', fees.length);
    fees.forEach(f => {
      console.log(`Student: ${f.studentId?.name} | Total: ${f.totalAmount} | Paid: ${f.paidAmount} | Remaining: ${f.remainingAmount} | Status: ${f.status}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
