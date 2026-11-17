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

    // Join specific chat conversation room
    socket.on('join_chat', (room) => {
      socket.join(room);
      logger.socket(`Socket ${socket.id} joined conversation room: ${room}`);
    });

    // Typing indicators
    socket.on('typing', (room) => socket.in(room).emit('typing', room));
    socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing', room));

    // Direct Message dispatch
    socket.on('new_message', (newMsg) => {
      if (!newMsg || !newMsg.receiverId) return;

      const receiverId = typeof newMsg.receiverId === 'object' ? newMsg.receiverId._id : newMsg.receiverId;
      const room = newMsg.conversationId;

      if (room) {
        // Broadcast to conversation room (other participants)
        socket.in(room).emit('message_received', newMsg);
      }
      // Also notify receiver's personal user room
      socket.in(`user:${receiverId}`).emit('notification_received', {
        type: 'chat',
        from: newMsg.senderId,
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
