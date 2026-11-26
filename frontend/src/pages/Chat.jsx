import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { formatDateTime } from '../utils/formatters.js';
import { SECURITY_PATTERNS, sanitizeInputText } from '../utils/securityPatterns.js';
import {
  MessageSquare,
  Search,
  Send,
  User,
  CheckCheck,
  ChevronLeft,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Languages,
  GraduationCap,
  Users,
  Building2,
  ShieldCheck,
  Lock,
  Layers,
  ShieldAlert
} from 'lucide-react';

export const Chat = () => {
  const { user } = useAuth();
  const { showToast } = useSchool();

  const [conversations, setConversations] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeChannelFilter, setActiveChannelFilter] = useState('all');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeContactRef = useRef(null);
  activeContactRef.current = activeContact;

  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen to Socket.io events with strict 1-on-1 isolation
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('online_users', (users) => {
      setOnlineUserIds(users || []);
    });

    socket.on('message_received', (msg) => {
      const currentUserId = (user?.id || user?._id)?.toString();
      const currentActive = activeContactRef.current;
      const activeId = currentActive?._id?.toString();

      if (!currentUserId || !activeId) {
        fetchConversations();
        return;
      }

      // STRICT 1-ON-1 ISOLATION:
      // The incoming message MUST strictly match the exact conversation room of this user and the active contact.
      // Other students' or parents' chats will NEVER match and are completely ignored.
      const expectedRoom = [currentUserId, activeId].sort().join(':');

      if (msg.conversationId === expectedRoom) {
        setMessages((prev) => {
          if (prev.some((m) => m._id && msg._id && m._id.toString() === msg._id.toString())) {
            return prev;
          }
          return [...prev, msg];
        });
        setIsTyping(false);
      }
      fetchConversations();
    });

    socket.on('typing', (room) => {
      const currentUserId = (user?.id || user?._id)?.toString();
      const currentActive = activeContactRef.current;
      const activeId = currentActive?._id?.toString();
      if (!currentUserId || !activeId) return;

      const expectedRoom = [currentUserId, activeId].sort().join(':');
      if (room === expectedRoom) {
        setIsTyping(true);
      }
    });

    socket.on('stop_typing', (room) => {
      const currentUserId = (user?.id || user?._id)?.toString();
      const currentActive = activeContactRef.current;
      const activeId = currentActive?._id?.toString();
      if (!currentUserId || !activeId) return;

      const expectedRoom = [currentUserId, activeId].sort().join(':');
      if (room === expectedRoom) {
        setIsTyping(false);
      }
    });

    return () => {
      const currentUserId = (user?.id || user?._id)?.toString();
      if (socket && currentUserId && activeContactRef.current?._id) {
        const room = [currentUserId, activeContactRef.current._id.toString()].sort().join(':');
        socket.emit('leave_chat', room);
      }
      socket.off('online_users');
      socket.off('message_received');
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [user]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchConversations = async () => {
    try {
      const res = await chatAPI.getConversations();
      if (res.success && res.data) {
        setConversations(res.data);
        if (!activeContact && res.data.length > 0) {
          selectConversation(res.data[0].user);
        }
      }
    } catch (err) {
      console.warn('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (contact) => {
    const socket = getSocket();
    const currentUserId = (user?.id || user?._id)?.toString();

    // Leave previous room if any
    if (socket && currentUserId && activeContact?._id) {
      const prevRoom = [currentUserId, activeContact._id.toString()].sort().join(':');
      socket.emit('leave_chat', prevRoom);
    }

    setActiveContact(contact);
    activeContactRef.current = contact;

    try {
      const res = await chatAPI.getMessages(contact._id);
      if (res.success) {
        setMessages(res.data || []);
      }

      // Join new private conversation room
      if (socket && currentUserId && contact?._id) {
        const convRoom = [currentUserId, contact._id.toString()].sort().join(':');
        socket.emit('join_chat', convRoom);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading Messages');
    }
  };

  const isRtlText = (text) => {
    return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text || '');
  };

  const handleCopyMessage = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessageWithAI = async (textToSend) => {
    if (!textToSend.trim() || !activeContact || isSubmitting) return;

    const messageText = textToSend.trim();
    setNewMessage('');
    setIsSubmitting(true);

    const tempId = 'temp-' + Date.now();
    const tempUserMsg = {
      _id: tempId,
      senderId: {
        _id: user.id || user._id,
        name: user.name,
        role: user.role
      },
      receiverId: activeContact,
      message: messageText,
      createdAt: new Date().toISOString()
    };

    // 1. Immediately display user message in conversation
    setMessages((prev) => [...prev, tempUserMsg]);

    // 2. Immediately show "AI is typing..." indicator
    setIsTyping(true);

    // Stop client typing socket
    const socket = getSocket();
    if (socket && user) {
      const convRoom = [user.id || user._id, activeContact._id].sort().join(':');
      socket.emit('stop_typing', convRoom);
    }

    try {
      // 3. Send message to backend and receive fast context-aware AI reply
      const res = await chatAPI.sendMessage({
        receiverId: activeContact._id,
        message: messageText
      });

      if (res.success) {
        // Replace temp message with persisted message
        if (res.data) {
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? res.data : m))
          );
        }

        // 4. Handle AI reply with high-speed progressive rendering
        if (res.aiReply) {
          setIsTyping(false);
          const replyId = res.aiReply._id || 'ai-' + Date.now();
          const fullText = res.aiReply.message;

          // Check if already in messages from socket
          setMessages((prev) => {
            if (prev.some((m) => m._id && m._id.toString() === replyId.toString())) {
              return prev;
            }
            return [...prev, { ...res.aiReply, message: '' }];
          });

          // Ultra-fast streaming (renders full answer in ~120ms)
          let currentLen = 0;
          const chunkSize = Math.max(3, Math.floor(fullText.length / 10));
          const streamInterval = setInterval(() => {
            currentLen += chunkSize;
            if (currentLen >= fullText.length) {
              clearInterval(streamInterval);
              setMessages((prev) =>
                prev.map((m) =>
                  m._id?.toString() === replyId.toString()
                    ? { ...m, message: fullText }
                    : m
                )
              );
              fetchConversations();
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m._id?.toString() === replyId.toString()
                    ? { ...m, message: fullText.slice(0, currentLen) }
                    : m
                )
              );
            }
          }, 12);
        } else {
          setIsTyping(false);
          fetchConversations();
        }
      }
    } catch (err) {
      setIsTyping(false);
      const errorMsg = {
        _id: 'err-' + Date.now(),
        senderId: activeContact,
        message: "Sorry, I couldn't process that inquiry right now. Please try again.",
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    await sendMessageWithAI(newMessage);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    const socket = getSocket();
    if (!socket || !activeContact) return;

    const convRoom = [user.id || user._id, activeContact._id].sort().join(':');
    socket.emit('typing', convRoom);

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', convRoom);
    }, 2000);
  };

  const getConversationChannelType = (c) => {
    if (c.channelType) return c.channelType;
    const myRole = user?.role;
    const otherRole = c.user?.role;
    if ((myRole === 'student' && otherRole === 'teacher') || (myRole === 'teacher' && otherRole === 'student')) {
      return 'student_teacher';
    }
    if ((myRole === 'parent' && otherRole === 'teacher') || (myRole === 'teacher' && otherRole === 'parent')) {
      return 'parent_teacher';
    }
    if (
      (['super_admin', 'admin', 'principal'].includes(myRole) && otherRole === 'teacher') ||
      (['super_admin', 'admin', 'principal'].includes(otherRole) && myRole === 'teacher')
    ) {
      return 'admin_teacher';
    }
    if (
      (['super_admin', 'admin', 'principal'].includes(myRole) && otherRole === 'parent') ||
      (['super_admin', 'admin', 'principal'].includes(otherRole) && myRole === 'parent')
    ) {
      return 'admin_parent';
    }
    if (
      (['super_admin', 'admin', 'principal'].includes(myRole) && otherRole === 'student') ||
      (['super_admin', 'admin', 'principal'].includes(otherRole) && myRole === 'student')
    ) {
      return 'admin_student';
    }
    return 'general';
  };

  const getChannelTabs = () => {
    const role = user?.role;
    if (role === 'teacher') {
      return [
        { id: 'all', label: 'All Channels', icon: Layers },
        { id: 'student_teacher', label: 'Students', icon: GraduationCap, badgeLabel: 'Private from Parents' },
        { id: 'parent_teacher', label: 'Parents', icon: Users, badgeLabel: 'Private from Students' },
        { id: 'admin_teacher', label: 'Staff Room', icon: Building2, badgeLabel: 'Internal Staff' }
      ];
    }
    if (['super_admin', 'admin', 'principal'].includes(role)) {
      return [
        { id: 'all', label: 'All Channels', icon: Layers },
        { id: 'admin_teacher', label: 'Faculty & Staff', icon: Building2, badgeLabel: 'Staff Only' },
        { id: 'admin_parent', label: 'Parents', icon: Users, badgeLabel: 'Direct Official' },
        { id: 'admin_student', label: 'Students', icon: GraduationCap, badgeLabel: 'Student Desk' }
      ];
    }
    if (role === 'parent') {
      return [
        { id: 'all', label: 'All Channels', icon: Layers },
        { id: 'parent_teacher', label: 'Teachers', icon: Users, badgeLabel: 'Student Cannot View' },
        { id: 'admin_parent', label: 'School Admin', icon: Building2, badgeLabel: 'Official' }
      ];
    }
    if (role === 'student') {
      return [
        { id: 'all', label: 'All Channels', icon: Layers },
        { id: 'student_teacher', label: 'My Teachers', icon: GraduationCap, badgeLabel: 'Parents Cannot View' },
        { id: 'admin_student', label: 'Academic Support', icon: Building2, badgeLabel: 'Student Desk' }
      ];
    }
    return [{ id: 'all', label: 'All Channels', icon: Layers }];
  };

  const getUnreadForChannel = (channelId) => {
    if (channelId === 'all') {
      return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    }
    return conversations
      .filter((c) => getConversationChannelType(c) === channelId)
      .reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  };

  const quickPrompts = [
    { label: 'What is my attendance percentage?', lang: 'English' },
    { label: 'How much fee balance is pending?', lang: 'English' },
    { label: 'Is the school open tomorrow?', lang: 'English' },
    { label: 'What homework assignments are due?', lang: 'English' },
    { label: 'When do upcoming examinations start?', lang: 'English' }
  ];

  const filteredConversations = conversations.filter((c) => {
    const channel = getConversationChannelType(c);
    if (activeChannelFilter !== 'all' && channel !== activeChannelFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      return c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const activeChannelType = activeContact
    ? getConversationChannelType({ user: activeContact })
    : null;

  return (
    <div className="space-y-4 h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#FF5E3A]" />
            <span>Chat Room</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Strictly Private 1-on-1 Messaging (Student ↔ Teacher, Parent ↔ Teacher). Fully Isolated & Confidential.
          </p>
        </div>

        {/* Status & AI Multilingual Badges in DevSkill Orange Theme */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="whitespace-nowrap px-3.5 py-1.5 bg-[#FFF0EB] border border-[#FEEAE1] rounded-full text-xs font-bold text-[#FF5E3A] flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#FF5E3A] animate-pulse" />
            <span>Private Room Active</span>
          </div>
          <div className="whitespace-nowrap px-3.5 py-1.5 bg-[#FFF0EB] border border-[#FEEAE1] rounded-full text-xs font-bold text-[#FF5E3A] flex items-center gap-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5E3A] animate-pulse" />
            <span>Fast AI Multilingual Active</span>
          </div>
        </div>
      </div>

      {/* Main Messaging Container */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex min-h-0">
        {/* Left Sidebar: Conversations List */}
        <div
          className={`w-full sm:w-80 md:w-96 border-r border-gray-200 flex flex-col bg-gray-50/50 ${
            activeContact ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* Search Box */}
          <div className="p-3.5 border-b border-gray-200">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                pattern={SECURITY_PATTERNS.search.pattern}
                title={SECURITY_PATTERNS.search.title}
                maxLength={100}
                onChange={(e) => setSearchTerm(sanitizeInputText(e.target.value))}
                placeholder="Search contacts..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>

          {/* Channel Selection Header & Tabs */}
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF5E3A]" />
                <span>Isolated Channels</span>
              </span>
              <span className="text-[10px] font-bold text-[#FF5E3A] bg-[#FFF0EB] px-2 py-0.5 rounded-full border border-[#FFD5C5]">
                Private &amp; Secure
              </span>
            </div>

            {/* Channel Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {getChannelTabs().map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeChannelFilter === tab.id;
                const unread = getUnreadForChannel(tab.id);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveChannelFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title={tab.badgeLabel || tab.label}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF5E3A]' : 'text-slate-500'}`} />
                    <span className="text-[11px]">{tab.label}</span>
                    {unread > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#FF5E3A] text-white">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((c) => {
                const isSelected = activeContact?._id === c.user._id;
                const isOnline = onlineUserIds.includes(c.user._id);
                const cChannel = getConversationChannelType(c);

                return (
                  <button
                    key={c.user._id}
                    onClick={() => selectConversation(c.user)}
                    className={`w-full p-3.5 flex items-start gap-3 text-left transition cursor-pointer ${
                      isSelected ? 'bg-white border-l-4 border-[#FF5E3A] shadow-xs' : 'hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={
                          c.user.profileImage ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                        }
                        alt={c.user.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#FF5E3A] border-2 border-white shadow-xs" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold text-gray-900 truncate">{c.user.name}</span>
                        {c.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5E3A] text-white">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Channel Privacy Tag */}
                      <div className="my-1">
                        {cChannel === 'student_teacher' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]">
                            <GraduationCap className="w-2.5 h-2.5" />
                            <span>Student Channel (Parents Hidden)</span>
                          </span>
                        )}
                        {cChannel === 'parent_teacher' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            <Users className="w-2.5 h-2.5 text-amber-600" />
                            <span>Parent Channel (Students Hidden)</span>
                          </span>
                        )}
                        {cChannel === 'admin_teacher' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                            <Building2 className="w-2.5 h-2.5 text-orange-400" />
                            <span>Staff Room (Faculty &amp; Admin Only)</span>
                          </span>
                        )}
                        {cChannel === 'admin_parent' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                            <Building2 className="w-2.5 h-2.5 text-amber-700" />
                            <span>Admin-Parent (Private)</span>
                          </span>
                        )}
                        {cChannel === 'admin_student' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                            <GraduationCap className="w-2.5 h-2.5 text-blue-600" />
                            <span>Student Desk (Private)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="text-[11px] capitalize text-gray-500 font-medium">
                          {c.user.role?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {c.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-gray-400">
                No eligible contacts found for this channel.
              </div>
            )}
          </div>
        </div>

        {/* Right Chat Area */}
        {activeContact ? (
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {/* Active Contact Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveContact(null)}
                  className="sm:hidden p-1.5 text-gray-500 hover:text-gray-900"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <img
                    src={
                      activeContact.profileImage ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={activeContact.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  {onlineUserIds.includes(activeContact._id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#FF5E3A] border-2 border-white shadow-xs" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{activeContact.name}</h3>
                    {activeChannelType === 'student_teacher' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]">
                        <GraduationCap className="w-3 h-3 text-[#FF5E3A]" />
                        <span>Student Channel (Parents Hidden)</span>
                      </span>
                    )}
                    {activeChannelType === 'parent_teacher' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        <Users className="w-3 h-3 text-amber-600" />
                        <span>Parent Channel (Students Hidden)</span>
                      </span>
                    )}
                    {activeChannelType === 'admin_teacher' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white border border-slate-700">
                        <Building2 className="w-3 h-3 text-orange-400" />
                        <span>Staff Room (Faculty &amp; Admin Only)</span>
                      </span>
                    )}
                    {activeChannelType === 'admin_parent' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                        <Building2 className="w-3 h-3 text-amber-700" />
                        <span>Admin-Parent (Private)</span>
                      </span>
                    )}
                    {activeChannelType === 'admin_student' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                        <GraduationCap className="w-3 h-3 text-blue-600" />
                        <span>Student Desk (Private)</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-0.5">
                    <span className="text-[11px] text-gray-500 capitalize font-medium">
                      {activeContact.role?.replace('_', ' ')}
                    </span>
                    <span className="text-gray-300">&bull;</span>
                    <span className={`text-[11px] font-bold ${
                      onlineUserIds.includes(activeContact._id) ? 'text-[#FF5E3A]' : 'text-gray-400'
                    }`}>
                      {onlineUserIds.includes(activeContact._id) ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Channel Security Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[11px] text-slate-700 font-bold">
                <Lock className="w-3 h-3 text-[#FF5E3A]" />
                <span>Isolated Channel</span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gray-50/40">
              {/* Channel Privacy Banner */}
              {activeChannelType === 'student_teacher' && (
                <div className="p-3.5 rounded-xl bg-[#FFF0EB] border border-[#FFD5C5] text-slate-800 shadow-2xs flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#FF5E3A] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#FF5E3A]">Student ↔ Teacher Private Academic Channel</span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-[#FF5E3A] text-[9px] font-black border border-[#FFD5C5]">
                        PARENTS CANNOT VIEW
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      This conversation is strictly confidential between the student and teacher. Parents have zero access to this chat.
                    </p>
                  </div>
                </div>
              )}

              {activeChannelType === 'parent_teacher' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-slate-800 shadow-2xs flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-900">Parent ↔ Teacher Consultation Channel</span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-amber-800 text-[9px] font-black border border-amber-300">
                        STUDENTS CANNOT VIEW
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      This consultation channel is strictly private between parent and faculty. Students have zero access to this chat.
                    </p>
                  </div>
                </div>
              )}

              {activeChannelType === 'admin_teacher' && (
                <div className="p-3.5 rounded-xl bg-[#0F172A] border border-slate-800 text-white shadow-sm flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#FF5E3A] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">Faculty &amp; Administration Staff Room</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#FF5E3A]/20 text-[#FF5E3A] text-[9px] font-black border border-[#FF5E3A]/40">
                        STAFF ONLY
                      </span>
                    </div>
                    <p className="text-slate-300 mt-0.5">
                      Internal communication for teaching staff and school leadership. Completely restricted from parents and students.
                    </p>
                  </div>
                </div>
              )}

              {activeChannelType === 'admin_parent' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-slate-800 shadow-2xs flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-900">Parent ↔ Administration Channel</span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-amber-800 text-[9px] font-black border border-amber-300">
                        OFFICIAL DESK
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Official communication with school leadership. Students cannot view or access this conversation.
                    </p>
                  </div>
                </div>
              )}

              {activeChannelType === 'admin_student' && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-slate-800 shadow-2xs flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-900">Student ↔ Administration Support Channel</span>
                      <span className="px-2 py-0.5 rounded-full bg-white text-blue-800 text-[9px] font-black border border-blue-300">
                        STUDENT DESK
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Student support and guidance. Parents cannot view this student-admin consultation.
                    </p>
                  </div>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF0EB] border border-[#FEEAE1] flex items-center justify-center text-[#FF5E3A] mb-3">
                    <Sparkles className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">SchoolSphere AI Assistant Ready</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Ask any question about attendance, fees, homework, exams, or timings.
                  </p>

                  {/* Suggestions */}
                  <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-md">
                    {quickPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessageWithAI(p.label)}
                        className="px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-[#FF5E3A] hover:text-[#FF5E3A] text-xs text-slate-700 shadow-2xs transition-colors cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe =
                    (msg.senderId?._id || msg.senderId)?.toString() === (user.id || user._id)?.toString();
                  const isRtl = isRtlText(msg.message);

                  return (
                    <div
                      key={msg._id || index}
                      className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="relative max-w-[85%] sm:max-w-[75%]">
                        <div
                          dir={isRtl ? 'rtl' : 'ltr'}
                          className={`p-3.5 rounded-2xl text-[13px] leading-relaxed transition-all ${
                            isRtl ? 'font-sans' : ''
                          } ${
                            isMe
                              ? 'bg-slate-900 text-white rounded-tr-xs shadow-xs'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs shadow-xs'
                          }`}
                        >
                          <div className="whitespace-pre-line break-words">
                            {msg.message}
                          </div>
                        </div>

                        {/* Copy button on hover */}
                        {!isMe && msg.message && (
                          <button
                            onClick={() => handleCopyMessage(msg._id || index, msg.message)}
                            className="absolute -right-7 top-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-opacity shadow-xs"
                            title="Copy reply"
                          >
                            {copiedId === (msg._id || index) ? (
                              <Check className="w-3.5 h-3.5 text-[#FF5E3A]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1 px-1">
                        <span>{formatDateTime(msg.createdAt)}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#FF5E3A]" />}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex gap-1 items-center px-3 py-1.5 bg-white border border-[#FEEAE1] rounded-full shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E3A] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E3A] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E3A] animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#FF5E3A] animate-spin" />
                    <span>AI Assistant checking school records...</span>
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Strip */}
            {messages.length > 0 && (
              <div className="px-4 py-1.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-600 no-scrollbar">
                <span className="font-semibold text-slate-400 shrink-0">Quick ask:</span>
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessageWithAI(p.label)}
                    className="px-2.5 py-1 rounded-full bg-white border border-[#FEEAE1] hover:border-[#FF5E3A] hover:text-[#FF5E3A] text-slate-600 shrink-0 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar & Privacy Lock Strip */}
            <div className="border-t border-gray-200 bg-white">
              <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Lock className="w-3 h-3 text-[#FF5E3A]" />
                  <span>
                    {activeChannelType === 'student_teacher' && 'Private Student-Teacher Channel (Parents cannot view)'}
                    {activeChannelType === 'parent_teacher' && 'Private Parent-Teacher Channel (Students cannot view)'}
                    {activeChannelType === 'admin_teacher' && 'Faculty & Staff Room (Parents & Students cannot view)'}
                    {activeChannelType === 'admin_parent' && 'Parent-Admin Official Channel (Students cannot view)'}
                    {activeChannelType === 'admin_student' && 'Student-Admin Support Channel (Parents cannot view)'}
                    {(!activeChannelType || activeChannelType === 'general') && 'End-to-End Isolated Channel'}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Strictly Isolated</span>
              </div>

              <form onSubmit={handleSendMessage} className="p-3.5 flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  pattern="^[^<>]{1,500}$"
                  title="Message must not contain HTML tags (< >)."
                  maxLength={500}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  placeholder={`Type your message or inquiry (e.g., "What is my attendance?", "Homework status?")...`}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF5E3A] focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSubmitting}
                  className="p-2.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white rounded-xl shadow-xs transition disabled:opacity-40 cursor-pointer"
                  title="Send Message (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden sm:flex flex-col items-center justify-center text-center p-8 text-gray-400 bg-white">
            <MessageSquare className="w-12 h-12 mb-3 text-gray-300 stroke-[1.5]" />
            <h3 className="text-base font-bold text-gray-800">No Chat Room Selected</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Choose an eligible contact from the left list to enter a private 1-on-1 Chat Room session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
