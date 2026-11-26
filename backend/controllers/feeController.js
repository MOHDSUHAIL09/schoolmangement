import mongoose from 'mongoose';
import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import { sendEmail, sendFeeReminder } from '../services/emailService.js';
import { sendWhatsAppFeeReminder } from '../services/whatsappService.js';

// @desc    Get all fees with filtering & pagination
// @route   GET /api/fees
// @access  Private
export const getAllFees = async (req, res, next) => {
  try {
    const { status, classGrade, month, search, studentId, page = 1, limit = 50 } = req.query;
    const query = {};

    // In school fee management: Pending means any invoice with remaining unpaid balance
    if (status === 'Pending') {
      query.$or = [{ status: 'Pending' }, { status: 'Partial' }, { remainingAmount: { $gt: 0 } }];
    } else if (status === 'Paid') {
      query.$or = [{ status: 'Paid' }, { remainingAmount: 0 }];
    } else if (status) {
      query.status = status;
    }

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
      let myStudent = await Student.findOne({ userId: req.user._id }).select('_id');
      if (!myStudent && req.user.email) {
        myStudent = await Student.findOne({ email: req.user.email.toLowerCase() }).select('_id');
      }
      if (!myStudent && req.user.name) {
        myStudent = await Student.findOne({ name: req.user.name }).select('_id');
      }
      if (myStudent) {
        query.studentId = myStudent._id;
      } else {
        query.studentId = new mongoose.Types.ObjectId();
      }
    } else if (studentId) {
      query.studentId = studentId;
    }

    // Search filter across student name, roll number, admission number, transactionId
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      const matchingStudents = await Student.find({
        $or: [
          { name: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
          { rollNumber: searchRegex },
          { studentId: searchRegex },
          { admissionNumber: searchRegex }
        ]
      }).select('_id');

      const studentIds = matchingStudents.map((s) => s._id);

      const searchConditions = [
        { studentName: searchRegex },
        { studentId: { $in: studentIds } },
        { paymentReference: searchRegex },
        { transactionId: searchRegex },
        { month: searchRegex }
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Fee.countDocuments(query);
    const fees = await Fee.find(query)
      .populate('studentId', 'name firstName lastName studentId rollNumber admissionNumber classGrade section profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const formattedFees = fees.map((f) => {
      const obj = f.toObject();
      if (!obj.studentName && obj.studentId?.name) {
        obj.studentName = obj.studentId.name;
      }
      if (!obj.rollNumber && obj.studentId?.rollNumber) {
        obj.rollNumber = obj.studentId.rollNumber;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      data: {
        fees: formattedFees,
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

    const feeObj = fee.toObject();
    if (!feeObj.studentName && feeObj.studentId?.name) {
      feeObj.studentName = feeObj.studentId.name;
    }
    if (!feeObj.rollNumber && feeObj.studentId?.rollNumber) {
      feeObj.rollNumber = feeObj.studentId.rollNumber;
    }
    res.status(200).json({ success: true, data: feeObj });
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
      studentName,
      name,
      rollNumber,
      section,
      classGrade,
      month,
      academicYear,
      tuition,
      game,
      transport,
      exam,
      events,
      other,
      totalFee,
      paidAmount = 0,
      paymentMethod = 'Cash',
      dueDate,
      remarks,
      paymentReference
    } = req.body;

    let student = null;
    // 1. Try finding by studentId if it's a valid ObjectId
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    }

    // 2. If not found, try searching by name or roll number
    const targetName = (studentName || name || (typeof studentId === 'string' && !mongoose.Types.ObjectId.isValid(studentId) ? studentId : '')).trim();
    if (!student && targetName) {
      student = await Student.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${targetName}$`, 'i') } },
          { rollNumber: targetName }
        ]
      });
    }

    // 3. If student still doesn't exist, automatically create pupil in MongoDB Atlas!
    if (!student) {
      const finalName = targetName || 'Enrolled Student';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const autoRoll = rollNumber || `${Math.floor(100 + Math.random() * 900)}`;
      const autoAdm = `ADM-${Date.now().toString().slice(-6)}${randomSuffix}`;
      const autoStdId = `STD-${Date.now().toString().slice(-6)}${randomSuffix}`;

      student = new Student({
        name: finalName,
        firstName: finalName.split(' ')[0] || finalName,
        lastName: finalName.split(' ').slice(1).join(' ') || '',
        studentId: autoStdId,
        admissionNumber: autoAdm,
        rollNumber: autoRoll,
        classGrade: classGrade || 'Class 10',
        section: section || 'A',
        dateOfBirth: new Date('2010-01-01'),
        gender: 'Male',
        status: 'Active'
      });
      await student.save();
    }

    const ref = paymentReference || `INV-${Date.now().toString().slice(-6)}`;
    const payAmt = Number(paidAmount) || 0;
    const assessedTuition = tuition !== undefined ? Number(tuition) : (totalFee !== undefined ? Number(totalFee) : 1000);

    const fee = new Fee({
      studentId: student._id,
      studentName: student.name || 'Student',
      rollNumber: student.rollNumber || '',
      admissionNumber: student.admissionNumber || '',
      classGrade: classGrade || student.classGrade || 'Class 10',
      month: month || 'November 2026',
      academicYear: academicYear || '2026-2027',
      tuition: assessedTuition,
      game: Number(game) || 0,
      transport: Number(transport) || 0,
      exam: Number(exam) || 0,
      events: Number(events) || 0,
      other: Number(other) || 0,
      paidAmount: payAmt,
      dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      paymentReference: ref,
      transactionId: ref,
      paymentMethod: payAmt > 0 ? (paymentMethod || 'Cash') : 'None',
      paymentDate: payAmt > 0 ? new Date() : null,
      lastPaymentDate: payAmt > 0 ? new Date() : null,
      lastPaymentAmount: payAmt,
      remarks: remarks || ''
    });

    if (payAmt > 0) {
      fee.payments = [
        {
          studentName: student.name || 'Student',
          amount: payAmt,
          paymentDate: new Date(),
          paymentMethod: paymentMethod || 'Cash',
          receiptNumber: `REC-${Date.now().toString().slice(-8)}`,
          transactionId: ref,
          remarks: remarks || 'Initial deposit upon invoice creation',
          receivedBy: req.user?.name || req.user?.email || 'Admin'
        }
      ];
    }

    await fee.save();
    await fee.populate('studentId', 'name studentId rollNumber admissionNumber classGrade section profileImage');

    // Notify parents via Email & WhatsApp (safely without breaking response)
    try {
      const populatedStudent = await Student.findById(student._id).populate('parentIds');
      if (populatedStudent && Array.isArray(populatedStudent.parentIds)) {
        populatedStudent.parentIds.forEach((parent) => {
          if (parent?.email) {
            sendFeeReminder({
              to: parent.email,
              studentName: student.name,
              totalAmount: fee.totalAmount,
              remainingAmount: fee.remainingAmount,
              dueDate: fee.dueDate,
              paymentReference: fee.paymentReference
            }).catch(() => {});
          }
          if (parent?.phone) {
            sendWhatsAppFeeReminder(parent.phone, {
              studentName: student.name,
              remainingAmount: fee.remainingAmount,
              dueDate: fee.dueDate
            }).catch(() => {});
          }
        });
      }
    } catch (notifyErr) {
      // Non-blocking notification catch
    }

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
// @access  Private (Admin / Principal / Super Admin)
export const recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, transactionId, paymentReference, remarks, paymentDate, receiptNumber, studentId, studentName } = req.body;

    let fee = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      fee = await Fee.findById(req.params.id);
    }

    if (!fee) {
      // Check if req.params.id was studentId or if studentId was passed in body
      const targetStudentId = (studentId && mongoose.Types.ObjectId.isValid(studentId)) ? studentId : (mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null);
      if (targetStudentId) {
        fee = await Fee.findOne({ studentId: targetStudentId, remainingAmount: { $gt: 0 } }) || await Fee.findOne({ studentId: targetStudentId }).sort({ createdAt: -1 });
      }
    }

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid payment amount.' });
    }

    // If still no existing fee record, fallback seamlessly to creating one and recording payment!
    if (!fee) {
      req.body.paidAmount = payAmount;
      req.body.totalFee = payAmount;
      return createFee(req, res, next);
    }

    // Role-based security: students can only pay their own fees; parents can only pay their children's fees
    if (req.user.role === 'student') {
      let myStudent = await Student.findOne({ userId: req.user._id }).select('_id');
      if (!myStudent && req.user.email) {
        myStudent = await Student.findOne({ email: req.user.email.toLowerCase() }).select('_id');
      }
      if (!myStudent && req.user.name) {
        myStudent = await Student.findOne({ name: req.user.name }).select('_id');
      }
      if (myStudent && fee.studentId && fee.studentId.toString() !== myStudent._id.toString()) {
        return res.status(403).json({ success: false, message: 'You are only authorized to pay your own student fees.' });
      }
    } else if (req.user.role === 'parent') {
      const myChildren = await Student.find({ parentIds: req.user._id }).select('_id');
      const myChildIds = myChildren.map((c) => c._id.toString());
      if (fee.studentId && !myChildIds.includes(fee.studentId.toString())) {
        return res.status(403).json({ success: false, message: 'You are only authorized to pay fees for your own children.' });
      }
    }

    const pDate = paymentDate ? new Date(paymentDate) : new Date();
    const txn = transactionId || paymentReference || `TXN-${Date.now().toString().slice(-8)}`;
    const rNo = receiptNumber || `REC-${Date.now().toString().slice(-8)}`;

    // Ensure student details are attached directly to fee doc
    if (!fee.studentName) {
      const student = await Student.findById(fee.studentId);
      if (student) {
        fee.studentName = student.name || 'Student';
        fee.rollNumber = student.rollNumber || '';
        fee.admissionNumber = student.admissionNumber || '';
      }
    }

    const receivedByText = req.user.role === 'student' 
      ? `Student Portal (${req.user.name || 'Self Paid'})`
      : req.user.role === 'parent'
      ? `Parent Portal (${req.user.name || 'Parent Paid'})`
      : (req.user?.name || req.user?.email || 'School Bursar');

    const paymentEntry = {
      studentName: fee.studentName || 'Student',
      amount: payAmount,
      paymentDate: pDate,
      paymentMethod: paymentMethod || 'Online',
      receiptNumber: rNo,
      transactionId: txn,
      remarks: remarks || (req.user.role === 'student' ? 'Student online fee deposit' : 'Fee deposited'),
      receivedBy: receivedByText
    };

    if (!fee.payments) fee.payments = [];
    fee.payments.push(paymentEntry);

    fee.paidAmount = (Number(fee.paidAmount) || 0) + payAmount;
    fee.remainingAmount = Math.max(0, (Number(fee.totalAmount) || 0) - fee.paidAmount);
    fee.paymentMethod = paymentMethod || 'Cash';
    fee.transactionId = txn;
    fee.paymentReference = txn;
    fee.paymentDate = pDate;
    fee.lastPaymentDate = pDate;
    fee.lastPaymentAmount = payAmount;
    if (remarks) fee.remarks = remarks;

    // Status is automatically recalculated in feeSchema.pre('save')
    // remainingAmount === 0 -> 'Paid', else 'Pending' (or 'Overdue')
    await fee.save();

    await fee.populate('studentId', 'name studentId rollNumber admissionNumber classGrade section profileImage');

    res.status(200).json({
      success: true,
      message: `Fees of $${payAmount} successfully deposited and recorded in database.`,
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
    let feeFilter = {};
    if (req.user.role === 'student') {
      let myStudent = await Student.findOne({ userId: req.user._id }).select('_id');
      if (!myStudent && req.user.email) {
        myStudent = await Student.findOne({ email: req.user.email.toLowerCase() }).select('_id');
      }
      if (!myStudent && req.user.name) {
        myStudent = await Student.findOne({ name: req.user.name }).select('_id');
      }
      if (myStudent) {
        feeFilter = { studentId: myStudent._id };
      } else {
        feeFilter = { studentId: new mongoose.Types.ObjectId() };
      }
    } else if (req.user.role === 'parent') {
      const myChildren = await Student.find({ parentIds: req.user._id }).select('_id');
      feeFilter = { studentId: { $in: myChildren.map((c) => c._id) } };
    }

    const allFees = await Fee.find(feeFilter);
    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let todayCollected = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    allFees.forEach((fee) => {
      const tot = Number(fee.totalAmount) || 0;
      const pd = Number(fee.paidAmount) || 0;
      const rem = Math.max(0, tot - pd);

      totalExpected += tot;
      totalCollected += pd;
      totalPending += rem;

      // Calculate today's collections
      if (fee.payments && fee.payments.length > 0) {
        fee.payments.forEach((p) => {
          if (p.paymentDate && new Date(p.paymentDate) >= startOfToday && new Date(p.paymentDate) <= endOfToday) {
            todayCollected += Number(p.amount) || 0;
          }
        });
      } else if (fee.paymentDate && new Date(fee.paymentDate) >= startOfToday && new Date(fee.paymentDate) <= endOfToday) {
        todayCollected += pd;
      }

      if (rem === 0 && tot > 0) {
        paidCount++;
      } else if (fee.dueDate && new Date(fee.dueDate) < new Date() && rem > 0) {
        overdueCount++;
      } else {
        pendingCount++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalExpected,
        totalCollected,
        totalPending,
        todayCollected,
        statusCounts: {
          paid: paidCount,
          pending: pendingCount,
          overdue: overdueCount
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
