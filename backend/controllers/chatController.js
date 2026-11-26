import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { triggerSmartAutoReply } from '../services/aiChatService.js';

export const getConversationId = (id1, id2) => {
  return [id1.toString(), id2.toString()].sort().join(':');
};

// Channel Privacy Classifier
export const resolveChannelMeta = (myRole, contactRole) => {
  if ((myRole === 'student' && contactRole === 'teacher') || (myRole === 'teacher' && contactRole === 'student')) {
    return {
      channelType: 'student_teacher',
      channelLabel: 'Student ↔ Teacher Channel',
      channelPrivacyNote: 'Strictly Private: Parents cannot view or access this conversation.'
    };
  }
  if ((myRole === 'parent' && contactRole === 'teacher') || (myRole === 'teacher' && contactRole === 'parent')) {
    return {
      channelType: 'parent_teacher',
      channelLabel: 'Parent ↔ Teacher Channel',
      channelPrivacyNote: 'Strictly Confidential: Students cannot view or access this conversation.'
    };
  }
  if (
    (['super_admin', 'admin', 'principal'].includes(myRole) && contactRole === 'teacher') ||
    (['super_admin', 'admin', 'principal'].includes(contactRole) && myRole === 'teacher')
  ) {
    return {
      channelType: 'admin_teacher',
      channelLabel: 'Faculty & Admin Staff Channel',
      channelPrivacyNote: 'Internal Staff Room: Parents and students cannot view or access this conversation.'
    };
  }
  if (
    (['super_admin', 'admin', 'principal'].includes(myRole) && contactRole === 'parent') ||
    (['super_admin', 'admin', 'principal'].includes(contactRole) && myRole === 'parent')
  ) {
    return {
      channelType: 'admin_parent',
      channelLabel: 'Parent ↔ Administration Channel',
      channelPrivacyNote: 'Official Communication: Students cannot view or access this conversation.'
    };
  }
  if (
    (['super_admin', 'admin', 'principal'].includes(myRole) && contactRole === 'student') ||
    (['super_admin', 'admin', 'principal'].includes(contactRole) && myRole === 'student')
  ) {
    return {
      channelType: 'admin_student',
      channelLabel: 'Student ↔ Administration Channel',
      channelPrivacyNote: 'Academic Support: Parents cannot view or access this conversation.'
    };
  }
  return {
    channelType: 'general',
    channelLabel: 'Direct 1-on-1 Channel',
    channelPrivacyNote: 'Direct private message.'
  };
};

// @desc    Get contacts list / conversations with strict role isolation
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Strict role communication matrix:
    // - Student: CAN ONLY communicate with teachers, principal, admin, super_admin.
    //   (NEVER other students, NEVER parents).
    // - Parent: CAN ONLY communicate with teachers, principal, admin, super_admin.
    //   (NEVER students, NEVER other parents).
    // - Teacher: can communicate with parents, students, principal, admin, super_admin.
    // - Principal / Admin / Super Admin: can communicate with all active roles.
    let targetRoles = [];
    if (req.user.role === 'teacher') {
      targetRoles = ['parent', 'student', 'principal', 'admin', 'super_admin'];
    } else if (req.user.role === 'parent') {
      targetRoles = ['teacher', 'principal', 'admin', 'super_admin'];
    } else if (req.user.role === 'student') {
      targetRoles = ['teacher', 'principal', 'admin', 'super_admin'];
    } else {
      targetRoles = ['teacher', 'parent', 'student', 'principal', 'admin', 'super_admin'];
    }

    const eligibleUsers = await User.find({
      _id: { $ne: userId },
      role: { $in: targetRoles },
      isActive: true
    }).select('name email role profileImage');

    // Get last messages, unread counts, and channel privacy metadata for each contact strictly isolated to this 1-on-1 pair
    const conversations = await Promise.all(
      eligibleUsers.map(async (contact) => {
        const convId = getConversationId(userId, contact._id);
        const lastMsg = await Chat.findOne({ conversationId: convId }).sort({ createdAt: -1 });
        const unreadCount = await Chat.countDocuments({
          conversationId: convId,
          receiverId: userId,
          isRead: false
        });
        const channelMeta = resolveChannelMeta(req.user.role, contact.role);

        return {
          user: contact,
          conversationId: convId,
          lastMessage: lastMsg ? lastMsg.message : '',
          lastMessageTime: lastMsg ? lastMsg.createdAt : null,
          unreadCount,
          channelType: channelMeta.channelType,
          channelLabel: channelMeta.channelLabel,
          channelPrivacyNote: channelMeta.channelPrivacyNote
        };
      })
    );

    // Sort by most recent message
    conversations.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });

    let result = conversations;
    if (req.query.channel && req.query.channel !== 'all') {
      result = conversations.filter((c) => c.channelType === req.query.channel);
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// @desc    Get chat messages with a specific user (strictly isolated 1-on-1)
// @route   GET /api/chat/messages/:receiverId
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.params;

    const receiver = await User.findById(receiverId).select('name email role profileImage isActive');
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    // Role-based isolation enforcement:
    // 1. Student cannot access messages with other students or parents
    if (req.user.role === 'student') {
      if (receiver.role === 'student') {
        return res.status(403).json({ success: false, message: 'Access denied: Students cannot access chats with other students.' });
      }
      if (receiver.role === 'parent') {
        return res.status(403).json({ success: false, message: 'Access denied: Students cannot access chats with parents.' });
      }
    }

    // 2. Parent cannot access messages with students or other parents
    if (req.user.role === 'parent') {
      if (receiver.role === 'student') {
        return res.status(403).json({ success: false, message: 'Access denied: Parents cannot access student chats.' });
      }
      if (receiver.role === 'parent') {
        return res.status(403).json({ success: false, message: 'Access denied: Parents cannot access chats with other parents.' });
      }
    }

    // Deterministic 1-on-1 conversation ID
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

// @desc    Send a message via HTTP REST (strictly isolated 1-on-1)
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

    const receiver = await User.findById(receiverId);
    if (!receiver || !receiver.isActive) {
      return res.status(404).json({ success: false, message: 'Contact not found or inactive.' });
    }

    // Role-based privacy enforcement:
    // 1. Student can only message teachers, principals, admins (NEVER students, NEVER parents)
    if (req.user.role === 'student') {
      if (receiver.role === 'student') {
        return res.status(403).json({ success: false, message: 'Access denied: Students cannot message other students.' });
      }
      if (receiver.role === 'parent') {
        return res.status(403).json({ success: false, message: 'Access denied: Students cannot message parents.' });
      }
    }

    // 2. Parent can only message teachers, principals, admins (NEVER students, NEVER other parents)
    if (req.user.role === 'parent') {
      if (receiver.role === 'student') {
        return res.status(403).json({ success: false, message: 'Access denied: Parents cannot message students directly.' });
      }
      if (receiver.role === 'parent') {
        return res.status(403).json({ success: false, message: 'Access denied: Parents cannot message other parents.' });
      }
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
