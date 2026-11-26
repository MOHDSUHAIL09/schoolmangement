import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

// Find all users
const kasim = await User.findOne({ name: /kasim/i });
console.log('kasim khan:', kasim ? kasim._id.toString() : 'NOT FOUND');
console.log('kasim parentIds:', JSON.stringify(kasim?.parentIds));

const parent1 = await User.findOne({ email: 'parent@schoolsphere.com' });
console.log('\nparent@schoolsphere.com childrenIds:', JSON.stringify(parent1?.childrenIds));

const parent2 = await User.findOne({ email: 'parent@school.com' });
console.log('parent@school.com childrenIds:', JSON.stringify(parent2?.childrenIds));

// Get kasim's _id
const kasimId = kasim?._id;

if (kasimId) {
  // Remove kasim from both parents' childrenIds
  const r1 = await User.updateOne(
    { email: 'parent@schoolsphere.com' },
    { $pull: { childrenIds: kasimId } }
  );
  console.log('\nRemoved kasim from parent@schoolsphere childrenIds:', r1.modifiedCount);

  const r2 = await User.updateOne(
    { email: 'parent@school.com' },
    { $pull: { childrenIds: kasimId } }
  );
  console.log('Removed kasim from parent@school.com childrenIds:', r2.modifiedCount);

  // Also clear kasim's parentIds completely
  const r3 = await User.updateOne(
    { _id: kasimId },
    { $set: { parentIds: [] } }
  );
  console.log('Cleared kasim parentIds:', r3.modifiedCount);
}

// Verify final state
const p1Final = await User.findOne({ email: 'parent@schoolsphere.com' });
const p2Final = await User.findOne({ email: 'parent@school.com' });
const kasimFinal = await User.findOne({ name: /kasim/i });

console.log('\n--- FINAL STATE ---');
console.log('parent@schoolsphere childrenIds:', JSON.stringify(p1Final?.childrenIds));
console.log('parent@school.com childrenIds:', JSON.stringify(p2Final?.childrenIds));
console.log('kasim parentIds:', JSON.stringify(kasimFinal?.parentIds));

await mongoose.disconnect();
console.log('Done!');
