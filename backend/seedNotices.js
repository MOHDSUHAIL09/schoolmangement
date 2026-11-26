import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Notice from './models/Notice.js';
import User from './models/User.js';

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const count = await Notice.countDocuments();
  console.log('Total notices in DB:', count);

  if (count === 0) {
    const admin = await User.findOne({ role: 'super_admin' });
    if (admin) {
      await Notice.create([
        {
          type: 'Notice',
          title: 'Winter Break & Annual Sports Day Schedule',
          description: 'The school campus will observe winter recess starting from Dec 24, 2026. The Annual Sports Day meet will be held on Dec 20, 2026. All students are advised to collect their event jerseys from their house captains.',
          targetRole: 'all',
          isPublished: true,
          createdBy: admin._id
        },
        {
          type: 'Urgent',
          title: 'Parent-Teacher Meeting (PTM) & Term Progress Review',
          description: 'Quarterly Parent-Teacher Meeting is scheduled for Saturday, 9:00 AM to 1:00 PM. Parents are requested to visit respective classrooms to discuss academic progress and term evaluations.',
          targetRole: 'parent',
          isPublished: true,
          createdBy: admin._id
        },
        {
          type: 'Event',
          title: 'Science & Innovation Exhibition 2026',
          description: 'Inter-house Science and AI innovation projects will be showcased in the school auditorium. Students are encouraged to prepare their working models by Dec 15.',
          eventDate: new Date('2026-12-18'),
          targetRole: 'student',
          isPublished: true,
          createdBy: admin._id
        }
      ]);
      console.log('Sample starter notices created successfully!');
    }
  }

  await mongoose.disconnect();
}
check();
