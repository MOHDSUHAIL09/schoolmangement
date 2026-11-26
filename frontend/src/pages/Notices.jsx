import React, { useState, useEffect } from 'react';
import { noticeAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { getSocket } from '../services/socket.js';
import { Modal } from '../components/Modal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { formatDate, getInitials } from '../utils/formatters.js';
import { SECURITY_PATTERNS, sanitizeInputText } from '../utils/securityPatterns.js';
import {
  Bell,
  Calendar,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Users,
  Clock,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Filter,
  ChevronRight,
  Eye,
  Send,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  ShieldAlert
} from 'lucide-react';

export const Notices = () => {
  const { user, role } = useAuth();
  const { showToast } = useSchool();

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentAlertNotice, setRecentAlertNotice] = useState(null);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'Notice',
    title: '',
    description: '',
    imageUrl: '',
    eventDate: '',
    targetRole: 'all',
    isPublished: true
  });

  useEffect(() => {
    fetchNotices();
  }, [activeTab]);

  // Real-time socket listener for incoming notices
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingNotice = (incomingNotice) => {
      if (!incomingNotice) return;
      setNotices((prev) => [incomingNotice, ...prev.filter((n) => n._id !== incomingNotice._id)]);
      setRecentAlertNotice(incomingNotice);
    };

    socket.on('new_notice', handleIncomingNotice);

    return () => {
      socket.off('new_notice', handleIncomingNotice);
    };
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab === 'Notice') params.type = 'Notice';
      else if (activeTab === 'Event') params.type = 'Event';
      else if (activeTab === 'Urgent') params.type = 'Urgent';

      const res = await noticeAPI.getAll(params);
      if (res.success) {
        setNotices(res.data || []);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading Notices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter a notice title', 'error');
      return;
    }
    if (!formData.description.trim()) {
      showToast('Please enter notice details or description', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await noticeAPI.create(formData);
      if (res.success) {
        showToast('Notice published & real-time notification sent to all users!', 'success', 'Notice Published 📢');
        setIsModalOpen(false);
        setFormData({
          type: 'Notice',
          title: '',
          description: '',
          imageUrl: '',
          eventDate: '',
          targetRole: 'all',
          isPublished: true
        });
        fetchNotices();
        window.dispatchEvent(new CustomEvent('notice-published'));
      }
    } catch (err) {
      showToast(err.message, 'error', 'Failed to publish notice');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await noticeAPI.delete(deleteConfirmId);
      if (res.success) {
        showToast('Notice deleted successfully', 'success');
        setDeleteConfirmId(null);
        if (selectedNotice?._id === deleteConfirmId) {
          setSelectedNotice(null);
        }
        fetchNotices();
        window.dispatchEvent(new CustomEvent('notice-published'));
      }
    } catch (err) {
      showToast(err.message, 'error', 'Delete error');
    }
  };

  // Client-side filtering by search query and audience
  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      !searchQuery.trim() ||
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAudience =
      selectedAudience === 'all' ||
      n.targetRole === selectedAudience ||
      n.targetRole === 'all';

    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Notice' && (n.type === 'Notice' || !n.type)) ||
      (activeTab === 'Event' && n.type === 'Event') ||
      (activeTab === 'Urgent' && (n.type === 'Urgent' || n.title?.toLowerCase().includes('urgent')));

    return matchesSearch && matchesAudience && matchesTab;
  });

  // Calculate statistics
  const totalCount = notices.length;
  const noticeCount = notices.filter((n) => n.type === 'Notice' || !n.type).length;
  const urgentCount = notices.filter((n) => n.type === 'Urgent' || n.title?.toLowerCase().includes('urgent')).length;
  const eventCount = notices.filter((n) => n.type === 'Event').length;

  const studentCount = notices.filter((n) => n.targetRole === 'student' || n.targetRole === 'all').length;
  const parentCount = notices.filter((n) => n.targetRole === 'parent' || n.targetRole === 'all').length;
  const teacherCount = notices.filter((n) => n.targetRole === 'teacher' || n.targetRole === 'all').length;

  const canPublish = ['super_admin', 'admin', 'principal', 'teacher'].includes(role);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER & INSTANT PUBLISH ACTION                   */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-[#FEEAE1] shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0EB] border border-[#FEEAE1] text-[#FF5E3A] text-[10px] font-extrabold uppercase tracking-wider">
            <Megaphone className="w-3.5 h-3.5 text-[#FF5E3A]" />
            <span>Campus Live Bulletin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E232F] tracking-tight flex items-center gap-2.5">
            <span>School Notice Board</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6272] font-normal max-w-xl">
            Official circulars, holiday announcements, exam schedules, and alerts for students, parents, and teachers.
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg shadow-[#FF5E3A]/25 transition transform hover:-translate-y-0.5 flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Publish Notice</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. REAL-TIME JUST-PUBLISHED NOTIFICATION BANNER         */}
      {/* ======================================================== */}
      {recentAlertNotice && (
        <div className="p-4 rounded-2xl bg-[#FFF0EB] border-2 border-[#FF5E3A] flex items-center justify-between gap-4 shadow-md animate-in slide-in-from-top-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FF5E3A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5E3A] bg-white px-2 py-0.5 rounded border border-[#FEEAE1]">
                  📢 Live Notification Broadcasted
                </span>
                <span className="text-[11px] text-[#5A6272] hidden sm:inline">
                  • All users received this alert
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-[#1E232F] truncate mt-0.5">
                {recentAlertNotice.title}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSelectedNotice(recentAlertNotice)}
              className="px-3.5 py-1.5 bg-white text-[#FF5E3A] hover:bg-[#FF5E3A] hover:text-white border border-[#FF5E3A] text-xs font-bold rounded-xl transition cursor-pointer"
            >
              View Notice
            </button>
            <button
              onClick={() => setRecentAlertNotice(null)}
              className="p-1.5 text-[#5A6272] hover:text-[#1E232F] rounded-lg transition text-xs font-bold cursor-pointer"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. AUDIENCE STAT TILES (ALL ORANGE DevSkill PALETTE)     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#FEEAE1] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#5A6272] uppercase tracking-wider">Total Notices</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF0EB] text-[#FF5E3A] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1E232F]">{totalCount}</div>
          <span className="text-[10px] text-[#5A6272] font-medium">Active announcements</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#FEEAE1] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#FF5E3A] uppercase tracking-wider">For Students</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF0EB] text-[#FF5E3A] flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1E232F]">{studentCount}</div>
          <span className="text-[10px] text-[#5A6272] font-medium">Student circulars</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#FEEAE1] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#FF5E3A] uppercase tracking-wider">For Parents</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF0EB] text-[#FF5E3A] flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1E232F]">{parentCount}</div>
          <span className="text-[10px] text-[#5A6272] font-medium">Parent updates</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#FEEAE1] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#FF5E3A] uppercase tracking-wider">For Teachers</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF0EB] text-[#FF5E3A] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1E232F]">{teacherCount}</div>
          <span className="text-[10px] text-[#5A6272] font-medium">Faculty circulars</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. FILTER & SEARCH TOOLBAR (CLEAN, SPACIOUS & RESPONSIVE) */}
      {/* ======================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#FEEAE1] shadow-xs space-y-3.5">
        
        {/* Top: Category Tabs with whitespace-nowrap and count badges */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'All', label: 'All Notices', count: totalCount, icon: Bell },
            { id: 'Notice', label: 'General Notices', count: noticeCount, icon: Megaphone },
            { id: 'Urgent', label: 'Urgent Notices', count: urgentCount, icon: ShieldAlert },
            { id: 'Event', label: 'Holidays & Events', count: eventCount, icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#FF5E3A] text-white shadow-md shadow-[#FF5E3A]/25'
                    : 'bg-[#FFF6F2] hover:bg-[#FFF0EB] text-[#5A6272] hover:text-[#1E232F] border border-[#FEEAE1]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-white text-[#FF5E3A] border border-[#FEEAE1]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom: Search Input & Audience Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#FEEAE1]">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5A6272] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices by title, keyword, or author..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#FFF6F2] border border-[#FEEAE1] rounded-xl text-xs text-[#1E232F] placeholder-[#5A6272] focus:outline-none focus:border-[#FF5E3A] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6272] hover:text-[#1E232F] text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Audience Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#FFF6F2] border border-[#FEEAE1] rounded-xl">
              <Filter className="w-3.5 h-3.5 text-[#FF5E3A]" />
              <span className="text-xs font-bold text-[#5A6272] hidden md:inline">Audience:</span>
              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#1E232F] focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">All Community</option>
                <option value="student">Students Only</option>
                <option value="parent">Parents Only</option>
                <option value="teacher">Teachers Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. NOTICE CARDS LIST / GRID                              */}
      {/* ======================================================== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-white border border-[#FEEAE1] animate-pulse p-6 space-y-4"
            >
              <div className="h-4 bg-[#FEEAE1] rounded w-1/3" />
              <div className="h-6 bg-[#FEEAE1] rounded w-3/4" />
              <div className="h-16 bg-[#FFF6F2] rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={searchQuery ? 'No matching notices found' : 'No notices posted yet'}
          description={
            searchQuery
              ? `No announcements matched "${searchQuery}". Try a different keyword.`
              : 'School announcements, circulars, and event notifications will appear here.'
          }
          actionLabel={canPublish ? '+ Publish First Notice' : undefined}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotices.map((n) => {
            const isUrgent = n.type === 'Urgent' || n.title?.toLowerCase().includes('urgent');
            const isEvent = n.type === 'Event';

            // Audience formatting
            const audienceInfo = {
              all: { label: '🌐 All Community', bg: 'bg-[#FFF0EB] text-[#FF5E3A] border-[#FEEAE1]' },
              student: { label: '🎓 Students Only', bg: 'bg-[#FFF0EB] text-[#FF5E3A] border-[#FEEAE1]' },
              parent: { label: '👨‍👩‍👧 Parents Only', bg: 'bg-[#FFF0EB] text-[#FF5E3A] border-[#FEEAE1]' },
              teacher: { label: '👨‍🏫 Faculty Only', bg: 'bg-[#FFF0EB] text-[#FF5E3A] border-[#FEEAE1]' }
            }[n.targetRole] || { label: '🌐 All Community', bg: 'bg-[#FFF0EB] text-[#FF5E3A] border-[#FEEAE1]' };

            return (
              <div
                key={n._id}
                className="bg-white rounded-3xl border border-[#FEEAE1] hover:border-[#FF5E3A] shadow-xs hover:shadow-xl hover:shadow-[#FF5E3A]/5 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Notice Image (if attached) */}
                {n.imageUrl && (
                  <div className="h-44 w-full relative overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={n.imageUrl}
                      alt={n.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Notice Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Top Badges: Category & Audience */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          isUrgent
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : isEvent
                            ? 'bg-[#FFF0EB] text-[#FF5E3A] border-[#FEEAE1]'
                            : 'bg-[#FFF0EB] text-[#FF5E3A] border-[#FEEAE1]'
                        }`}
                      >
                        {isUrgent ? '🚨 Urgent Notice' : isEvent ? '📅 Event & Holiday' : '📢 General Notice'}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${audienceInfo.bg}`}>
                        {audienceInfo.label}
                      </span>
                    </div>

                    {/* Notice Title */}
                    <h3
                      onClick={() => setSelectedNotice(n)}
                      className="text-base sm:text-lg font-extrabold text-[#1E232F] group-hover:text-[#FF5E3A] transition leading-snug cursor-pointer line-clamp-2"
                      title={n.title}
                    >
                      {n.title}
                    </h3>

                    {/* Description preview */}
                    <p className="text-xs sm:text-sm text-[#5A6272] leading-relaxed mt-2 line-clamp-3 whitespace-pre-line font-normal">
                      {n.description || 'No description provided.'}
                    </p>

                    {/* Scheduled Event Date badge if present */}
                    {n.eventDate && (
                      <div className="mt-3 p-2.5 rounded-xl bg-[#FFF6F2] border border-[#FEEAE1] flex items-center gap-2 text-xs text-[#1E232F] font-bold">
                        <CalendarDays className="w-4 h-4 text-[#FF5E3A]" />
                        <span>Date: {formatDate(n.eventDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Notice Footer: Date, Author & Actions */}
                  <div className="pt-3 border-t border-[#FEEAE1] flex items-center justify-between text-xs text-[#5A6272]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#FFF0EB] text-[#FF5E3A] font-bold text-[10px] flex items-center justify-center border border-[#FEEAE1]">
                        {getInitials(n.createdBy?.name || 'Admin')}
                      </div>
                      <div>
                        <span className="font-bold text-[#1E232F] block leading-tight text-[11px]">
                          {n.createdBy?.name || 'Administration'}
                        </span>
                        <span className="text-[10px] text-[#5A6272] block">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedNotice(n)}
                        className="px-3 py-1 bg-[#FFF0EB] hover:bg-[#FF5E3A] text-[#FF5E3A] hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Read</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {['super_admin', 'admin', 'principal'].includes(role) && (
                        <button
                          onClick={() => setDeleteConfirmId(n._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. READ NOTICE DETAIL MODAL                              */}
      {/* ======================================================== */}
      {selectedNotice && (
        <Modal
          isOpen={!!selectedNotice}
          onClose={() => setSelectedNotice(null)}
          title="School Notice Details"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Image (if present) */}
            {selectedNotice.imageUrl && (
              <div className="h-60 w-full rounded-2xl overflow-hidden relative border border-[#FEEAE1]">
                <img
                  src={selectedNotice.imageUrl}
                  alt={selectedNotice.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Badges & Publication Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0EB] text-[#FF5E3A] border border-[#FEEAE1]">
                  📢 {selectedNotice.type || 'Notice'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0EB] text-[#FF5E3A] border border-[#FEEAE1]">
                  Target: {selectedNotice.targetRole === 'all' ? 'All Community' : selectedNotice.targetRole.toUpperCase()}
                </span>
                <span className="text-[#5A6272]">• Posted on {formatDate(selectedNotice.createdAt)}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E232F] leading-snug">
                {selectedNotice.title}
              </h2>
            </div>

            {/* Event Date Callout (if Event) */}
            {selectedNotice.eventDate && (
              <div className="p-3.5 rounded-xl bg-[#FFF6F2] border border-[#FEEAE1] flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-[#FF5E3A]" />
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#5A6272] block">Event Date</span>
                  <span className="text-sm font-extrabold text-[#1E232F]">{formatDate(selectedNotice.eventDate)}</span>
                </div>
              </div>
            )}

            {/* Full Message Text */}
            <div className="p-5 rounded-2xl bg-[#FFF6F2] border border-[#FEEAE1] text-sm text-[#1E232F] leading-relaxed whitespace-pre-line font-normal">
              {selectedNotice.description}
            </div>

            {/* Author Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#FEEAE1] text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FFF0EB] text-[#FF5E3A] font-bold flex items-center justify-center border border-[#FEEAE1]">
                  {getInitials(selectedNotice.createdBy?.name || 'Admin')}
                </div>
                <div>
                  <span className="font-bold text-[#1E232F] block">{selectedNotice.createdBy?.name || 'School Administration'}</span>
                  <span className="text-[10px] text-[#5A6272] capitalize">{selectedNotice.createdBy?.role || 'Staff'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2 bg-[#FF5E3A] hover:bg-[#E04826] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 7. SIMPLE PUBLISH NOTICE MODAL                           */}
      {/* ======================================================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="📢 Publish New School Notice"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#1E232F] uppercase tracking-wider mb-1.5">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              pattern={SECURITY_PATTERNS.titleText.pattern}
              title={SECURITY_PATTERNS.titleText.title}
              maxLength={120}
              onChange={(e) => setFormData({ ...formData, title: sanitizeInputText(e.target.value) })}
              placeholder="e.g. Winter Break Announcement, Fee Submission Deadline, PTM Meeting"
              className="w-full px-4 py-2.5 bg-[#FFF6F2] border border-[#FEEAE1] rounded-xl text-xs text-[#1E232F] focus:outline-none focus:border-[#FF5E3A] focus:bg-white transition"
            />
          </div>

          {/* Row: Audience & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E232F] uppercase tracking-wider mb-1.5">
                Target Audience *
              </label>
              <select
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FFF6F2] border border-[#FEEAE1] rounded-xl text-xs font-bold text-[#1E232F] focus:outline-none focus:border-[#FF5E3A] focus:bg-white transition cursor-pointer"
              >
                <option value="all">🌐 Everyone (Students, Parents & Faculty)</option>
                <option value="student">🎓 Students Only</option>
                <option value="parent">👨‍👩‍👧 Parents Only</option>
                <option value="teacher">👨‍🏫 Teachers Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E232F] uppercase tracking-wider mb-1.5">
                Notice Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FFF6F2] border border-[#FEEAE1] rounded-xl text-xs font-bold text-[#1E232F] focus:outline-none focus:border-[#FF5E3A] focus:bg-white transition cursor-pointer"
              >
                <option value="Notice">📢 General Notice</option>
                <option value="Urgent">🚨 Urgent & Important</option>
                <option value="Event">📅 Event & Holiday</option>
              </select>
            </div>
          </div>

          {/* Optional Event Date */}
          {formData.type === 'Event' && (
            <div>
              <label className="block text-xs font-bold text-[#1E232F] uppercase tracking-wider mb-1.5">
                Scheduled Event / Holiday Date
              </label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FFF6F2] border border-[#FEEAE1] rounded-xl text-xs font-bold text-[#1E232F] focus:outline-none focus:border-[#FF5E3A] focus:bg-white transition"
              />
            </div>
          )}

          {/* Detailed Message */}
          <div>
            <label className="block text-xs font-bold text-[#1E232F] uppercase tracking-wider mb-1.5">
              Notice Description / Details *
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Write the complete notice message, instructions, timings, or dates here..."
              className="w-full px-4 py-2.5 bg-[#FFF6F2] border border-[#FEEAE1] rounded-xl text-xs text-[#1E232F] focus:outline-none focus:border-[#FF5E3A] focus:bg-white transition"
            />
          </div>

          {/* Optional Image URL */}
          <div>
            <label className="block text-xs font-bold text-[#1E232F] uppercase tracking-wider mb-1.5">
              Optional Image Link (Banner or Photo)
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              pattern="https?://[a-zA-Z0-9.\-]+(:[0-9]+)?(/.*)?"
              title="Must be a valid URL starting with http:// or https://"
              maxLength={400}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value.trim() })}
              placeholder="https://images.unsplash.com/... (optional)"
              className="w-full px-4 py-2.5 bg-[#FFF6F2] border border-[#FEEAE1] rounded-xl text-xs text-[#1E232F] focus:outline-none focus:border-[#FF5E3A] focus:bg-white transition"
            />
          </div>

          {/* Real-time notification note */}
          <div className="p-3 rounded-xl bg-[#FFF0EB] border border-[#FEEAE1] flex items-center gap-2 text-xs text-[#FF5E3A] font-bold">
            <Bell className="w-4 h-4 text-[#FF5E3A] shrink-0" />
            <span>Publishing will immediately send a real-time notification with sound to all users!</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#FEEAE1]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#1E232F] rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white rounded-xl text-xs font-extrabold shadow-md shadow-[#FF5E3A]/25 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Publishing & Notifying...' : '📢 Publish & Send Notification'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 8. DELETE CONFIRMATION DIALOG                            */}
      {/* ======================================================== */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Notice"
        message="Are you sure you want to delete this notice? It will be removed from all users' notice boards."
        confirmText="Yes, Delete Notice"
        danger={true}
      />
    </div>
  );
};
