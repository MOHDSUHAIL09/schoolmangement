import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Attendance from './models/Attendance.js';
import Student from './models/Student.js';

async function inspectAndSeed() {
  await mongoose.connect(process.env.MONGO_URI);
  const student = await Student.findOne({ name: 'Aarav Sharma' });
  console.log('Student Aarav Sharma ID:', student._id);

  const existingCount = await Attendance.countDocuments({ studentId: student._id });
  console.log('Existing attendance records for Aarav:', existingCount);

  // If there are very few records, let's create a realistic full-year attendance history for Aarav
  // with absent days in different months so the user sees real numbers for every month!
  // E.g.: Jan: 1 absent, Feb: 0, Mar: 2, Apr: 1, May: 1, Jun: 0, Jul: 3, Aug: 1, Sep: 2, Oct: 4, Nov: 3, Dec: 0
  const monthlyAbsentsConfig = {
    1: [14],             // Jan 14
    2: [],               // Feb 0
    3: [10, 24],         // Mar 10, 24
    4: [18],             // Apr 18
    5: [8],              // May 8
    6: [],               // Jun 0
    7: [7, 15, 22],      // Jul 7, 15, 22
    8: [12],             // Aug 12
    9: [9, 23],          // Sep 9, 23
    10: [6, 13, 20, 27], // Oct 6, 13, 20, 27
    11: [5, 12, 19],     // Nov 5, 12, 19
    12: []               // Dec 0
  };

  const monthlyLateConfig = {
    1: [20],
    3: [15],
    7: [11],
    9: [4],
    10: [18],
    11: [8, 22]
  };

  // Check if we already have records for each month, otherwise insert
  const operations = [];
  const year = 2026;

  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(year, m, 0).getDate();
    const absents = monthlyAbsentsConfig[m] || [];
    const lates = monthlyLateConfig[m] || [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, m - 1, d);
      dateObj.setHours(0, 0, 0, 0);
      const isSunday = dateObj.getDay() === 0;

      let status = 'Present';
      let remarks = 'Attended regular class session';
      let checkIn = '08:25 AM';
      let checkOut = '02:30 PM';

      if (isSunday) {
        status = 'Weekend';
        remarks = 'Sunday Holiday';
        checkIn = '-';
        checkOut = '-';
      } else if (absents.includes(d)) {
        status = 'Absent';
        remarks = 'Unexcused absence - parent notified via SMS';
        checkIn = '-';
        checkOut = '-';
      } else if (lates.includes(d)) {
        status = 'Late';
        remarks = 'Late arrival by 20 mins';
        checkIn = '08:50 AM';
        checkOut = '02:30 PM';
      }

      operations.push({
        updateOne: {
          filter: { studentId: student._id, date: dateObj },
          update: {
            $set: {
              studentId: student._id,
              classGrade: student.classGrade || 'Class 8',
              section: student.section || 'A',
              date: dateObj,
              status,
              checkInTime: checkIn,
              checkOutTime: checkOut,
              remarks
            }
          },
          upsert: true
        }
      });
    }
  }

  console.log(`Writing ${operations.length} days of attendance records...`);
  const res = await Attendance.bulkWrite(operations);
  console.log('Bulk write finished:', res.upsertedCount, 'upserted,', res.modifiedCount, 'modified');

  await mongoose.disconnect();
}

inspectAndSeed();
