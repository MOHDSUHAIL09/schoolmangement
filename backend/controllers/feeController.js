import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import { sendEmail, sendFeeReminder } from '../services/emailService.js';
import { sendWhatsAppFeeReminder } from '../services/whatsappService.js';

// @desc    Get all fees with filtering & pagination
// @route   GET /api/fees
// @access  Private
export const getAllFees = async (req, res, next) => {
  try {
    const { status, classGrade, month, search, studentId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (classGrade) query.classGrade = classGrade;
    if (month) query.month = month;

    // RBAC: parent only views their children's fees
    if (req.user.role === 'parent') {
      const myChildren = await Student.find({ parentIds: req.user._id }).select('_id');
      const myChildIds = myChildren.map((c) => c._id.toString());

      if (studentId) {
        if (!myChildIds.includes(studentId.toString())) {
          return res.status(403).json({ success: false, message: 'Unauthorized access to student fee record' });
        }
        query.studentId = studentId;
      } else {
        query.studentId = { $in: myChildren.map((c) => c._id) };
      }
    } else if (req.user.role === 'student') {
      const myStudent = await Student.findOne({ userId: req.user._id }).select('_id');
      if (myStudent) {
        query.studentId = myStudent._id;
      }
    } else if (studentId) {
      query.studentId = studentId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Fee.countDocuments(query);
    const fees = await Fee.find(query)
      .populate('studentId', 'name studentId rollNumber classGrade section profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        fees,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)) || 1
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single fee record (for Printable Receipt)
// @route   GET /api/fees/:id
// @access  Private
export const getFeeById = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id).populate({
      path: 'studentId',
      populate: { path: 'parentIds', select: 'name email phone' }
    });

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    // RBAC: Parent can only view fee of their own child
    if (req.user.role === 'parent') {
      const isMyChild = fee.studentId?.parentIds?.some(
        (p) => p._id?.toString() === req.user._id.toString() || p.toString() === req.user._id.toString()
      );
      if (!isMyChild) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to fee invoice' });
      }
    }

    // RBAC: Student can only view their own fee invoice
    if (req.user.role === 'student') {
      const myStudent = await Student.findOne({ userId: req.user._id }).select('_id');
      if (!myStudent || fee.studentId?._id?.toString() !== myStudent._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to fee invoice' });
      }
    }

    res.status(200).json({ success: true, data: fee });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new fee assignment
// @route   POST /api/fees
// @access  Private (Admin / Principal)
export const createFee = async (req, res, next) => {
  try {
    const {
      studentId,
      classGrade,
      month,
      academicYear,
      tuition,
      game,
      transport,
      exam,
      events,
      other,
      dueDate,
      remarks,
      paymentReference
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const ref = paymentReference || `INV-${Date.now().toString().slice(-6)}`;

    const fee = new Fee({
      studentId,
      classGrade: classGrade || student.classGrade,
      month: month || 'November 2026',
      academicYear: academicYear || '2026-2027',
      tuition: Number(tuition) || 0,
      game: Number(game) || 0,
      transport: Number(transport) || 0,
      exam: Number(exam) || 0,
      events: Number(events) || 0,
      other: Number(other) || 0,
      dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      paymentReference: ref,
      transactionId: ref,
      remarks: remarks || ''
    });

    await fee.save();

    // Notify parents via Email & WhatsApp
    const populatedStudent = await Student.findById(studentId).populate('parentIds');
    populatedStudent.parentIds?.forEach((parent) => {
      if (parent.email) {
        sendFeeReminder({
          to: parent.email,
          studentName: student.name,
          totalAmount: fee.totalAmount,
          remainingAmount: fee.remainingAmount,
          dueDate: fee.dueDate,
          paymentReference: fee.paymentReference
        });
      }
      if (parent.phone) {
        sendWhatsAppFeeReminder(parent.phone, {
          studentName: student.name,
          remainingAmount: fee.remainingAmount,
          dueDate: fee.dueDate
        });
      }
    });

    res.status(201).json({
      success: true,
      message: 'Fee invoice generated successfully',
      data: fee
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record fee payment
// @route   PUT /api/fees/:id/pay
// @access  Private (Admin / Principal)
export const recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, transactionId, paymentReference, remarks } = req.body;

    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid payment amount.' });
    }

    fee.paidAmount = (fee.paidAmount || 0) + payAmount;
    fee.paymentMethod = paymentMethod || 'Cash';
    const txn = transactionId || paymentReference || `TXN-${Date.now().toString().slice(-8)}`;
    fee.transactionId = txn;
    fee.paymentReference = txn;
    fee.paymentDate = new Date();
    if (remarks) fee.remarks = remarks;

    await fee.save();

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: fee
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get fee summary stats (Dashboard & Reports)
// @route   GET /api/fees/stats/overview
// @access  Private
export const getFeeStats = async (req, res, next) => {
  try {
    const allFees = await Fee.find();
    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let paidCount = 0;
    let partialCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    allFees.forEach((fee) => {
      totalExpected += fee.totalAmount || 0;
      totalCollected += fee.paidAmount || 0;
      totalPending += fee.remainingAmount || 0;

      if (fee.status === 'Paid') paidCount++;
      else if (fee.status === 'Partial') partialCount++;
      else if (fee.status === 'Overdue') overdueCount++;
      else pendingCount++;
    });

    res.status(200).json({
      success: true,
      data: {
        totalExpected,
        totalCollected,
        totalPending,
        statusCounts: {
          paid: paidCount,
          partial: partialCount,
          pending: pendingCount,
          overdue: overdueCount
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
