import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected');

const db = mongoose.connection.db;

// List collections
const cols = await db.listCollections().toArray();
console.log('Collections:', cols.map(c => c.name));

// Check users collection raw
const users = db.collection('users');
const count = await users.countDocuments();
console.log('Total users:', count);

// Find a few sample docs
const samples = await users.find({}).limit(5).toArray();
samples.forEach(u => {
  console.log('\nUser:', u.name, '| role:', u.role, '| email:', u.email);
  console.log('  Keys:', Object.keys(u).join(', '));
  if (u.parentIds) console.log('  parentIds:', JSON.stringify(u.parentIds));
  if (u.childrenIds) console.log('  childrenIds:', JSON.stringify(u.childrenIds));
  if (u.children) console.log('  children:', JSON.stringify(u.children));
  if (u.parents) console.log('  parents:', JSON.stringify(u.parents));
});

// Find kasim specifically
const kasim = await users.findOne({ name: { $regex: 'kasim', $options: 'i' } });
if (kasim) {
  console.log('\n=== KASIM KHAN FULL DOC ===');
  console.log(JSON.stringify(kasim, null, 2));
} else {
  console.log('\nKasim not found, searching all names...');
  const allNames = await users.find({}).project({name:1, role:1}).toArray();
  allNames.forEach(u => console.log(' -', u.name, '(', u.role, ')'));
}

await mongoose.disconnect();
