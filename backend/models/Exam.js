import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [
    {
      type: String,
      required: true
    }
  ],
  correctAnswer: {
    type: Number, // index 0, 1, 2, 3
    required: true
  },
  marks: {
    type: Number,
    default: 1
  },
  explanation: {
    type: String,
    default: ''
  }
});

const examSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  answers: [
    {
      questionIndex: Number,
      selectedOption: Number
    }
  ],
  score: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    default: 'A'
  },
  rank: {
    type: Number,
    default: 1
  },
  teacherRemarks: {
    type: String,
    default: ''
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    examType: {
      type: String,
      enum: ['Mid-Term', 'Final Exam', 'Unit Test', 'Practical Assessment', 'Quiz', 'Term Examination'],
      default: 'Term Examination'
    },
    classGrade: {
      type: String,
      required: true
    },
    section: {
      type: String,
      default: 'All'
    },
    subject: {
      type: String,
      required: true
    },
    roomNo: {
      type: String,
      default: 'Hall A'
    },
    timeSlot: {
      type: String,
      default: '09:00 AM - 11:30 AM'
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 60
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByType: {
      type: String,
      enum: ['manual', 'ai_generated'],
      default: 'manual'
    },
    questions: [questionSchema],
    submissions: [examSubmissionSchema],
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    totalMarks: {
      type: Number,
      default: 100
    },
    passingMarks: {
      type: Number,
      default: 40
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Ongoing', 'Completed'],
      default: 'Published'
    }
  },
  {
    timestamps: true
  }
);

examSchema.index({ classGrade: 1, subject: 1, startDate: 1 });

export default mongoose.model('Exam', examSchema);
