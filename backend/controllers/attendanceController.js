import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
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
    const classesList = ['Class 10', 'Class 9', 'Class 8', 'Class 7', 'Class 6', 'Class 5', 'Class 2'];
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
    const { studentId } = req.params;
    const { month, year } = req.query;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // RBAC check: Parent can only access their child
    if (req.user.role === 'parent') {
      const isMyChild = student.parentIds?.some(
        (p) => p.toString() === req.user._id.toString()
      );
      if (!isMyChild) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to student attendance' });
      }
    } else if (req.user.role === 'student') {
      if (student.userId && student.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to student attendance' });
      }
    }

    const query = { studentId };

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === 'Present').length;
    const absentDays = records.filter((r) => r.status === 'Absent').length;
    const lateDays = records.filter((r) => r.status === 'Late').length;
    const leaveDays = records.filter((r) => r.status === 'Leave').length;

    const percentage = totalDays > 0 ? Math.round(((presentDays + lateDays * 0.5) / totalDays) * 100) : 100;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          leaveDays,
          percentage
        },
        records
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
