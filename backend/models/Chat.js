import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    senderRole: {
      type: String,
      required: true
    },
    conversationId: {
      type: String,
      required: true,
      index: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

chatSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

export default mongoose.model('Chat', chatSchema);
