import mongoose from 'mongoose';

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'],
      default: 'Present'
    },
    checkInTime: {
      type: String,
      default: '08:00 AM'
    },
    checkOutTime: {
      type: String,
      default: '03:30 PM'
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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

teacherAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });

export default mongoose.model('TeacherAttendance', teacherAttendanceSchema);
