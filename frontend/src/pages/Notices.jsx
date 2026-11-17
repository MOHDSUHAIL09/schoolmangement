import React, { useState, useEffect } from 'react';
import { noticeAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { Modal } from '../components/Modal.jsx';
import { formatDate } from '../utils/formatters.js';
import { SECURITY_PATTERNS, sanitizeInputText } from '../utils/securityPatterns.js';
import {
  Bell,
  Calendar,
  Image as ImageIcon,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const Notices = () => {
  const { role } = useAuth();
  const { showToast } = useSchool();

  const [activeTab, setActiveTab] = useState('All');
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      const res = await noticeAPI.create(formData);
      if (res.success) {
        showToast('Institutional bulletin published', 'success', 'Published');
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await noticeAPI.delete(id);
      if (res.success) {
        showToast('Notice removed', 'success');
        fetchNotices();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Delete error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-gray-900" />
            <span>Notices, Campus Events & Gallery</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            School announcements, academic calendars, and extracurricular media.
          </p>
        </div>

        {['super_admin', 'principal', 'teacher'].includes(role) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-xs transition duration-150 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-100 border border-gray-200 w-fit">
        {['All', 'Notice', 'Event', 'Gallery'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'All' ? 'All Bulletins' : `${tab}s`}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notices.map((n) => {
          return (
            <div
              key={n._id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {n.imageUrl && (
                  <div className="h-48 w-full overflow-hidden relative">
                    <img
                      src={n.imageUrl}
                      alt={n.title}
                      className="w-full h-full object-cover transition duration-300 hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/90 text-gray-900 border border-gray-200 backdrop-blur-md">
                      {n.type}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {!n.imageUrl && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-800 border border-gray-200">
                        {n.type}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(n.createdAt)}</span>
                    </div>
                  )}

                  <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">{n.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                    {n.description}
                  </p>

                  {n.eventDate && (
                    <div className="mt-4 p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2.5 text-xs text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                      <span><strong>Event Date:</strong> {formatDate(n.eventDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>By: {n.createdBy?.name || 'Administration'}</span>
                {['super_admin', 'principal'].includes(role) && (
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="text-red-500 hover:text-red-700 transition"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Publish Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publish School Bulletin">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
              >
                <option value="Notice">School Notice</option>
                <option value="Event">Calendar Event</option>
                <option value="Gallery">Gallery Item</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Target Audience</label>
              <select
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
              >
                <option value="all">All School Community</option>
                <option value="teacher">Faculty Only</option>
                <option value="parent">Parents & Guardians</option>
                <option value="student">Students</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              pattern={SECURITY_PATTERNS.titleText.pattern}
              title={SECURITY_PATTERNS.titleText.title}
              maxLength={120}
              onChange={(e) => setFormData({ ...formData, title: sanitizeInputText(e.target.value) })}
              placeholder="e.g. Annual Academic Science Fair"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
            />
          </div>

          {formData.type === 'Event' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Scheduled Date</label>
              <input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Media / Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              pattern="https?://[a-zA-Z0-9.\-]+(:[0-9]+)?(/.*)?"
              title="Must be a valid URL starting with http:// or https://"
              maxLength={300}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value.trim() })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Description / Content</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Write the full announcement or event guidelines..."
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
