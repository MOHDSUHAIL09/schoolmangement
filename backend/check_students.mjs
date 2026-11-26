import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected');

const db = mongoose.connection.db;
const students = db.collection('students');
const users = db.collection('users');

// Check students collection structure
const allStudents = await students.find({}).toArray();
console.log('Total students:', allStudents.length);
allStudents.forEach(s => {
  console.log('\nStudent:', s.name, '| class:', s.class, '| section:', s.section);
  console.log('  Keys:', Object.keys(s).join(', '));
  if (s.parentId) console.log('  parentId:', s.parentId);
  if (s.parentIds) console.log('  parentIds:', JSON.stringify(s.parentIds));
  if (s.guardianId) console.log('  guardianId:', s.guardianId);
  if (s.parent) console.log('  parent:', s.parent);
});

// Check parent users
const parents = await users.find({ role: 'parent' }).toArray();
console.log('\n=== PARENT USERS ===');
parents.forEach(p => {
  console.log('\nParent:', p.name, '| email:', p.email);
  console.log('  All keys:', Object.keys(p).join(', '));
  // Check any child-related fields
  Object.keys(p).forEach(k => {
    if (k.toLowerCase().includes('child') || k.toLowerCase().includes('student') || k.toLowerCase().includes('ward')) {
      console.log('  ' + k + ':', JSON.stringify(p[k]));
    }
  });
});

await mongoose.disconnect();
