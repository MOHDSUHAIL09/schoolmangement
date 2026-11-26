import { Server } from 'socket.io';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

let io = null;
const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [ENV.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    pingTimeout: 60000
  });

  io.on('connection', (socket) => {
    logger.socket(`Client connected: [Socket ID: ${socket.id}]`);

    // Setup user presence
    socket.on('setup', (userData) => {
      if (userData && (userData.id || userData._id)) {
        const uId = (userData.id || userData._id).toString();
        socket.userId = uId;
        socket.join(`user:${uId}`);
        onlineUsers.set(uId, socket.id);
        logger.socket(`User registered on socket: ${userData.name || uId} (${userData.role || 'user'})`);
        io.emit('online_users', Array.from(onlineUsers.keys()));
        socket.emit('connected');
      }
    });

    // Join specific chat conversation room (strictly authorized)
    socket.on('join_chat', (room) => {
      if (!room || typeof room !== 'string') return;

      // Security Check: Only allow joining if the socket user is one of the room's two participants
      const participants = room.split(':');
      if (socket.userId && !participants.includes(socket.userId.toString())) {
        logger.warn(`Unauthorized join_chat attempt blocked: User ${socket.userId} tried to join room ${room}`);
        return;
      }

      socket.join(room);
      logger.socket(`Socket ${socket.id} (User: ${socket.userId}) securely joined room: ${room}`);
    });

    // Leave specific chat conversation room
    socket.on('leave_chat', (room) => {
      if (room && typeof room === 'string') {
        socket.leave(room);
        logger.socket(`Socket ${socket.id} (User: ${socket.userId}) left room: ${room}`);
      }
    });

    // Typing indicators strictly scoped to room participants
    socket.on('typing', (room) => {
      if (!room || typeof room !== 'string') return;
      const participants = room.split(':');
      if (socket.userId && !participants.includes(socket.userId.toString())) return;
      socket.in(room).emit('typing', room);
    });

    socket.on('stop_typing', (room) => {
      if (!room || typeof room !== 'string') return;
      const participants = room.split(':');
      if (socket.userId && !participants.includes(socket.userId.toString())) return;
      socket.in(room).emit('stop_typing', room);
    });

    // Direct Message dispatch with strict validation
    socket.on('new_message', (newMsg) => {
      if (!newMsg || !newMsg.receiverId) return;

      const receiverId = typeof newMsg.receiverId === 'object' ? newMsg.receiverId._id : newMsg.receiverId;
      const senderId = typeof newMsg.senderId === 'object' ? newMsg.senderId?._id : newMsg.senderId;
      const room = newMsg.conversationId;

      if (!room || typeof room !== 'string') return;

      const participants = room.split(':');
      if (socket.userId && !participants.includes(socket.userId.toString())) {
        logger.warn(`Unauthorized new_message dispatch attempt by user ${socket.userId} to room ${room}`);
        return;
      }

      // Broadcast to specific conversation room (strictly isolated)
      socket.in(room).emit('message_received', newMsg);

      // Notify receiver's personal user room
      socket.in(`user:${receiverId}`).emit('notification_received', {
        type: 'chat',
        from: senderId,
        message: newMsg.message,
        conversationId: room
      });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      logger.socket(`Client disconnected: [Socket ID: ${socket.id}]`);
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('online_users', Array.from(onlineUsers.keys()));
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket first.');
  }
  return io;
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};
