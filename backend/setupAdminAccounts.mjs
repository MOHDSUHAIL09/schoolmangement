import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';

async function setup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas\n');

  // 1. Update or create Admin accounts
  // admin@schoolsphere.com -> role: 'admin'
  let admin1 = await User.findOne({ email: 'admin@schoolsphere.com' });
  if (admin1) {
    admin1.role = 'admin';
    admin1.name = 'Dr. Evelyn Sterling';
    admin1.password = 'admin123';
    admin1.status = 'active';
    admin1.isActive = true;
    await admin1.save();
    console.log('Updated admin@schoolsphere.com -> role: admin');
  } else {
    admin1 = await User.create({
      name: 'Dr. Evelyn Sterling',
      email: 'admin@schoolsphere.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      isActive: true
    });
    console.log('Created admin@schoolsphere.com -> role: admin');
  }

  // admin@school.com -> role: 'admin'
  let admin2 = await User.findOne({ email: 'admin@school.com' });
  if (admin2) {
    admin2.role = 'admin';
    admin2.name = 'Admin';
    admin2.password = 'admin123';
    admin2.status = 'active';
    admin2.isActive = true;
    await admin2.save();
    console.log('Updated admin@school.com -> role: admin');
  } else {
    admin2 = await User.create({
      name: 'Admin',
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      isActive: true
    });
    console.log('Created admin@school.com -> role: admin');
  }

  // 2. Update or create Super Admin accounts
  // superadmin@schoolsphere.com -> role: 'super_admin'
  let superAdmin1 = await User.findOne({ email: 'superadmin@schoolsphere.com' });
  if (superAdmin1) {
    superAdmin1.role = 'super_admin';
    superAdmin1.name = 'Super Administrator';
    superAdmin1.password = 'admin123';
    superAdmin1.status = 'active';
    superAdmin1.isActive = true;
    await superAdmin1.save();
    console.log('Updated superadmin@schoolsphere.com -> role: super_admin');
  } else {
    superAdmin1 = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@schoolsphere.com',
      password: 'admin123',
      role: 'super_admin',
      status: 'active',
      isActive: true
    });
    console.log('Created superadmin@schoolsphere.com -> role: super_admin');
  }

  // superadmin@school.com -> role: 'super_admin'
  let superAdmin2 = await User.findOne({ email: 'superadmin@school.com' });
  if (superAdmin2) {
    superAdmin2.role = 'super_admin';
    superAdmin2.name = 'Super Administrator';
    superAdmin2.password = 'admin123';
    superAdmin2.status = 'active';
    superAdmin2.isActive = true;
    await superAdmin2.save();
    console.log('Updated superadmin@school.com -> role: super_admin');
  } else {
    superAdmin2 = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@school.com',
      password: 'admin123',
      role: 'super_admin',
      status: 'active',
      isActive: true
    });
    console.log('Created superadmin@school.com -> role: super_admin');
  }

  console.log('\n=== CURRENT USERS SUMMARY ===');
  const all = await User.find({}, 'name email role status').lean();
  all.forEach((u, idx) => {
    console.log(`${idx + 1}. [${u.role.padEnd(12)}] ${u.name} <${u.email}>`);
  });

  await mongoose.disconnect();
}

setup().catch(console.error);
