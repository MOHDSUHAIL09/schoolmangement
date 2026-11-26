// Script to list all users and their roles, and fix role issues
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  status: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas\n');

  // List all users
  const users = await User.find({}, 'name email role status').lean();
  console.log('=== ALL USERS IN DATABASE ===');
  users.forEach((u, i) => {
    console.log(`${i+1}. [${u.role.padEnd(12)}] ${u.name} <${u.email}> (${u.status})`);
  });

  // Find users who are super_admin but NOT the main system administrator
  // Keep only ONE super_admin (the first one created / "System Administrator")
  const superAdmins = users.filter(u => u.role === 'super_admin');
  console.log(`\n=== SUPER ADMINS (${superAdmins.length} found) ===`);
  superAdmins.forEach(u => console.log(`  - ${u.name} <${u.email}>`));

  await mongoose.disconnect();
}

main().catch(console.error);
