import Homework from '../models/Homework.js';
import Student from '../models/Student.js';
import { sendHomeworkNotification } from '../services/emailService.js';

// @desc    Get all homework with filters
// @route   GET /api/homework
// @access  Private
export const getAllHomework = async (req, res, next) => {
  try {
    const { classGrade, section, subject, search, studentId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (classGrade) query.classGrade = classGrade;
    if (section && section !== 'All') query.section = section;
    if (subject) query.subject = subject;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Role-based scoping
    if (req.user.role === 'teacher') {
      query.teacherId = req.user._id;
    } else if (req.user.role === 'parent') {
      if (studentId) {
        const student = await Student.findOne({ _id: studentId, parentIds: req.user._id });
        if (student) {
          query.classGrade = student.classGrade;
        }
      } else if (!classGrade) {
        const myChildren = await Student.find({ parentIds: req.user._id });
        query.classGrade = { $in: myChildren.map((c) => c.classGrade) };
      }
    } else if (req.user.role === 'student') {
      if (!classGrade) {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
          query.classGrade = student.classGrade;
        }
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Homework.countDocuments(query);
    const homeworkList = await Homework.find(query)
      .populate('teacherId', 'name email')
      .populate('submissions.studentId', 'name studentId rollNumber profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        homework: homeworkList,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)) || 1
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single homework detail
// @route   GET /api/homework/:id
// @access  Private
export const getHomeworkById = async (req, res, next) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('submissions.studentId', 'name studentId rollNumber classGrade section profileImage');

    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework assignment not found' });
    }

    res.status(200).json({ success: true, data: homework });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new homework assignment
// @route   POST /api/homework
// @access  Private (Teacher / Admin / Principal)
export const createHomework = async (req, res, next) => {
  try {
    const { classGrade, section, subject, title, description, dueDate, attachments } = req.body;

    if (!classGrade || !subject || !title || !description || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classGrade, subject, title, description and dueDate.'
      });
    }

    const homework = await Homework.create({
      teacherId: req.user._id,
      classGrade,
      section: section || 'All',
      subject,
      title,
      description,
      dueDate,
      attachments: Array.isArray(attachments) ? attachments : attachments ? [attachments] : []
    });

    // Notify students / parents in background
    const students = await Student.find({ classGrade }).populate('parentIds');
    students.forEach((student) => {
      student.parentIds?.forEach((parent) => {
        if (parent.email) {
          sendHomeworkNotification({
            to: parent.email,
            studentName: student.name,
            title,
            subject,
            dueDate
          });
        }
      });
    });

    res.status(201).json({
      success: true,
      message: 'Homework created successfully',
      data: homework
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit homework by student
// @route   POST /api/homework/:id/submit
// @access  Private (Student)
export const submitHomework = async (req, res, next) => {
  try {
    const { studentId, fileUrl, textSubmission } = req.body;
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework assignment not found' });
    }

    // Determine target student ID
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(400).json({ success: false, message: 'No student record associated with this account' });
      }
      targetStudentId = student._id;
    }

    // Check if already submitted
    const existingIndex = homework.submissions.findIndex(
      (s) => s.studentId.toString() === targetStudentId.toString()
    );

    const isLate = new Date() > new Date(homework.dueDate);

    const submissionData = {
      studentId: targetStudentId,
      fileUrl: fileUrl || '',
      textSubmission: textSubmission || '',
      submittedAt: new Date(),
      status: isLate ? 'Late' : 'Submitted'
    };

    if (existingIndex >= 0) {
      homework.submissions[existingIndex] = {
        ...homework.submissions[existingIndex].toObject(),
        ...submissionData
      };
    } else {
      homework.submissions.push(submissionData);
    }

    await homework.save();

    res.status(200).json({
      success: true,
      message: 'Homework submitted successfully',
      data: homework
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Grade student homework submission
// @route   PUT /api/homework/:id/grade
// @access  Private (Teacher / Admin / Principal)
export const gradeSubmission = async (req, res, next) => {
  try {
    const { submissionId, marks, teacherRemarks, status } = req.body;
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }

    const sub = homework.submissions.id(submissionId);
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (marks !== undefined) sub.marks = Number(marks);
    if (teacherRemarks !== undefined) sub.teacherRemarks = teacherRemarks;
    sub.status = status || 'Reviewed';

    await homework.save();

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: homework
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete homework
// @route   DELETE /api/homework/:id
// @access  Private (Teacher / Admin)
export const deleteHomework = async (req, res, next) => {
  try {
    const homework = await Homework.findByIdAndDelete(req.params.id);
    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }
    res.status(200).json({ success: true, message: 'Homework deleted' });
  } catch (err) {
    next(err);
  }
};
