import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { ChildSelector } from './ChildSelector.jsx';
import { getRoleLabel, getRoleBadgeClass } from '../utils/formatters.js';
import { noticeAPI } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import {
  Menu,
  Bell,
  LogOut,
  User as UserIcon,
  Sparkles,
  Calendar,
  Clock,
  ChevronDown,
  Search,
  Globe
} from 'lucide-react';

export const Navbar = ({ setIsMobileOpen }) => {
  const { user, role, logout } = useAuth();
  const { settings, showToast } = useSchool();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveNotices, setLiveNotices] = useState([]);
  const [unreadNoticesCount, setUnreadNoticesCount] = useState(0);
  const [loadingNotices, setLoadingNotices] = useState(false);

  const playNoticeChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio autoplay policy
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const fetchLiveNotices = async () => {
    try {
      setLoadingNotices(true);
      const res = await noticeAPI.getAll();
      if (res.success && Array.isArray(res.data)) {
        setLiveNotices(res.data);
      }
    } catch (err) {
      console.warn('Navbar notices fetch error:', err.message);
    } finally {
      setLoadingNotices(false);
    }
  };

  useEffect(() => {
    fetchLiveNotices();

    const handleNoticeUpdate = () => {
      fetchLiveNotices();
    };

    window.addEventListener('notice-published', handleNoticeUpdate);

    // Real-time socket event for instant notifications
    const socket = getSocket();
    const onNewNotice = (notice) => {
      if (!notice) return;
      setLiveNotices((prev) => [notice, ...prev.filter((n) => n._id !== notice._id)]);
      setUnreadNoticesCount((prev) => prev + 1);
      playNoticeChime();

      if (showToast) {
        showToast(
          notice.title,
          'info',
          `📢 New Notice: ${notice.targetRole === 'all' ? 'All Community' : notice.targetRole.toUpperCase()}`
        );
      }

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`School Notice: ${notice.title}`, {
            body: notice.description || 'New notice on SchoolSphere board',
            icon: '/graduate-student.jpg'
          });
        } catch {}
      }
    };

    if (socket) {
      socket.on('new_notice', onNewNotice);
    }

    const interval = setInterval(fetchLiveNotices, 20000);

    return () => {
      window.removeEventListener('notice-published', handleNoticeUpdate);
      if (socket) socket.off('new_notice', onNewNotice);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 h-20 bg-white/95 backdrop-blur-md border-b border-[#FEEAE1] px-4 sm:px-8 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Menu Toggle & System Indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden p-2 rounded-xl bg-[#FFF6F2] text-gray-600 hover:text-gray-900 border border-[#FEEAE1]"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* School Name & Live Academic Session */}
        <div className="hidden md:flex items-center gap-3">
          <span className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5E3A] animate-pulse" />
            {settings.schoolName || 'SchoolSphere International Academy'}
          </span>
          <span className="text-slate-300">|</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF0EB] border border-[#FEEAE1] text-xs text-[#7F240E]">
          <span className="text-[#FF5E3A] font-medium">Session:</span>
          <span className="font-bold">{settings.academicYear || '2026-2027'}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF6F2] border border-[#FEEAE1] text-xs text-gray-600">
          <Clock className="w-3.5 h-3.5 text-[#FF5E3A]" />
          <span className="font-medium">
            {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Right Area: Child Selector (for Parent), Notifications & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Public Landing Link */}
        <Link
          to="/"
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#FFF0EB] text-slate-700 hover:text-[#FF5E3A] border border-slate-200 hover:border-[#FEEAE1] text-xs font-semibold transition"
          title="Visit Public School Landing Page"
        >
          <Globe className="w-3.5 h-3.5 text-[#FF5E3A]" />
          <span>Public Landing</span>
        </Link>

        {/* Multi-Child Selector for Parent */}
        <ChildSelector />

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setUnreadNoticesCount(0);
              if (!isNotifOpen) fetchLiveNotices();
            }}
            className="relative p-2.5 rounded-xl bg-[#FFF6F2] hover:bg-[#FFF0EB] text-[#1E232F] border border-[#FEEAE1] hover:border-[#FF5E3A] transition cursor-pointer"
            title="School Notifications & Notices"
          >
            <Bell className="w-4 h-4 text-[#FF5E3A]" />
            {unreadNoticesCount > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-[#FF5E3A] rounded-full shadow-sm flex items-center justify-center animate-bounce">
                {unreadNoticesCount}
              </span>
            ) : liveNotices.length > 0 ? (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5E3A]" />
            ) : null}
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#FEEAE1] p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-[#FEEAE1]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF5E3A] animate-pulse" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E232F]">Notice Notifications</h4>
                  </div>
                  <span className="text-[10px] font-bold text-[#FF5E3A] bg-[#FFF0EB] px-2.5 py-0.5 rounded-full border border-[#FEEAE1]">
                    {liveNotices.length} Published
                  </span>
                </div>

                <div className="py-3 space-y-2 text-xs max-h-80 overflow-y-auto">
                  {loadingNotices && liveNotices.length === 0 ? (
                    <div className="p-4 text-center text-[#5A6272]">Loading notices...</div>
                  ) : liveNotices.length === 0 ? (
                    <div className="p-4 text-center text-[#5A6272] space-y-1">
                      <Bell className="w-6 h-6 mx-auto text-slate-300" />
                      <p className="font-semibold text-xs text-[#1E232F]">No active notices</p>
                      <p className="text-[11px] text-[#5A6272]">Published school notices will appear here instantly.</p>
                    </div>
                  ) : (
                    liveNotices.slice(0, 5).map((notice) => (
                      <Link
                        key={notice._id}
                        to="/notices"
                        onClick={() => setIsNotifOpen(false)}
                        className="block p-3 rounded-xl bg-[#FFF6F2]/80 hover:bg-[#FFF0EB] border border-[#FEEAE1] hover:border-[#FF5E3A] transition text-left group"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#5A6272] mb-1">
                          <span className="font-bold uppercase tracking-wider text-[#FF5E3A] bg-white px-2 py-0.5 rounded-md border border-[#FEEAE1]">
                            {notice.type || 'Notice'}
                          </span>
                          <span className="text-[#5A6272] font-medium">
                            {formatRelativeTime(notice.createdAt)}
                          </span>
                        </div>
                        <p className="font-bold text-[#1E232F] group-hover:text-[#FF5E3A] transition line-clamp-1">
                          {notice.title}
                        </p>
                        {notice.description && (
                          <p className="text-[#5A6272] text-[11px] mt-0.5 line-clamp-2">
                            {notice.description}
                          </p>
                        )}
                        {notice.targetRole && notice.targetRole !== 'all' && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#5A6272] font-semibold uppercase">
                            <span>Audience:</span>
                            <span className="text-[#FF5E3A] capitalize font-bold">{notice.targetRole}</span>
                          </div>
                        )}
                      </Link>
                    ))
                  )}
                </div>

                <Link
                  to="/notices"
                  onClick={() => setIsNotifOpen(false)}
                  className="block text-center text-xs font-bold text-[#1E232F] hover:text-[#FF5E3A] pt-2.5 border-t border-[#FEEAE1] transition"
                >
                  View All Notices &rarr;
                </Link>
              </div>
            </>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0 shadow-xs">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="hidden sm:block text-left truncate max-w-[130px]">
              <div className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Authorized User'}</div>
              <div className="text-[10px] font-semibold truncate">
                <span className={`px-1.5 py-0.5 rounded-full border ${getRoleBadgeClass(role)}`}>
                  {getRoleLabel(role)}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRoleBadgeClass(role)}`}>
                      {getRoleLabel(role)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">&bull; Verified</span>
                  </div>                </div>

                <div className="py-1.5">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <span>My Profile</span>
                  </Link>

                  {['super_admin', 'admin', 'principal'].includes(role) && (
                    <Link
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Sparkles className="w-4 h-4 text-gray-500" />
                      <span>School Settings</span>
                    </Link>
                  )}
                </div>

                <div className="pt-1.5 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
