import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Notice', 'Event', 'Gallery'],
      default: 'Notice'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    eventDate: {
      type: Date,
      default: null
    },
    targetRole: {
      type: String,
      enum: ['all', 'teacher', 'parent', 'student'],
      default: 'all'
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

noticeSchema.index({ type: 1, isPublished: 1, createdAt: -1 });

export default mongoose.model('Notice', noticeSchema);
