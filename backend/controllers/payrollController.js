import Payroll from '../models/Payroll.js';
import User from '../models/User.js';

// @desc    Get all payroll records
// @route   GET /api/payroll
// @access  Private (Admin / Principal ONLY)
export const getAllPayrolls = async (req, res, next) => {
  try {
    const { month, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (month) query.salaryMonth = month;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Payroll.countDocuments(query);
    const payrolls = await Payroll.find(query)
      .populate('employeeId', 'name email role phone profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        payrolls,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update employee payroll
// @route   POST /api/payroll
// @access  Private (Admin / Principal ONLY)
export const createOrUpdatePayroll = async (req, res, next) => {
  try {
    const { employeeId, salaryMonth, baseSalary, allowances, deductions, paymentMethod, remarks } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const netSalary = Math.max(0, (Number(baseSalary) || 0) + (Number(allowances) || 0) - (Number(deductions) || 0));

    const payroll = await Payroll.findOneAndUpdate(
      { employeeId, salaryMonth },
      {
        employeeId,
        salaryMonth,
        baseSalary: Number(baseSalary) || 0,
        allowances: Number(allowances) || 0,
        deductions: Number(deductions) || 0,
        netSalary,
        paymentMethod: paymentMethod || 'Direct Deposit',
        remarks: remarks || ''
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('employeeId', 'name email role phone');

    res.status(200).json({
      success: true,
      message: 'Payroll record saved successfully',
      data: payroll
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark payroll as paid
// @route   PUT /api/payroll/:id/pay
// @access  Private (Admin / Principal ONLY)
export const markPayrollAsPaid = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    payroll.status = 'Paid';
    payroll.paymentDate = new Date();
    await payroll.save();

    res.status(200).json({
      success: true,
      message: 'Payroll disbursed and marked as Paid',
      data: payroll
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Payroll Overview Stats
// @route   GET /api/payroll/stats/overview
// @access  Private (Admin / Principal ONLY)
export const getPayrollStats = async (req, res, next) => {
  try {
    const all = await Payroll.find();
    let totalExpenditure = 0;
    let pendingCount = 0;
    let paidCount = 0;

    all.forEach((p) => {
      totalExpenditure += p.netSalary || 0;
      if (p.status === 'Paid') paidCount++;
      else pendingCount++;
    });

    res.status(200).json({
      success: true,
      data: {
        totalExpenditure,
        totalRecords: all.length,
        paidCount,
        pendingCount
      }
    });
  } catch (err) {
    next(err);
  }
};
