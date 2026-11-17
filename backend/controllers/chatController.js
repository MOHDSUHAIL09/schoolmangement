import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { triggerSmartAutoReply } from '../services/aiChatService.js';

const getConversationId = (id1, id2) => {
  return [id1.toString(), id2.toString()].sort().join(':');
};

// @desc    Get contacts list / conversations
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all users the current user can communicate with
    let targetRoles = [];
    if (req.user.role === 'teacher') {
      targetRoles = ['parent', 'student', 'principal', 'super_admin'];
    } else if (req.user.role === 'parent') {
      targetRoles = ['teacher', 'principal', 'super_admin'];
    } else if (req.user.role === 'student') {
      targetRoles = ['teacher', 'principal'];
    } else {
      // super_admin / principal can talk with everyone
      targetRoles = ['teacher', 'parent', 'student', 'principal', 'super_admin'];
    }

    const eligibleUsers = await User.find({
      _id: { $ne: userId },
      role: { $in: targetRoles },
      isActive: true
    }).select('name email role profileImage');

    // Get last messages and unread counts for each contact
    const conversations = await Promise.all(
      eligibleUsers.map(async (contact) => {
        const convId = getConversationId(userId, contact._id);
        const lastMsg = await Chat.findOne({ conversationId: convId }).sort({ createdAt: -1 });
        const unreadCount = await Chat.countDocuments({
          conversationId: convId,
          receiverId: userId,
          isRead: false
        });

        return {
          user: contact,
          conversationId: convId,
          lastMessage: lastMsg ? lastMsg.message : '',
          lastMessageTime: lastMsg ? lastMsg.createdAt : null,
          unreadCount
        };
      })
    );

    // Sort by most recent message
    conversations.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });

    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
};

// @desc    Get chat messages with a specific user
// @route   GET /api/chat/messages/:receiverId
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.params;

    const convId = getConversationId(senderId, receiverId);

    const messages = await Chat.find({ conversationId: convId })
      .populate('senderId', 'name profileImage role')
      .populate('receiverId', 'name profileImage role')
      .sort({ createdAt: 1 });

    // Mark unread messages sent to me as read
    await Chat.updateMany(
      { conversationId: convId, receiverId: senderId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
};

// @desc    Send a message via HTTP REST (also dispatched via socket)
// @route   POST /api/chat/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Receiver and message text are required.' });
    }

    if (message.length > 4000) {
      return res.status(400).json({ success: false, message: 'Message exceeds maximum permitted length of 4000 characters.' });
    }

    const convId = getConversationId(req.user._id, receiverId);

    const chat = await Chat.create({
      senderId: req.user._id,
      receiverId,
      message,
      senderRole: req.user.role,
      conversationId: convId,
      isRead: false
    });

    const populated = await Chat.findById(chat._id)
      .populate('senderId', 'name profileImage role')
      .populate('receiverId', 'name profileImage role');

    // Trigger fast smart AI auto-reply in live application
    let aiReply = null;
    if (process.env.NODE_ENV !== 'test') {
      aiReply = await triggerSmartAutoReply({
        senderUser: req.user,
        receiverId,
        message,
        conversationId: convId
      });
    }

    res.status(201).json({
      success: true,
      data: populated,
      aiReply: aiReply || null
    });
  } catch (err) {
    next(err);
  }
};
