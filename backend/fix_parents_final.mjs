import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection.db;
const students = db.collection('students');
const users = db.collection('users');

// Get both parent user IDs
const parent1 = await users.findOne({ email: 'parent@schoolsphere.com' });
const parent2 = await users.findOne({ email: 'parent@school.com' });

console.log('parent@schoolsphere.com _id:', parent1?._id);
console.log('parent@school.com _id:', parent2?._id);

// Get kasim's _id
const kasim = await students.findOne({ name: { $regex: 'kasim', $options: 'i' } });
console.log('kasim _id:', kasim?._id, '| parentIds:', kasim?.parentIds);

// Remove both parent IDs from kasim's parentIds (just in case)
if (kasim) {
  await students.updateOne(
    { _id: kasim._id },
    { $set: { parentIds: [] } }
  );
  console.log('✅ Cleared kasim parentIds');
}

// Ensure Aarav, Ananya, Kabir have BOTH parent IDs
const sharma_children = ['Aarav Sharma', 'Ananya Sharma', 'Kabir Sharma'];
for (const childName of sharma_children) {
  const child = await students.findOne({ name: childName });
  if (child) {
    const newParentIds = [];
    if (parent1) newParentIds.push(parent1._id);
    if (parent2) newParentIds.push(parent2._id);
    
    await students.updateOne(
      { _id: child._id },
      { $set: { parentIds: newParentIds } }
    );
    console.log(`✅ ${childName} parentIds set to [parent1, parent2]`);
  } else {
    console.log(`❌ ${childName} NOT FOUND in students`);
  }
}

// Verify final state
console.log('\n=== FINAL VERIFICATION ===');
const allStudents = await students.find({}).toArray();
for (const s of allStudents) {
  console.log(`${s.name}: parentIds=[${s.parentIds?.join(', ')}]`);
}

await mongoose.disconnect();
console.log('\nDone!');
