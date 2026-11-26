import mongoose from 'mongoose';

const paymentRecordSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      default: '',
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Bank Transfer', 'UPI', 'Cheque', 'Online', 'None', 'Other'],
      default: 'Cash'
    },
    receiptNumber: {
      type: String,
      default: ''
    },
    transactionId: {
      type: String,
      default: ''
    },
    remarks: {
      type: String,
      default: ''
    },
    receivedBy: {
      type: String,
      default: 'Admin'
    }
  },
  { timestamps: true }
);

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    studentName: {
      type: String,
      default: '',
      trim: true
    },
    rollNumber: {
      type: String,
      default: '',
      trim: true
    },
    admissionNumber: {
      type: String,
      default: '',
      trim: true
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
      enum: ['Cash', 'Credit Card', 'Bank Transfer', 'UPI', 'Cheque', 'Online', 'None', 'Other'],
      default: 'None'
    },
    transactionId: {
      type: String,
      default: ''
    },
    remarks: {
      type: String,
      default: ''
    },
    // Payment ledger / transactions history
    payments: [paymentRecordSchema],
    lastPaymentDate: {
      type: Date,
      default: null
    },
    lastPaymentAmount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

feeSchema.pre('save', function (next) {
  const sumItems =
    (Number(this.tuition) || 0) +
    (Number(this.game) || 0) +
    (Number(this.transport) || 0) +
    (Number(this.exam) || 0) +
    (Number(this.events) || 0) +
    (Number(this.other) || 0);

  if (sumItems === 0 && Number(this.totalAmount) > 0) {
    this.tuition = Number(this.totalAmount);
    this.totalAmount = this.tuition;
  } else {
    this.totalAmount = sumItems;
  }

  const paid = Math.max(0, Number(this.paidAmount) || 0);
  this.paidAmount = paid;
  this.remainingAmount = Math.max(0, this.totalAmount - paid);

  if (this.paymentReference && !this.transactionId) {
    this.transactionId = this.paymentReference;
  } else if (this.transactionId && !this.paymentReference) {
    this.paymentReference = this.transactionId;
  }

  // Exact School fee management: Only 'Paid' or 'Pending' (or 'Overdue' if date passed)
  // No ambiguous 'Partial' status!
  if (this.remainingAmount === 0 && this.totalAmount > 0) {
    this.status = 'Paid';
  } else if (this.dueDate && new Date(this.dueDate) < new Date() && this.remainingAmount > 0) {
    this.status = 'Overdue';
  } else {
    this.status = 'Pending';
  }
  next();
});

feeSchema.index({ studentId: 1, month: 1 });
feeSchema.index({ studentName: 1 });
feeSchema.index({ status: 1 });
feeSchema.index({ classGrade: 1 });

export default mongoose.model('Fee', feeSchema);
