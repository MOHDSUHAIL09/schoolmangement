import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    salaryMonth: {
      type: String, // e.g. 'November 2026' or '2026-11'
      required: true
    },
    baseSalary: {
      type: Number,
      required: true,
      default: 0
    },
    allowances: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    netSalary: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Processing'],
      default: 'Pending'
    },
    paymentDate: {
      type: Date,
      default: null
    },
    paymentMethod: {
      type: String,
      enum: ['Direct Deposit', 'Bank Transfer', 'Cheque', 'Cash'],
      default: 'Direct Deposit'
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

payrollSchema.pre('save', function (next) {
  this.netSalary = Math.max(0, (this.baseSalary || 0) + (this.allowances || 0) - (this.deductions || 0));
  next();
});

payrollSchema.index({ employeeId: 1, salaryMonth: 1 }, { unique: true });

export default mongoose.model('Payroll', payrollSchema);
