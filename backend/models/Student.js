import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    admissionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true
    },
    firstName: {
      type: String,
      trim: true,
      default: ''
    },
    lastName: {
      type: String,
      trim: true,
      default: ''
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male'
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    classGrade: {
      type: String,
      required: true,
      trim: true
    },
    section: {
      type: String,
      required: true,
      trim: true
    },
    parentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transport',
      default: null
    },
    admissionDate: {
      type: Date,
      default: Date.now
    },
    profileImage: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended', 'Graduated'],
      default: 'Active'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Synchronize firstName + lastName with name
studentSchema.pre('validate', function () {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  } else if (this.name && (!this.firstName || !this.lastName)) {
    const parts = this.name.trim().split(' ');
    this.firstName = parts[0] || '';
    this.lastName = parts.slice(1).join(' ') || '';
  }
  if (!this.name) {
    this.name = 'Student';
  }
});

studentSchema.index({ classGrade: 1, section: 1, rollNumber: 1 });
studentSchema.index({ parentIds: 1 });

export default mongoose.model('Student', studentSchema);
