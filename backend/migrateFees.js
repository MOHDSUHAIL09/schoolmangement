import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Fee from './models/Fee.js';

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const fees = await Fee.find();
    let updatedCount = 0;

    for (const f of fees) {
      const tot = Number(f.totalAmount) || 0;
      const pd = Number(f.paidAmount) || 0;
      const rem = Math.max(0, tot - pd);

      f.remainingAmount = rem;
      if (rem === 0 && tot > 0) {
        f.status = 'Paid';
      } else if (f.dueDate && new Date(f.dueDate) < new Date() && rem > 0) {
        f.status = 'Overdue';
      } else {
        f.status = 'Pending';
      }

      await f.save();
      updatedCount++;
      console.log(`Updated Fee ${f._id} -> Status: ${f.status}, Total: ${f.totalAmount}, Paid: ${f.paidAmount}, Remaining: ${f.remainingAmount}`);
    }

    console.log(`Successfully migrated ${updatedCount} fee records.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
