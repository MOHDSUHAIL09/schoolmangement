import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    teacherId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Female'
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    department: {
      type: String,
      trim: true,
      default: 'General Academics'
    },
    designation: {
      type: String,
      trim: true,
      default: 'Teaching Faculty'
    },
    qualification: {
      type: String,
      trim: true,
      default: 'B.Ed., Master of Education'
    },
    assignedClasses: [
      {
        type: String,
        trim: true
      }
    ],
    salary: {
      type: Number,
      default: 4500
    },
    address: {
      type: String,
      default: ''
    },
    experienceYears: {
      type: Number,
      default: 3
    },
    profileImage: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive'],
      default: 'Active'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Search indexes
teacherSchema.index({ name: 'text', email: 'text', department: 'text' });
teacherSchema.index({ department: 1, status: 1 });

export default mongoose.model('Teacher', teacherSchema);
