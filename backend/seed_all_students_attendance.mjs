import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Attendance = mongoose.connection.collection('attendances');
  const students = await mongoose.connection.collection('students').find({}).toArray();

  const year = 2026;
  const currentMonth = 11; // November 2026

  for (const s of students) {
    const existingCount = await Attendance.countDocuments({ studentId: s._id });
    if (existingCount >= 100) {
      console.log(`Skipping ${s.name}, already has ${existingCount} records`);
      continue;
    }

    console.log(`Seeding attendance for ${s.name} (${s.classGrade}-${s.section})...`);
    const newRecords = [];

    // Distinct absence profile per student
    // Kasim Khan: e.g. 15 absents
    // Ananya: 2 absents
    // Kabir: 4 absents
    // Rohan: 8 absents
    // Liam, Maya, Lucas: 5, 3, 6 absents
    let targetAbsentsPerYear = 12;
    if (s.name.toLowerCase().includes('kasim')) targetAbsentsPerYear = 14;
    else if (s.name.toLowerCase().includes('ananya')) targetAbsentsPerYear = 4;
    else if (s.name.toLowerCase().includes('kabir')) targetAbsentsPerYear = 6;
    else if (s.name.toLowerCase().includes('rohan')) targetAbsentsPerYear = 9;

    let totalAbsentsCreated = 0;

    for (let month = 1; month <= 12; month++) {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(Date.UTC(year, month - 1, day, 4, 30, 0));
        const dayOfWeek = d.getUTCDay();
        const isSunday = dayOfWeek === 0;

        let status = 'Present';
        let checkIn = '08:25 AM';
        let checkOut = '02:30 PM';
        let remarks = '';

        if (isSunday) {
          status = 'Weekend';
          checkIn = '-';
          checkOut = '-';
        } else {
          // Check for absence pattern
          if (totalAbsentsCreated < targetAbsentsPerYear && day % 11 === 0 && Math.random() < 0.6) {
            status = 'Absent';
            checkIn = '-';
            checkOut = '-';
            remarks = 'Unexcused Absence';
            totalAbsentsCreated++;
          } else if (day % 17 === 0) {
            status = 'Late';
            checkIn = '09:05 AM';
            remarks = 'Late transit arrival';
          }
        }

        newRecords.push({
          studentId: s._id,
          classGrade: s.classGrade,
          section: s.section,
          date: d,
          status,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          remarks,
          isWeekend: isSunday,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (newRecords.length > 0) {
      await Attendance.insertMany(newRecords);
      console.log(`Inserted ${newRecords.length} records for ${s.name}`);
    }
  }

  // Verification
  console.log('=== VERIFICATION SUMMARY ===');
  for (const s of students) {
    const total = await Attendance.countDocuments({ studentId: s._id });
    const presents = await Attendance.countDocuments({ studentId: s._id, status: 'Present' });
    const absents = await Attendance.countDocuments({ studentId: s._id, status: 'Absent' });
    const late = await Attendance.countDocuments({ studentId: s._id, status: 'Late' });
    console.log(`${s.name} (${s.classGrade}): Total=${total}, Present=${presents}, Absent=${absents}, Late=${late}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
