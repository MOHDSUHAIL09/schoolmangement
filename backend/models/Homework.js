import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  fileUrl: {
    type: String,
    default: ''
  },
  textSubmission: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Submitted', 'Reviewed', 'Late'],
    default: 'Submitted'
  },
  teacherRemarks: {
    type: String,
    default: ''
  },
  marks: {
    type: Number,
    default: null
  }
});

const homeworkSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    classGrade: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    attachments: [
      {
        type: String
      }
    ],
    submissions: [submissionSchema]
  },
  {
    timestamps: true
  }
);

homeworkSchema.index({ classGrade: 1, section: 1, dueDate: 1 });

export default mongoose.model('Homework', homeworkSchema);
