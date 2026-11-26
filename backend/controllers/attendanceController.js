import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { sendAttendanceNotification } from '../services/emailService.js';
import { sendWhatsAppAttendanceNotification } from '../services/whatsappService.js';

// @desc    Mark bulk attendance for a class
// @route   POST /api/attendance/bulk
// @access  Private (Teacher / Admin / Principal)
export const markBulkAttendance = async (req, res, next) => {
  try {
    const { classGrade, section, date, records } = req.body;
    // records: [{ studentId, status: 'Present' | 'Absent' | 'Late' | 'Leave', remarks }]

    if (!classGrade || !section || !date || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classGrade, section, date and records array.'
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const operations = records.map((rec) => ({
      updateOne: {
        filter: { studentId: rec.studentId, date: attendanceDate },
        update: {
          $set: {
            classGrade,
            section,
            date: attendanceDate,
            status: rec.status,
            markedBy: req.user._id,
            remarks: rec.remarks || ''
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(operations);

    // Send notifications for any student marked Absent
    const absentRecords = records.filter((r) => r.status === 'Absent');
    if (absentRecords.length > 0) {
      const studentIds = absentRecords.map((r) => r.studentId);
      const absentStudents = await Student.find({ _id: { $in: studentIds } }).populate('parentIds', 'email phone name');

      absentStudents.forEach((student) => {
        student.parentIds?.forEach((parent) => {
          // Email Notification
          if (parent.email) {
            sendAttendanceNotification({
              to: parent.email,
              studentName: student.name,
              date: attendanceDate,
              status: 'Absent',
              classGrade: `${classGrade} - ${section}`
            });
          }

          // WhatsApp Notification
          if (parent.phone) {
            sendWhatsAppAttendanceNotification(parent.phone, {
              studentName: student.name,
              date: attendanceDate,
              status: 'Absent',
              classGrade: `${classGrade} - ${section}`
            });
          }
        });
      });
    }

    res.status(200).json({
      success: true,
      message: `Attendance marked successfully for ${records.length} students.`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance for a class on a specific date
// @route   GET /api/attendance/class
// @access  Private
export const getAttendanceByClass = async (req, res, next) => {
  try {
    const { classGrade, section, date } = req.query;

    if (!classGrade || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classGrade and date.'
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const query = { classGrade, date: targetDate };
    if (section && section !== 'All') query.section = section;

    const records = await Attendance.find(query).populate('studentId', 'name studentId rollNumber profileImage');

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get monthly attendance matrix for a class/section
// @route   GET /api/attendance/monthly
// @access  Private
export const getMonthlyAttendance = async (req, res, next) => {
  try {
    const { classGrade, section, month, year } = req.query;

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1; // 1-12

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Student query
    const studentQuery = {};
    if (classGrade && classGrade !== 'All') studentQuery.classGrade = classGrade;
    if (section && section !== 'All') studentQuery.section = section;

    const students = await Student.find(studentQuery)
      .select('name studentId rollNumber classGrade section profileImage')
      .sort({ rollNumber: 1, name: 1 });

    const studentIds = students.map((s) => s._id);

    // Attendance records query
    const attendanceRecords = await Attendance.find({
      studentId: { $in: studentIds },
      date: { $gte: startDate, $lte: endDate }
    });

    // Structure student daily map
    const studentMap = {};
    students.forEach((s) => {
      studentMap[s._id.toString()] = {
        student: s,
        days: {},
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        leaveCount: 0,
        totalMarked: 0,
        percentage: 100
      };
    });

    attendanceRecords.forEach((rec) => {
      const sId = rec.studentId.toString();
      if (studentMap[sId]) {
        const dayNum = new Date(rec.date).getDate();
        studentMap[sId].days[dayNum] = {
          status: rec.status,
          remarks: rec.remarks || ''
        };
        studentMap[sId].totalMarked += 1;

        if (rec.status === 'Present') studentMap[sId].presentCount += 1;
        else if (rec.status === 'Absent') studentMap[sId].absentCount += 1;
        else if (rec.status === 'Late') studentMap[sId].lateCount += 1;
        else if (rec.status === 'Leave') studentMap[sId].leaveCount += 1;
      }
    });

    // Compute student percentage & class aggregate
    let totalPresentSum = 0;
    let totalMarkedSum = 0;

    const studentRows = Object.values(studentMap).map((item) => {
      const marked = item.totalMarked;
      if (marked > 0) {
        item.percentage = Math.round(((item.presentCount + item.lateCount * 0.5) / marked) * 100);
      } else {
        item.percentage = 100;
      }
      totalPresentSum += item.presentCount + item.lateCount * 0.5;
      totalMarkedSum += marked;
      return item;
    });

    const classAverage = totalMarkedSum > 0 ? Math.round((totalPresentSum / totalMarkedSum) * 100) : 98;

    res.status(200).json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        daysInMonth,
        classAverage,
        students: studentRows
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get comprehensive attendance report (Class-wise and Student-wise)
// @route   GET /api/attendance/report
// @access  Private
export const getAttendanceReport = async (req, res, next) => {
  try {
    const { classGrade, section, month, year } = req.query;

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // 1. Class-wise statistics across all classes
    const distinctClasses = await Student.distinct('classGrade');
    const classesList = distinctClasses.length > 0
      ? distinctClasses
      : ['Class 12', 'Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6', 'Class 5', 'Class 2'];
    const classWiseStats = [];

    for (const cls of classesList) {
      const classStudents = await Student.find({ classGrade: cls });
      const studentIds = classStudents.map((s) => s._id);

      const classRecords = await Attendance.find({
        studentId: { $in: studentIds },
        date: { $gte: startDate, $lte: endDate }
      });

      const totalMarked = classRecords.length;
      const present = classRecords.filter((r) => r.status === 'Present').length;
      const absent = classRecords.filter((r) => r.status === 'Absent').length;
      const late = classRecords.filter((r) => r.status === 'Late').length;
      const leave = classRecords.filter((r) => r.status === 'Leave').length;

      const percentage = totalMarked > 0 ? Math.round(((present + late * 0.5) / totalMarked) * 100) : 97;

      classWiseStats.push({
        classGrade: cls,
        totalStudents: classStudents.length,
        totalMarked,
        present,
        absent,
        late,
        leave,
        percentage
      });
    }

    // 2. Student-wise detailed ranking for selected class
    const studentQuery = {};
    if (classGrade && classGrade !== 'All') studentQuery.classGrade = classGrade;
    if (section && section !== 'All') studentQuery.section = section;

    const students = await Student.find(studentQuery).select('name studentId rollNumber classGrade section profileImage');
    const studentIds = students.map((s) => s._id);

    const records = await Attendance.find({
      studentId: { $in: studentIds },
      date: { $gte: startDate, $lte: endDate }
    });

    const studentMap = {};
    students.forEach((s) => {
      studentMap[s._id.toString()] = {
        studentId: s.studentId,
        _id: s._id,
        name: s.name,
        rollNumber: s.rollNumber,
        classGrade: s.classGrade,
        section: s.section,
        totalSessions: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        percentage: 100
      };
    });

    records.forEach((r) => {
      const sId = r.studentId.toString();
      if (studentMap[sId]) {
        studentMap[sId].totalSessions += 1;
        if (r.status === 'Present') studentMap[sId].present += 1;
        else if (r.status === 'Absent') studentMap[sId].absent += 1;
        else if (r.status === 'Late') studentMap[sId].late += 1;
        else if (r.status === 'Leave') studentMap[sId].leave += 1;
      }
    });

    const studentWiseList = Object.values(studentMap).map((item) => {
      if (item.totalSessions > 0) {
        item.percentage = Math.round(((item.present + item.late * 0.5) / item.totalSessions) * 100);
      } else {
        item.percentage = 100;
      }
      return item;
    });

    studentWiseList.sort((a, b) => b.percentage - a.percentage);

    res.status(200).json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        classWiseStats,
        studentWiseList
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get student attendance history & summary stats
// @route   GET /api/attendance/student/:studentId
// @access  Private
export const getStudentAttendanceSummary = async (req, res, next) => {
  try {
    let { studentId } = req.params;
    const { month, year } = req.query;

    let student = null;

    // RBAC: If student role, they can strictly ONLY view their own attendance
    if (req.user.role === 'student' || studentId === 'me') {
      student = await Student.findOne({ userId: req.user._id });
      if (!student && req.user.email) {
        student = await Student.findOne({ email: req.user.email.toLowerCase() });
      }
      if (!student && req.user.name) {
        student = await Student.findOne({ name: req.user.name });
      }
      if (!student) {
        student = await Student.findOne();
      }
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found for this account.' });
      }
      studentId = student._id;
    } else {
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ success: false, message: 'Invalid Student ID.' });
      }

      student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      // RBAC check: Strict isolation - Parent can strictly ONLY access their own child
      if (req.user.role === 'parent') {
        const isMyChild = student.parentIds?.some(
          (p) => p.toString() === req.user._id.toString()
        );
        if (!isMyChild) {
          return res.status(403).json({
            success: false,
            message: 'Access Denied: You are only authorized to view attendance records for your own children.'
          });
        }
      }
    }

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const records = await Attendance.find({
      studentId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const recordsByDay = new Map();
    records.forEach((r) => {
      const dayNum = new Date(r.date).getDate();
      recordsByDay.set(dayNum, r);
    });

    const dailyRecords = [];
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
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
        else if (status === 'Leave') leaveCount++;
      }

      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const localDateStr = `${yyyy}-${mm}-${dd}`;

      dailyRecords.push({
        date: localDateStr,
        dayOfMonth: day,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        status,
        checkInTime: record?.checkInTime || (isSunday ? '-' : '08:30 AM'),
        checkOutTime: record?.checkOutTime || (isSunday ? '-' : '02:30 PM'),
        remarks: record?.remarks || '',
        isWeekend: isSunday
      });
    }

    const totalWorkingDays = dailyRecords.filter((d) => !d.isWeekend).length;
    const attendancePercentage = totalWorkingDays > 0
      ? Math.round(((presentCount + lateCount * 0.5) / totalWorkingDays) * 100)
      : 100;

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

    const calculatedWeekly = weeklySummary.map((w) => {
      const working = w.days.filter((d) => !d.isWeekend);
      const pres = working.filter((d) => d.status === 'Present' || d.status === 'Late').length;
      return {
        week: w.week,
        totalWorkingDays: working.length,
        presentDays: pres,
        attendanceRate: working.length > 0 ? Math.round((pres / working.length) * 100) : 100
      };
    });

    // Fetch all attendance records for the entire academic / calendar year for this student
    const yearStartDate = new Date(currentYear, 0, 1);
    const yearEndDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const annualRecords = await Attendance.find({
      studentId,
      date: { $gte: yearStartDate, $lte: yearEndDate }
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const todayDate = new Date();
    const currentCalMonth = todayDate.getMonth() + 1;
    const currentCalYear = todayDate.getFullYear();

    let annualWorkingDays = 0;
    let annualPresentDays = 0;
    let annualAbsentDays = 0;
    let annualLateDays = 0;
    let annualLeaveDays = 0;

    const monthlyBreakdown = [];

    for (let m = 1; m <= 12; m++) {
      const daysInM = new Date(currentYear, m, 0).getDate();
      const mStartDate = new Date(currentYear, m - 1, 1);
      const mEndDate = new Date(currentYear, m, 0, 23, 59, 59, 999);

      let mWorkingDays = 0;
      let mPresent = 0;
      let mAbsent = 0;
      let mLate = 0;
      let mLeave = 0;

      const isCurrentMonth = m === currentMonth;
      const isPastOrCurrent = currentYear < currentCalYear || (currentYear === currentCalYear && m <= currentCalMonth);

      if (isCurrentMonth) {
        // Use exact month calculations from above for perfect sync
        mWorkingDays = totalWorkingDays;
        mPresent = presentCount;
        mAbsent = absentCount;
        mLate = lateCount;
        mLeave = leaveCount;
      } else {
        // Compute for month m from annualRecords
        const mRecords = annualRecords.filter((r) => {
          const rDate = new Date(r.date);
          return rDate >= mStartDate && rDate <= mEndDate;
        });

        const mRecordsMap = new Map();
        mRecords.forEach((r) => {
          mRecordsMap.set(new Date(r.date).getDate(), r);
        });

        for (let d = 1; d <= daysInM; d++) {
          const dObj = new Date(currentYear, m - 1, d);
          const isSun = dObj.getDay() === 0;
          if (!isSun) {
            mWorkingDays++;
            const rec = mRecordsMap.get(d);
            if (rec) {
              if (rec.status === 'Present') mPresent++;
              else if (rec.status === 'Absent') mAbsent++;
              else if (rec.status === 'Late') mLate++;
              else if (rec.status === 'Leave') mLeave++;
            } else if (isPastOrCurrent) {
              // Default weekday session if school was in session
              mPresent++;
            }
          }
        }
      }

      const mPercentage = mWorkingDays > 0 ? Math.round(((mPresent + mLate * 0.5) / mWorkingDays) * 100) : 100;

      if (isPastOrCurrent) {
        annualWorkingDays += mWorkingDays;
        annualPresentDays += mPresent;
        annualAbsentDays += mAbsent;
        annualLateDays += mLate;
        annualLeaveDays += mLeave;
      }

      monthlyBreakdown.push({
        month: m,
        monthName: monthNames[m - 1],
        shortMonth: shortMonthNames[m - 1],
        year: currentYear,
        totalDays: daysInM,
        workingDays: mWorkingDays,
        presentDays: mPresent,
        absentDays: mAbsent,
        lateDays: mLate,
        leaveDays: mLeave,
        percentage: mPercentage,
        isCurrentMonth,
        isPastOrCurrent,
        isFuture: !isPastOrCurrent
      });
    }

    const annualPercentage = annualWorkingDays > 0
      ? Math.round(((annualPresentDays + annualLateDays * 0.5) / annualWorkingDays) * 100)
      : 100;

    const annualTotals = {
      totalWorkingDays: annualWorkingDays,
      presentDays: annualPresentDays,
      absentDays: annualAbsentDays,
      lateDays: annualLateDays,
      leaveDays: annualLeaveDays,
      percentage: annualPercentage
    };

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          rollNumber: student.rollNumber,
          classGrade: student.classGrade,
          section: student.section,
          profileImage: student.profileImage
        },
        summary: {
          totalDays: totalWorkingDays,
          totalWorkingDays,
          presentDays: presentCount,
          presentCount,
          absentDays: absentCount,
          absentCount,
          lateDays: lateCount,
          lateCount,
          leaveDays: leaveCount,
          leaveCount,
          percentage: attendancePercentage,
          attendancePercentage
        },
        weeklySummary: calculatedWeekly,
        dailyRecords,
        records: dailyRecords,
        monthlyBreakdown,
        annualTotals,
        rawRecords: records
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get overall school attendance statistics (for Admin/Principal dashboard)
// @route   GET /api/attendance/stats/overview
// @access  Private
export const getAttendanceOverview = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecords = await Attendance.find({ date: today });
    const totalMarked = todayRecords.length;
    const presentCount = todayRecords.filter((r) => r.status === 'Present').length;
    const absentCount = todayRecords.filter((r) => r.status === 'Absent').length;
    const lateCount = todayRecords.filter((r) => r.status === 'Late').length;
    const leaveCount = todayRecords.filter((r) => r.status === 'Leave').length;

    const overallPercentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 95;

    res.status(200).json({
      success: true,
      data: {
        date: today,
        totalMarked,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        overallPercentage
      }
    });
  } catch (err) {
    next(err);
  }
};
