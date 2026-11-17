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
  ChevronLeft
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

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen to Socket.io events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('online_users', (users) => {
      setOnlineUserIds(users || []);
    });

    socket.on('message_received', (msg) => {
      const msgSenderId = (msg.senderId?._id || msg.senderId)?.toString();
      const activeId = activeContact?._id?.toString();

      // If message belongs to active contact or this conversation
      if (activeContact && (msgSenderId === activeId || msg.conversationId?.includes(activeId))) {
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
      if (activeContact && room && room.includes(activeContact._id)) {
        setIsTyping(true);
      }
    });

    socket.on('stop_typing', (room) => {
      if (activeContact && room && room.includes(activeContact._id)) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off('online_users');
      socket.off('message_received');
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [activeContact]);

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
    setActiveContact(contact);
    try {
      const res = await chatAPI.getMessages(contact._id);
      if (res.success) {
        setMessages(res.data || []);
      }

      // Join socket conversation room
      const socket = getSocket();
      if (socket && user) {
        const convRoom = [user.id || user._id, contact._id].sort().join(':');
        socket.emit('join_chat', convRoom);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading Messages');
    }
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

        // 4. Handle AI reply with progressive smooth rendering
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

          // Stream text progressively into the message bubble for very fast feedback
          let currentLen = 0;
          const chunkSize = Math.max(1, Math.floor(fullText.length / 15));
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
          }, 18);
        } else {
          setIsTyping(false);
          fetchConversations();
        }
      }
    } catch (err) {
      setIsTyping(false);
      // 5. Graceful in-chat error message without exposing internals
      const errorMsg = {
        _id: 'err-' + Date.now(),
        senderId: activeContact,
        message: "Sorry, I couldn't process that message right now. Please try again.",
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

  const filteredConversations = conversations.filter((c) =>
    c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-gray-900" />
          <span>Real-time Secure Messaging</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Encrypted scholastic dispatch for parents, faculty, and administration.
        </p>
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

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((c) => {
                const isSelected = activeContact?._id === c.user._id;
                const isOnline = onlineUserIds.includes(c.user._id);

                return (
                  <button
                    key={c.user._id}
                    onClick={() => selectConversation(c.user)}
                    className={`w-full p-4 flex items-start gap-3 text-left transition cursor-pointer ${
                      isSelected ? 'bg-white border-l-4 border-gray-900 shadow-xs' : 'hover:bg-gray-100/60'
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
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold text-gray-900 truncate">{c.user.name}</span>
                        {c.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-900 text-white">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="text-[11px] capitalize text-gray-500 font-medium">
                          {c.user.role?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {c.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-gray-400">
                No eligible contacts found for your account role.
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
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{activeContact.name}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] text-gray-500 capitalize font-medium">
                      {activeContact.role?.replace('_', ' ')}
                    </span>
                    <span className="text-gray-300">&bull;</span>
                    <span className={`text-[11px] font-medium ${
                      onlineUserIds.includes(activeContact._id) ? 'text-emerald-700' : 'text-gray-400'
                    }`}>
                      {onlineUserIds.includes(activeContact._id) ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gray-50/40">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <MessageSquare className="w-10 h-10 mb-2 text-gray-300 stroke-[1.5]" />
                  <p className="text-xs">No previous message history.</p>
                  <p className="text-[11px] mt-0.5 text-gray-400">Send a greeting to begin this conversation.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe =
                    (msg.senderId?._id || msg.senderId)?.toString() === (user.id || user._id)?.toString();

                  return (
                    <div
                      key={msg._id || index}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-gray-900 text-white rounded-tr-xs shadow-xs'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-tl-xs shadow-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 px-1">
                        <span>{formatDateTime(msg.createdAt)}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                  <span className="flex gap-1 items-center px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span className="text-[11px] font-medium text-gray-400">AI is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3.5 border-t border-gray-200 bg-white flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                pattern="^[^<>]{1,500}$"
                title="Message must not contain HTML tags (< >)."
                maxLength={500}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${activeContact.name}...`}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSubmitting}
                className="p-2.5 bg-gray-900 hover:bg-black text-white rounded-xl shadow-xs transition disabled:opacity-40 cursor-pointer"
                title="Send Message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 hidden sm:flex flex-col items-center justify-center text-center p-8 text-gray-400 bg-white">
            <MessageSquare className="w-12 h-12 mb-3 text-gray-300 stroke-[1.5]" />
            <h3 className="text-base font-bold text-gray-800">No Conversation Selected</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Choose an eligible recipient from the directory to start a secure dispatch session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};