import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import {
  generateExamQuestions,
  generateQuestionPaper,
  analyzeExamDifficulty,
  analyzeStudentPerformance,
  identifyWeakSubjectsAndTopics
} from '../services/aiExamService.js';
import { sendExamNotification } from '../services/emailService.js';

// Helper: Calculate standard academic letter grade
export const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
export const getAllExams = async (req, res, next) => {
  try {
    const { classGrade, subject, status, studentId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (classGrade && classGrade !== 'All') query.classGrade = classGrade;
    if (subject && subject !== 'All') query.subject = subject;
    if (status && status !== 'All') query.status = status;

    // RBAC scoping
    if (req.user.role === 'parent') {
      if (studentId) {
        const student = await Student.findOne({ _id: studentId, parentIds: req.user._id });
        if (student) {
          query.classGrade = student.classGrade;
        }
      } else if (!classGrade || classGrade === 'All') {
        const myChildren = await Student.find({ parentIds: req.user._id });
        query.classGrade = { $in: myChildren.map((c) => c.classGrade) };
      }
    } else if (req.user.role === 'student') {
      if (!classGrade || classGrade === 'All') {
        const student = await Student.findOne({ userId: req.user._id });
        if (student) {
          query.classGrade = student.classGrade;
        }
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Exam.countDocuments(query);
    const exams = await Exam.find(query)
      .populate('createdBy', 'name email role')
      .populate('submissions.studentId', 'name studentId rollNumber admissionNumber profileImage firstName lastName')
      .select('-questions.correctAnswer -questions.explanation') // protect answers on listing
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        exams,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)) || 1
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single exam by ID
// @route   GET /api/exams/:id
// @access  Private
export const getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('submissions.studentId', 'name studentId rollNumber admissionNumber profileImage firstName lastName');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // RBAC: If student, check if already submitted.
    // If not submitted yet, strip correctAnswer and explanation to prevent cheating!
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      const hasSubmitted = student && exam.submissions.some((s) => s.studentId?._id?.toString() === student._id.toString());

      if (!hasSubmitted) {
        const examObj = exam.toObject();
        examObj.questions = examObj.questions.map((q) => {
          const { correctAnswer, explanation, ...rest } = q;
          return rest;
        });
        return res.status(200).json({ success: true, data: examObj, hasSubmitted: false });
      }
      return res.status(200).json({ success: true, data: exam, hasSubmitted: true });
    }

    res.status(200).json({ success: true, data: exam });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate AI MCQ Questions (Gemini)
// @route   POST /api/exams/ai-generate
// @access  Private (Teacher / Admin / Principal)
export const generateAIExam = async (req, res, next) => {
  try {
    const { classGrade, subject, topic, difficulty, numberOfQuestions } = req.body;

    if (!classGrade || !subject || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classGrade, subject and topic.'
      });
    }

    const aiResult = await generateExamQuestions({
      classGrade,
      subject,
      topic,
      difficulty: difficulty || 'Medium',
      numberOfQuestions: numberOfQuestions || 5
    });

    res.status(200).json({
      success: true,
      message: `Generated questions via ${aiResult.source}`,
      data: aiResult
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new exam (Manual, AI-Generated, or Official Exam Schedule)
// @route   POST /api/exams
// @access  Private (Teacher / Admin / Principal)
export const createExam = async (req, res, next) => {
  try {
    const {
      title,
      classGrade,
      section,
      subject,
      examType,
      roomNo,
      timeSlot,
      durationMinutes,
      createdByType,
      questions,
      startDate,
      endDate,
      totalMarks,
      passingMarks
    } = req.body;

    if (!title || !classGrade || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, classGrade and subject.'
      });
    }

    const qList = Array.isArray(questions) ? questions : [];
    const calculatedTotal = qList.length > 0
      ? qList.reduce((sum, q) => sum + (Number(q.marks) || 1), 0)
      : (Number(totalMarks) || 100);

    const calculatedPassing = Number(passingMarks) || Math.round(calculatedTotal * 0.4);

    const exam = await Exam.create({
      title,
      classGrade,
      section: section || 'All',
      subject,
      examType: examType || 'Term Examination',
      roomNo: roomNo || 'Main Examination Hall',
      timeSlot: timeSlot || '09:00 AM - 11:30 AM',
      durationMinutes: Number(durationMinutes) || 60,
      createdBy: req.user._id,
      createdByType: createdByType || (qList.length > 0 ? 'manual' : 'manual'),
      questions: qList,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalMarks: calculatedTotal,
      passingMarks: calculatedPassing,
      status: 'Published'
    });

    // Notify parents in background
    try {
      const students = await Student.find({ classGrade }).populate('parentIds');
      students.forEach((student) => {
        student.parentIds?.forEach((parent) => {
          if (parent?.email) {
            sendExamNotification({
              to: parent.email,
              studentName: student.name || `${student.firstName} ${student.lastName}`,
              title,
              subject,
              startDate: exam.startDate,
              durationMinutes: exam.durationMinutes
            });
          }
        });
      });
    } catch (notifErr) {
      console.warn('Exam parent notification notice:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Exam created and published successfully',
      data: exam
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit student exam answers with instant auto-grading
// @route   POST /api/exams/:id/submit
// @access  Private (Student)
export const submitExam = async (req, res, next) => {
  try {
    const { studentId, answers } = req.body;
    // answers: [{ questionIndex: 0, selectedOption: 1 }, ...]

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    let targetStudentId = studentId;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(400).json({ success: false, message: 'Student profile not found for this account' });
      }
      targetStudentId = student._id;
    } else if (!targetStudentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required for submission' });
    }

    // Auto-grading logic
    let score = 0;
    let totalMarks = 0;

    exam.questions.forEach((q, idx) => {
      const qMarks = q.marks || 1;
      totalMarks += qMarks;

      const userAns = answers?.find((a) => a.questionIndex === idx);
      if (userAns && userAns.selectedOption === q.correctAnswer) {
        score += qMarks;
      }
    });

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const isPassed = score >= (exam.passingMarks || Math.round(totalMarks * 0.4));
    const grade = calculateGrade(percentage);

    const submissionRecord = {
      studentId: targetStudentId,
      answers: answers || [],
      score,
      totalMarks,
      percentage,
      grade,
      rank: 1,
      teacherRemarks: isPassed ? 'Passed assessment with good accuracy' : 'Needs reinforcement in key areas',
      isPassed,
      submittedAt: new Date()
    };

    // Remove previous submission if exists and replace
    exam.submissions = exam.submissions.filter((s) => s.studentId?.toString() !== targetStudentId.toString());
    exam.submissions.push(submissionRecord);

    // Dynamic rank update
    exam.submissions.sort((a, b) => b.score - a.score);
    exam.submissions.forEach((sub, idx) => {
      sub.rank = idx + 1;
    });

    await exam.save();

    res.status(200).json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        score,
        totalMarks,
        percentage,
        grade,
        rank: submissionRecord.rank,
        isPassed,
        submittedAt: submissionRecord.submittedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk Record or Update Marks for an Exam by Teacher / Admin
// @route   POST /api/exams/:id/marks
// @access  Private (Teacher, Super Admin, Principal)
export const recordMarks = async (req, res, next) => {
  try {
    const { marksEntries } = req.body;
    // marksEntries: [{ studentId, marksObtained, teacherRemarks }]

    if (!Array.isArray(marksEntries)) {
      return res.status(400).json({ success: false, message: 'marksEntries array is required' });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const totalMarks = exam.totalMarks || 100;
    const passingMarks = exam.passingMarks || Math.round(totalMarks * 0.4);

    marksEntries.forEach((entry) => {
      const score = Math.max(0, Math.min(totalMarks, Number(entry.marksObtained) || 0));
      const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
      const grade = calculateGrade(percentage);
      const isPassed = score >= passingMarks;

      const existingIndex = exam.submissions.findIndex(
        (s) => s.studentId?.toString() === entry.studentId?.toString()
      );

      const record = {
        studentId: entry.studentId,
        answers: [],
        score,
        totalMarks,
        percentage,
        grade,
        rank: 1,
        teacherRemarks: entry.teacherRemarks || (isPassed ? 'Good academic performance' : 'Requires revision'),
        isPassed,
        submittedAt: new Date()
      };

      if (existingIndex >= 0) {
        exam.submissions[existingIndex] = {
          ...exam.submissions[existingIndex].toObject(),
          ...record
        };
      } else {
        exam.submissions.push(record);
      }
    });

    // Recalculate ranks across submissions
    exam.submissions.sort((a, b) => b.score - a.score);
    exam.submissions.forEach((sub, idx) => {
      sub.rank = idx + 1;
    });

    await exam.save();

    const updatedExam = await Exam.findById(exam._id)
      .populate('createdBy', 'name email')
      .populate('submissions.studentId', 'name studentId rollNumber admissionNumber profileImage firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Marks recorded and ranks updated successfully',
      data: updatedExam
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate Official Academic Report Card for a Student
// @route   GET /api/exams/report-card/:studentId
// @access  Private
export const getStudentReportCard = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).populate('parentIds', 'name email phone');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    // Role check: parents can only see their children, students can only see themselves
    if (req.user.role === 'parent') {
      const isParent = student.parentIds?.some((p) => p._id.toString() === req.user._id.toString());
      if (!isParent) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this report card' });
      }
    } else if (req.user.role === 'student') {
      if (student.userId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this report card' });
      }
    }

    // Find all exams for this student's classGrade
    const exams = await Exam.find({ classGrade: student.classGrade }).sort({ startDate: 1 });

    const subjectsSummary = [];
    let cumulativeMax = 0;
    let cumulativeObtained = 0;
    let passedCount = 0;

    exams.forEach((exam) => {
      const sub = exam.submissions?.find(
        (s) => s.studentId?.toString() === student._id.toString()
      );

      if (sub) {
        cumulativeMax += exam.totalMarks;
        cumulativeObtained += sub.score;
        if (sub.isPassed) passedCount++;

        subjectsSummary.push({
          examId: exam._id,
          examTitle: exam.title,
          examType: exam.examType || 'Term Examination',
          subject: exam.subject,
          maxMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          obtainedMarks: sub.score,
          percentage: sub.percentage,
          grade: sub.grade || calculateGrade(sub.percentage),
          rank: sub.rank || 1,
          isPassed: sub.isPassed,
          remarks: sub.teacherRemarks || (sub.isPassed ? 'Good effort' : 'Requires improvement')
        });
      }
    });

    const overallPercentage = cumulativeMax > 0 ? Math.round((cumulativeObtained / cumulativeMax) * 100) : 0;
    const overallGrade = calculateGrade(overallPercentage);

    // Compute class rank across all active students in class
    const allStudentsInClass = await Student.find({ classGrade: student.classGrade, status: 'Active' });
    const studentAggregates = [];
    for (const st of allStudentsInClass) {
      let stTotal = 0;
      exams.forEach((ex) => {
        const s = ex.submissions?.find((item) => item.studentId?.toString() === st._id.toString());
        if (s) stTotal += s.score;
      });
      studentAggregates.push({ studentId: st._id.toString(), totalScore: stTotal });
    }
    studentAggregates.sort((a, b) => b.totalScore - a.totalScore);
    const classRankIndex = studentAggregates.findIndex((a) => a.studentId === student._id.toString());
    const overallClassRank = classRankIndex >= 0 ? classRankIndex + 1 : 1;

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name || `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber,
          classGrade: student.classGrade,
          section: student.section,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          profileImage: student.profileImage
        },
        reportCard: {
          academicYear: '2026-2027',
          term: 'Semester Examination',
          issuedDate: new Date(),
          subjects: subjectsSummary,
          summary: {
            totalExams: exams.length,
            examsAppeared: subjectsSummary.length,
            examsPassed: passedCount,
            cumulativeMax,
            cumulativeObtained,
            overallPercentage,
            overallGrade,
            classRank: overallClassRank,
            totalStudentsInClass: allStudentsInClass.length,
            resultStatus: overallPercentage >= 40 ? 'PROMOTED' : 'NEEDS_REASSESSMENT',
            conductRemarks:
              overallPercentage >= 80
                ? 'Exemplary academic achievement, exceptional discipline, and active classroom participation.'
                : overallPercentage >= 60
                ? 'Good overall progress with strong dedication. Keep advancing in core problem solving.'
                : 'Shows potential; dedicated faculty consultation and focused revision advised.'
          }
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Teacher, Super Admin, Principal)
export const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this exam' });
    }

    await exam.deleteOne();
    res.status(200).json({ success: true, message: 'Exam deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate Official AI Question Paper
// @route   POST /api/exams/ai/generate-paper
// @access  Private (Teacher, Super Admin, Principal)
export const generateAIPaper = async (req, res, next) => {
  try {
    const { classGrade, subject, term, academicYear, totalMarks, durationMinutes, topics } = req.body;
    const result = await generateQuestionPaper({
      classGrade: classGrade || 'Class 8',
      subject: subject || 'Science',
      term: term || 'Mid-Term Examination',
      academicYear: academicYear || '2026-2027',
      totalMarks: Number(totalMarks) || 80,
      durationMinutes: Number(durationMinutes) || 90,
      topics: topics || 'Core Curriculum'
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// @desc    Analyze Exam Difficulty & Bloom's Taxonomy
// @route   POST /api/exams/ai/analyze-difficulty
// @access  Private (Teacher, Super Admin, Principal)
export const analyzeExamDifficultyCtrl = async (req, res, next) => {
  try {
    const { questions, examTitle, classGrade } = req.body;
    const result = await analyzeExamDifficulty({
      questions: questions || [],
      examTitle: examTitle || 'Curriculum Assessment',
      classGrade: classGrade || 'Class 8'
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// @desc    Get Exam Cohort Performance & Result Analysis
// @route   GET /api/exams/ai/performance-analysis/:examId
// @access  Private
export const getExamPerformanceAnalysis = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId).populate(
      'submissions.studentId',
      'name studentId rollNumber admissionNumber profileImage firstName lastName'
    );

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const result = analyzeStudentPerformance({
      examTitle: exam.title,
      totalMarks: exam.totalMarks,
      submissions: exam.submissions
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// @desc    Identify Weak Subjects & Learning Gaps
// @route   GET /api/exams/ai/weak-subjects
// @access  Private
export const getWeakSubjectsAnalysisCtrl = async (req, res, next) => {
  try {
    const { classGrade } = req.query;
    const query = {};
    if (classGrade && classGrade !== 'All') {
      query.classGrade = classGrade;
    }

    const exams = await Exam.find(query).populate(
      'submissions.studentId',
      'name studentId rollNumber admissionNumber profileImage firstName lastName'
    );
    const students = await Student.find(query);

    const result = identifyWeakSubjectsAndTopics({ exams, students });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
