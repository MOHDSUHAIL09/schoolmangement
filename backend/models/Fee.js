import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    classGrade: {
      type: String,
      required: true
    },
    academicYear: {
      type: String,
      default: '2026-2027'
    },
    month: {
      type: String,
      default: 'November 2026'
    },
    // Fee Breakdown
    tuition: {
      type: Number,
      default: 0
    },
    game: {
      type: Number,
      default: 0
    },
    transport: {
      type: Number,
      default: 0
    },
    exam: {
      type: Number,
      default: 0
    },
    events: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    },
    // Totals
    totalAmount: {
      type: Number,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Paid', 'Partial', 'Pending', 'Overdue'],
      default: 'Pending'
    },
    paymentDate: {
      type: Date,
      default: null
    },
    paymentReference: {
      type: String,
      default: ''
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Bank Transfer', 'UPI', 'Cheque', 'Online', 'None'],
      default: 'None'
    },
    transactionId: {
      type: String,
      default: ''
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

feeSchema.pre('save', function (next) {
  this.totalAmount =
    (Number(this.tuition) || 0) +
    (Number(this.game) || 0) +
    (Number(this.transport) || 0) +
    (Number(this.exam) || 0) +
    (Number(this.events) || 0) +
    (Number(this.other) || 0);

  this.remainingAmount = Math.max(0, this.totalAmount - (Number(this.paidAmount) || 0));

  if (this.paymentReference && !this.transactionId) {
    this.transactionId = this.paymentReference;
  } else if (this.transactionId && !this.paymentReference) {
    this.paymentReference = this.transactionId;
  }

  if (this.paidAmount >= this.totalAmount && this.totalAmount > 0) {
    this.status = 'Paid';
  } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
    this.status = 'Partial';
  } else if (this.dueDate && new Date(this.dueDate) < new Date() && this.status !== 'Paid') {
    this.status = 'Overdue';
  } else if (this.paidAmount === 0) {
    this.status = 'Pending';
  }
  next();
});

feeSchema.index({ studentId: 1, month: 1 });
feeSchema.index({ status: 1 });
feeSchema.index({ classGrade: 1 });

export default mongoose.model('Fee', feeSchema);
