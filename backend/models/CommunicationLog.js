import mongoose from 'mongoose';

const communicationLogSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ['email', 'whatsapp'],
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipientTarget: {
      type: String,
      default: 'individual' // 'all_parents', 'all_teachers', 'class_grade', 'individual'
    },
    recipientEmail: {
      type: String,
      default: ''
    },
    recipientPhone: {
      type: String,
      default: ''
    },
    recipientName: {
      type: String,
      default: ''
    },
    subject: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      required: true
    },
    template: {
      type: String,
      default: 'custom' // 'attendance', 'fee', 'exam', 'notice', 'custom'
    },
    status: {
      type: String,
      enum: ['Delivered', 'Sent', 'Failed', 'Queued'],
      default: 'Delivered'
    },
    messageId: {
      type: String,
      default: ''
    },
    aiReply: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

communicationLogSchema.index({ channel: 1, createdAt: -1 });

export default mongoose.model('CommunicationLog', communicationLogSchema);
