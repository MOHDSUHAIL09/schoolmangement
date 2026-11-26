import TeacherAttendance from '../models/TeacherAttendance.js';
import User from '../models/User.js';

// @desc    Get all teachers daily attendance for a specific date
// @route   GET /api/teacher-attendance/daily
// @access  Private (Super Admin Only)
export const getDailyAttendance = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const teachers = await User.find({ role: 'teacher' }).select('name email phone profileImage').sort({ name: 1 });
    const records = await TeacherAttendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const recordMap = new Map();
    records.forEach((r) => {
      recordMap.set(r.teacherId.toString(), r);
    });

    const data = teachers.map((teacher) => {
      const record = recordMap.get(teacher._id.toString());
      return {
        teacher,
        record: record || null,
        status: record ? record.status : 'Present',
        checkInTime: record ? record.checkInTime : '08:00 AM',
        checkOutTime: record ? record.checkOutTime : '03:30 PM',
        remarks: record ? record.remarks : ''
      };
    });

    res.status(200).json({
      success: true,
      date: targetDate.toISOString().slice(0, 10),
      totalTeachers: teachers.length,
      data
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Save/Update teachers daily attendance
// @route   POST /api/teacher-attendance/daily
// @access  Private (Super Admin Only)
export const saveDailyAttendance = async (req, res, next) => {
  try {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Date and records array are required' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(12, 0, 0, 0);

    const operations = records.map((item) => ({
      updateOne: {
        filter: {
          teacherId: item.teacherId,
          date: {
            $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            $lte: new Date(new Date(date).setHours(23, 59, 59, 999))
          }
        },
        update: {
          $set: {
            teacherId: item.teacherId,
            date: targetDate,
            status: item.status || 'Present',
            checkInTime: item.checkInTime || '08:00 AM',
            checkOutTime: item.checkOutTime || '03:30 PM',
            remarks: item.remarks || '',
            markedBy: req.user._id
          }
        },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await TeacherAttendance.bulkWrite(operations);
    }

    res.status(200).json({
      success: true,
      message: `Teacher attendance saved successfully for ${date}`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get individual teacher's separate attendance table with daily, weekly & monthly stats
// @route   GET /api/teacher-attendance/teacher/:teacherId
// @access  Private (Super Admin Only)
export const getTeacherAttendanceHistory = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { month, year } = req.query;

    const teacher = await User.findById(teacherId).select('name email phone profileImage role');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const records = await TeacherAttendance.find({
      teacherId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const recordsByDay = new Map();
    records.forEach((r) => {
      const dayNum = new Date(r.date).getDate();
      recordsByDay.set(dayNum, r);
    });

    // Build complete daily timeline for the month
    const dailyRecords = [];
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(currentYear, currentMonth - 1, day);
      const isSunday = dateObj.getDay() === 0;
      const record = recordsByDay.get(day);

      const status = record ? record.status : isSunday ? 'Weekend' : 'Present';
      if (!isSunday) {
        if (status === 'Present') presentCount++;
        else if (status === 'Absent') absentCount++;
        else if (status === 'Late') lateCount++;
        else if (status === 'Half Day') halfDayCount++;
        else if (status === 'On Leave') leaveCount++;
      }

      dailyRecords.push({
        date: dateObj.toISOString().slice(0, 10),
        dayOfMonth: day,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        status,
        checkInTime: record ? record.checkInTime : (isSunday ? '-' : '08:00 AM'),
        checkOutTime: record ? record.checkOutTime : (isSunday ? '-' : '03:30 PM'),
        remarks: record ? record.remarks : '',
        isWeekend: isSunday
      });
    }

    // Weekly Summary breakdown
    const weeklySummary = [
      { week: 'Week 1 (Days 1–7)', days: dailyRecords.slice(0, 7) },
      { week: 'Week 2 (Days 8–14)', days: dailyRecords.slice(7, 14) },
      { week: 'Week 3 (Days 15–21)', days: dailyRecords.slice(14, 21) },
      { week: 'Week 4 (Days 22–28)', days: dailyRecords.slice(21, 28) }
    ];
    if (totalDaysInMonth > 28) {
      weeklySummary.push({
        week: `Week 5 (Days 29–${totalDaysInMonth})`,
        days: dailyRecords.slice(28)
      });
    }

    weeklySummary.forEach((w) => {
      const working = w.days.filter((d) => !d.isWeekend);
      const pres = working.filter((d) => d.status === 'Present' || d.status === 'Late').length;
      w.totalWorkingDays = working.length;
      w.presentDays = pres;
      w.attendanceRate = working.length > 0 ? Math.round((pres / working.length) * 100) : 100;
    });

    const workingDaysCount = dailyRecords.filter((d) => !d.isWeekend).length;
    const attendancePercentage = workingDaysCount > 0
      ? (((presentCount + lateCount * 0.8 + halfDayCount * 0.5) / workingDaysCount) * 100).toFixed(1)
      : '100.0';

    res.status(200).json({
      success: true,
      data: {
        teacher,
        month: currentMonth,
        year: currentYear,
        summary: {
          totalWorkingDays: workingDaysCount,
          presentCount,
          absentCount,
          lateCount,
          halfDayCount,
          leaveCount,
          attendancePercentage: parseFloat(attendancePercentage)
        },
        dailyRecords,
        weeklySummary
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get monthly overview matrix for all teachers
// @route   GET /api/teacher-attendance/monthly
// @access  Private (Super Admin Only)
export const getMonthlyRegister = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    const totalDays = new Date(currentYear, currentMonth, 0).getDate();

    const teachers = await User.find({ role: 'teacher' }).select('name email phone profileImage').sort({ name: 1 });
    const records = await TeacherAttendance.find({
      date: { $gte: startDate, $lte: endDate }
    });

    // Map: teacherId -> { dayNumber: status }
    const matrix = {};
    teachers.forEach((t) => {
      matrix[t._id.toString()] = {};
    });

    records.forEach((r) => {
      const dayNum = new Date(r.date).getDate();
      const tId = r.teacherId.toString();
      if (matrix[tId]) {
        matrix[tId][dayNum] = r.status;
      }
    });

    // Compute stats for each teacher
    const result = teachers.map((teacher) => {
      const teacherRecords = matrix[teacher._id.toString()] || {};
      let present = 0;
      let absent = 0;
      let late = 0;
      let workingDays = 0;

      for (let d = 1; d <= totalDays; d++) {
        const dateObj = new Date(currentYear, currentMonth - 1, d);
        if (dateObj.getDay() !== 0) {
          workingDays++;
          const st = teacherRecords[d] || 'Present';
          if (st === 'Present') present++;
          else if (st === 'Absent') absent++;
          else if (st === 'Late') late++;
        }
      }

      const percentage = workingDays > 0 ? Math.round(((present + late * 0.8) / workingDays) * 100) : 100;

      return {
        teacher,
        days: teacherRecords,
        totalWorkingDays: workingDays,
        present,
        absent,
        late,
        percentage
      };
    });

    res.status(200).json({
      success: true,
      month: currentMonth,
      year: currentYear,
      totalDays,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
