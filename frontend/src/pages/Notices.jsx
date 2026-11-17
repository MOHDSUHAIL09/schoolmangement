import React, { useState, useEffect } from 'react';
import { noticeAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
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
  ExternalLink,
  Search,
  Users,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Layers,
  ChevronRight,
  Bookmark,
  Share2,
  Filter
} from 'lucide-react';

export const Notices = () => {
  const { role } = useAuth();
  const { showToast } = useSchool();

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'All') params.type = activeTab;
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
      showToast('Please provide a title for the bulletin', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await noticeAPI.create(formData);
      if (res.success) {
        showToast('Institutional bulletin published successfully', 'success', 'Published');
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
      }
    } catch (err) {
      showToast(err.message, 'error', 'Failed to publish');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await noticeAPI.delete(deleteConfirmId);
      if (res.success) {
        showToast('Bulletin removed from institutional board', 'success');
        setDeleteConfirmId(null);
        if (selectedNotice?._id === deleteConfirmId) {
          setSelectedNotice(null);
        }
        fetchNotices();
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

    return matchesSearch && matchesAudience;
  });

  // Calculate statistics
  const totalCount = notices.length;
  const noticeCount = notices.filter((n) => n.type === 'Notice').length;
  const eventCount = notices.filter((n) => n.type === 'Event').length;
  const galleryCount = notices.filter((n) => n.type === 'Gallery').length;

  // Preset sample photo suggestions for fast authoring
  const samplePhotos = [
    { label: 'Campus Expo', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80' },
    { label: 'Science Lab', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80' },
    { label: 'Athletics & Sports', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80' },
    { label: 'Auditorium Hall', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80' },
    { label: 'Graduation Cap', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80' }
  ];

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & KPI HIGHLIGHTS                           */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white/90 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-cyan-200/80 shadow-xl shadow-cyan-950/5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>Campus Live Bulletin Board</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-cyan-400 p-0.5 shadow-md shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-cyan-300">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>
            <span>Notices, Campus Events & Gallery</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-2xl">
            Official academic circulars, calendar milestones, athletics coverage, and school community announcements.
          </p>
        </div>

        {['super_admin', 'principal', 'teacher'].includes(role) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-black rounded-2xl shadow-xl shadow-cyan-500/25 border border-cyan-300 transition transform hover:-translate-y-0.5 flex items-center gap-2 shrink-0 cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. STATS OVERVIEW TILES                                   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-cyan-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">All Bulletins</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950">{totalCount}</div>
          <span className="text-[10px] text-slate-400 font-medium">Active announcements</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-cyan-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider">Official Notices</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-950">{noticeCount}</div>
          <span className="text-[10px] text-cyan-700/70 font-medium">Academic circulars</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Campus Events</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950">{eventCount}</div>
          <span className="text-[10px] text-amber-700/70 font-medium">Scheduled conferences & fairs</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Photo Gallery</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950">{galleryCount}</div>
          <span className="text-[10px] text-purple-700/70 font-medium">Extracurricular media</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SEARCH & CATEGORY FILTER BAR                          */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80">
          {[
            { id: 'All', label: 'All Bulletins', icon: Layers, count: totalCount },
            { id: 'Notice', label: 'Notices', icon: Bell, count: noticeCount },
            { id: 'Event', label: 'Events', icon: Calendar, count: eventCount },
            { id: 'Gallery', label: 'Gallery', icon: ImageIcon, count: galleryCount }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Audience Controls */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Audience Filter */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-bold shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Audiences</option>
              <option value="teacher">Faculty Only</option>
              <option value="parent">Parents</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MAIN BULLETIN GRID                                    */}
      {/* ======================================================== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 rounded-3xl bg-white border border-slate-200 animate-pulse overflow-hidden flex flex-col"
            >
              <div className="h-52 bg-slate-200" />
              <div className="p-5 space-y-3 flex-1">
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-full" />
                <div className="h-3 bg-slate-100 rounded-md w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={searchQuery ? 'No matching bulletins found' : 'No bulletins published yet'}
          description={
            searchQuery
              ? `No announcements or events matched "${searchQuery}". Try a different keyword.`
              : 'Keep your school community informed by publishing circulars, calendar events, or athletic photos.'
          }
          actionLabel={['super_admin', 'principal', 'teacher'].includes(role) ? '+ Publish First Notice' : undefined}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotices.map((n) => {
            const isEvent = n.type === 'Event';
            const isGallery = n.type === 'Gallery';
            const isNotice = n.type === 'Notice';

            // Target Audience Badge Info
            const audienceConfig = {
              all: { label: 'All Community', color: 'bg-slate-900/80 text-white' },
              teacher: { label: 'Faculty Only', color: 'bg-purple-900/85 text-purple-100' },
              parent: { label: 'Parents', color: 'bg-teal-900/85 text-teal-100' },
              student: { label: 'Students', color: 'bg-blue-900/85 text-blue-100' }
            };
            const audience = audienceConfig[n.targetRole] || audienceConfig.all;

            // Type Badges
            const typePill = isEvent ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md border border-amber-300 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 stroke-[2.5]" />
                <span>Event</span>
              </span>
            ) : isGallery ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500 text-white shadow-md border border-purple-300/40 flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 stroke-[2.5]" />
                <span>Gallery</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 shadow-md border border-cyan-300 flex items-center gap-1.5">
                <Bell className="w-3 h-3 stroke-[2.5]" />
                <span>Notice</span>
              </span>
            );

            // Date parsing for Event Tile
            const eventDateObj = n.eventDate ? new Date(n.eventDate) : null;
            const eventMonth = eventDateObj
              ? eventDateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
              : '';
            const eventDay = eventDateObj ? eventDateObj.getDate() : '';

            return (
              <div
                key={n._id}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-md hover:shadow-2xl hover:border-cyan-300/80 transition-all duration-300 flex flex-col justify-between"
              >
                {/* 1. TOP MEDIA SECTION (Guaranteed Equal Height: h-52) */}
                <div className="h-52 relative overflow-hidden bg-slate-950 shrink-0 select-none">
                  {n.imageUrl ? (
                    <>
                      <img
                        src={n.imageUrl}
                        alt={n.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      {/* Gradient Mask for legibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
                    </>
                  ) : (
                    /* BESPOKE GRADIENT THEME WHEN NO IMAGE IS ATTACHED */
                    <div
                      className={`w-full h-full p-6 flex flex-col justify-between relative overflow-hidden ${
                        isEvent
                          ? 'bg-gradient-to-br from-cyan-800 via-teal-900 to-slate-950'
                          : isNotice
                          ? 'bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-950'
                          : 'bg-gradient-to-br from-purple-900 via-violet-950 to-slate-950'
                      }`}
                    >
                      {/* Decorative Background Pattern */}
                      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
                      <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />

                      {/* Top Row Spacer */}
                      <div />

                      {/* Centered Graphic Emblem */}
                      <div className="flex items-center gap-4 relative z-10 my-auto">
                        {isEvent && eventDateObj ? (
                          <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-lg">
                            <div className="w-14 h-14 rounded-xl bg-white text-slate-950 flex flex-col items-center justify-center font-black shadow-inner">
                              <span className="text-[10px] text-cyan-600 leading-none">{eventMonth}</span>
                              <span className="text-xl leading-none mt-0.5">{eventDay}</span>
                            </div>
                            <div className="text-white">
                              <span className="text-[10px] uppercase font-extrabold tracking-wider text-cyan-300 block">
                                Campus Event
                              </span>
                              <span className="text-xs font-bold block">Scheduled Conference</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-white/90">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-cyan-300">
                              {isNotice ? <Megaphone className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 block">
                                Official Bulletin
                              </span>
                              <span className="text-xs font-bold text-white block">Institutional Announcement</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Row Spacer */}
                      <div />
                    </div>
                  )}

                  {/* Floating Top Left Pill: Type */}
                  <div className="absolute top-3.5 left-3.5 z-10">{typePill}</div>

                  {/* Floating Top Right Pill: Audience Scope */}
                  <div className="absolute top-3.5 right-3.5 z-10">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border border-white/20 backdrop-blur-md shadow-xs ${audience.color}`}
                    >
                      {audience.label}
                    </span>
                  </div>

                  {/* Floating Bottom Left: Publication Date */}
                  <div className="absolute bottom-3 left-3.5 z-10 flex items-center gap-1.5 text-[11px] font-bold text-slate-200 drop-shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{formatDate(n.createdAt)}</span>
                  </div>
                </div>

                {/* 2. CARD CONTENT BODY */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2">
                    <h3
                      onClick={() => setSelectedNotice(n)}
                      className="text-base font-extrabold text-slate-900 group-hover:text-cyan-700 transition leading-snug cursor-pointer line-clamp-2"
                      title={n.title}
                    >
                      {n.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                      {n.description || 'No additional summary provided.'}
                    </p>
                  </div>

                  {/* Event Schedule Chip (if applicable) */}
                  {n.eventDate && (
                    <div className="p-3 rounded-2xl bg-cyan-50/90 border border-cyan-200/90 flex items-center justify-between text-xs text-cyan-950 font-bold">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-cyan-600 shrink-0" />
                        <span>Date: {formatDate(n.eventDate)}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-200/70 text-cyan-900 text-[10px] font-black uppercase">
                        Scheduled
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. CARD FOOTER */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between mt-auto">
                  {/* Author */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                      {getInitials(n.createdBy?.name || 'Admin')}
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[130px]">
                      {n.createdBy?.name || 'Administration'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedNotice(n)}
                      className="px-2.5 py-1 text-xs font-bold text-cyan-700 hover:text-cyan-950 hover:bg-cyan-100/70 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {['super_admin', 'principal'].includes(role) && (
                      <button
                        onClick={() => setDeleteConfirmId(n._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Bulletin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. FULL DETAIL MODAL (READ NOTICE)                       */}
      {/* ======================================================== */}
      {selectedNotice && (
        <Modal
          isOpen={!!selectedNotice}
          onClose={() => setSelectedNotice(null)}
          title={selectedNotice.type === 'Event' ? 'Campus Event Details' : 'Official School Bulletin'}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            {/* Modal Image Header (if exists) */}
            {selectedNotice.imageUrl && (
              <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden relative shadow-md">
                <img
                  src={selectedNotice.imageUrl}
                  alt={selectedNotice.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3.5 left-3.5">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/95 text-slate-900 shadow-md border border-slate-200 backdrop-blur-md">
                    {selectedNotice.type}
                  </span>
                </div>
              </div>
            )}

            {/* Title & Metadata */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                <span>Posted on {formatDate(selectedNotice.createdAt)}</span>
                <span>•</span>
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span className="capitalize">{selectedNotice.targetRole} audience</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 leading-snug">
                {selectedNotice.title}
              </h2>
            </div>

            {/* Event Date Callout (if Event) */}
            {selectedNotice.eventDate && (
              <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyan-700 block">Scheduled Event Date</span>
                    <span className="text-sm font-black text-slate-900">{formatDate(selectedNotice.eventDate)}</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                  Confirmed
                </span>
              </div>
            )}

            {/* Full Description */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
              {selectedNotice.description || 'No detailed description was provided for this notice.'}
            </div>

            {/* Author Attribution */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 font-black flex items-center justify-center">
                  {getInitials(selectedNotice.createdBy?.name || 'Admin')}
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{selectedNotice.createdBy?.name || 'Administration'}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{selectedNotice.createdBy?.role || 'Staff'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 6. PUBLISH NOTICE MODAL                                  */}
      {/* ======================================================== */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publish Campus Bulletin" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bulletin Category
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
              >
                <option value="Notice">📢 Official Notice</option>
                <option value="Event">📅 Campus Calendar Event</option>
                <option value="Gallery">🖼️ Photo Gallery Showcase</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Audience
              </label>
              <select
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
              >
                <option value="all">🌐 All School Community</option>
                <option value="teacher">👨‍🏫 Faculty Only</option>
                <option value="parent">👨‍👩‍👧 Parents & Guardians</option>
                <option value="student">🎓 Students</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Bulletin Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              pattern={SECURITY_PATTERNS.titleText.pattern}
              title={SECURITY_PATTERNS.titleText.title}
              maxLength={120}
              onChange={(e) => setFormData({ ...formData, title: sanitizeInputText(e.target.value) })}
              placeholder="e.g. Annual Academic Science Olympiad & Innovation Expo"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
            />
          </div>

          {formData.type === 'Event' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Scheduled Event Date
              </label>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Media / Image URL
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Optional (Auto-gradient used if blank)</span>
            </div>
            <input
              type="url"
              value={formData.imageUrl}
              pattern="https?://[a-zA-Z0-9.\-]+(:[0-9]+)?(/.*)?"
              title="Must be a valid URL starting with http:// or https://"
              maxLength={400}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value.trim() })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
            />

            {/* Quick Sample Presets */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-bold mr-1">Quick Presets:</span>
              {samplePhotos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: p.url })}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-cyan-100 text-[10px] text-slate-700 hover:text-cyan-800 transition border border-slate-200 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Live Image Thumbnail Preview */}
            {formData.imageUrl && (
              <div className="mt-2.5 h-24 w-full rounded-xl overflow-hidden border border-slate-200 relative">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <span className="absolute bottom-1 right-2 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                  Image Preview
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Announcement / Guidelines
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Write the full announcement, session timings, guidelines, or venue details..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-cyan-500/20 border border-cyan-300 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Publishing Bulletin...' : 'Publish Bulletin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 7. DELETE CONFIRMATION DIALOG                            */}
      {/* ======================================================== */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Bulletin"
        message="Are you sure you want to permanently delete this announcement from the institutional board? This action cannot be undone."
        confirmText="Delete Bulletin"
        danger={true}
      />
    </div>
  );
};
