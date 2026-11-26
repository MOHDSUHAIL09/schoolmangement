import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas\n');

  // 1. Admin account -> role: 'admin'
  let admin = await User.findOne({ email: 'admin@school.com' });
  if (admin) {
    admin.role = 'admin';
    admin.name = 'Admin';
    admin.password = 'admin123';
    admin.isActive = true;
    admin.status = 'active';
    await admin.save();
    console.log('admin@school.com -> role: admin');
  } else {
    await User.create({
      name: 'Admin',
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      status: 'active'
    });
    console.log('Created admin@school.com -> role: admin');
  }

  // 2. Super Admin accounts -> role: 'super_admin'
  // superadmin@school.com
  let sa1 = await User.findOne({ email: 'superadmin@school.com' });
  if (sa1) {
    sa1.role = 'super_admin';
    sa1.name = 'Super Administrator';
    sa1.password = 'admin123';
    sa1.isActive = true;
    sa1.status = 'active';
    await sa1.save();
    console.log('superadmin@school.com -> role: super_admin');
  } else {
    await User.create({
      name: 'Super Administrator',
      email: 'superadmin@school.com',
      password: 'admin123',
      role: 'super_admin',
      isActive: true,
      status: 'active'
    });
    console.log('Created superadmin@school.com -> role: super_admin');
  }

  // superadmin@schoolsphere.com
  let sa2 = await User.findOne({ email: 'superadmin@schoolsphere.com' });
  if (sa2) {
    sa2.role = 'super_admin';
    sa2.name = 'Super Administrator';
    sa2.password = 'admin123';
    sa2.isActive = true;
    sa2.status = 'active';
    await sa2.save();
    console.log('superadmin@schoolsphere.com -> role: super_admin');
  } else {
    await User.create({
      name: 'Super Administrator',
      email: 'superadmin@schoolsphere.com',
      password: 'admin123',
      role: 'super_admin',
      isActive: true,
      status: 'active'
    });
    console.log('Created superadmin@schoolsphere.com -> role: super_admin');
  }

  // admin@schoolsphere.com -> restore to super_admin (legacy alias)
  let sa3 = await User.findOne({ email: 'admin@schoolsphere.com' });
  if (sa3) {
    sa3.role = 'super_admin';
    sa3.name = 'Dr. Evelyn Sterling';
    sa3.password = 'admin123';
    sa3.isActive = true;
    sa3.status = 'active';
    await sa3.save();
    console.log('admin@schoolsphere.com -> role: super_admin');
  }

  console.log('\n=== ALL USERS STATUS ===');
  const all = await User.find({}, 'name email role status').lean();
  all.forEach((u, i) => console.log(`${i+1}. [${u.role.padEnd(12)}] ${u.name} <${u.email}>`));

  await mongoose.disconnect();
}

fix().catch(console.error);
