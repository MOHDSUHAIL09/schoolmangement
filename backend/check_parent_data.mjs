import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const students = await mongoose.connection.collection('students').find({}).toArray();
  for (const s of students) {
    const count = await mongoose.connection.collection('attendances').countDocuments({ studentId: s._id });
    const presents = await mongoose.connection.collection('attendances').countDocuments({ studentId: s._id, status: 'Present' });
    const absents = await mongoose.connection.collection('attendances').countDocuments({ studentId: s._id, status: 'Absent' });
    console.log(`${s.name} (${s.classGrade}-${s.section}): total=${count}, present=${presents}, absent=${absents}`);
  }
  await mongoose.disconnect();
}

run().catch(console.error);
