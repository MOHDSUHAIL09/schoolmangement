import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import { generateToken } from '../utils/generateToken.js';
import './setup.js';

describe('Realtime Chat Architecture Tests', () => {
  let parentToken, teacherToken, parentUser, teacherUser;

  beforeAll(async () => {
    parentUser = await User.create({
      name: 'Chat Parent',
      email: 'parent.chat@schoolsphere.com',
      password: 'password123',
      role: 'parent'
    });
    parentToken = generateToken(parentUser);

    teacherUser = await User.create({
      name: 'Chat Teacher',
      email: 'teacher.chat@schoolsphere.com',
      password: 'password123',
      role: 'teacher'
    });
    teacherToken = generateToken(teacherUser);
  });

  it('should allow parent to send message to teacher with deterministic room ID', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        receiverId: teacherUser._id,
        message: 'Hello Professor, checking on upcoming class schedule.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Hello Professor, checking on upcoming class schedule.');
    expect(res.body.data.isRead).toBe(false);

    // Deterministic room check
    const expectedRoom = [parentUser._id.toString(), teacherUser._id.toString()].sort().join(':');
    expect(res.body.data.conversationId).toBe(expectedRoom);
  });

  it('should list active conversations with unread badge count', async () => {
    const res = await request(app)
      .get('/api/chat/conversations')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const conv = res.body.data.find((c) => c.user._id.toString() === parentUser._id.toString());
    expect(conv).toBeDefined();
    expect(conv.unreadCount).toBe(1);
    expect(conv.lastMessage).toBe('Hello Professor, checking on upcoming class schedule.');
  });

  it('should mark messages as read when recipient opens conversation', async () => {
    const res = await request(app)
      .get(`/api/chat/messages/${parentUser._id}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Verify in database that message was marked read
    const updated = await Chat.findOne({
      senderId: parentUser._id,
      receiverId: teacherUser._id
    });
    expect(updated.isRead).toBe(true);
  });
});
