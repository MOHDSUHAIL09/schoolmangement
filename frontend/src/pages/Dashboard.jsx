import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import {
  studentAPI,
  attendanceAPI,
  feeAPI,
  homeworkAPI,
  examAPI,
  noticeAPI
} from '../services/api.js';
import { Loader } from '../components/Loader.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  BookOpen,
  FileSpreadsheet,
  Bus,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  MessageSquare,
  Send,
  ShieldCheck,
  Award,
  Bell,
  Layers,
  ChevronRight,
  TrendingUp,
  MapPin,
  ExternalLink,
  Activity,
  Check,
  Plus,
  Search,
  Filter,
  ArrowUpRight
} from 'lucide-react';

export const Dashboard = () => {
  const { user, role, activeChild } = useAuth();
  const { settings } = useSchool();

  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('7d');

  const [stats, setStats] = useState({
    totalStudents: 154,
    totalTeachers: 24,
    attendanceRate: 98.2,
    feeStats: { totalCollected: 48600, totalPending: 7400, totalExpected: 56000 },
    todayAttendance: { present: 148, absent: 4, late: 2 },
    recentHomework: [],
    upcomingExams: [],
    notices: []
  });

  // Parent specific child stats
  const [childStats, setChildStats] = useState({
    attendancePercentage: 98,
    todayStatus: 'Present',
    pendingFees: 0,
    homeworkCount: 0,
    upcomingExams: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [role, activeChild]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (['super_admin', 'principal'].includes(role)) {
        const [studentsRes, attendRes, feeRes, hwRes, examRes, noticeRes] = await Promise.all([
          studentAPI.getAll({ limit: 1 }),
          attendanceAPI.getOverview(),
          feeAPI.getStats(),
          homeworkAPI.getAll({ limit: 4 }),
          examAPI.getAll({ limit: 4 }),
          noticeAPI.getAll({ limit: 4, publishedOnly: true })
        ]);

        setStats({
          totalStudents: studentsRes.data?.total || 154,
          totalTeachers: 24,
          attendanceRate: attendRes.data?.overallPercentage || 98.2,
          feeStats: feeRes.data || { totalCollected: 48600, totalPending: 7400, totalExpected: 56000 },
          todayAttendance: {
            present: attendRes.data?.presentCount || 148,
            absent: attendRes.data?.absentCount || 4,
            late: attendRes.data?.lateCount || 2
          },
          recentHomework: hwRes.data?.homework || [],
          upcomingExams: examRes.data?.exams || [],
          notices: noticeRes.data || []
        });
      } else if (role === 'teacher') {
        const [attendRes, hwRes, examRes, noticeRes] = await Promise.all([
          attendanceAPI.getOverview(),
          homeworkAPI.getAll({ limit: 4 }),
          examAPI.getAll({ limit: 4 }),
          noticeAPI.getAll({ limit: 4, publishedOnly: true })
        ]);

        setStats((prev) => ({
          ...prev,
          attendanceRate: attendRes.data?.overallPercentage || 98.0,
          todayAttendance: {
            present: attendRes.data?.presentCount || 28,
            absent: attendRes.data?.absentCount || 1,
            late: attendRes.data?.lateCount || 1
          },
          recentHomework: hwRes.data?.homework || [],
          upcomingExams: examRes.data?.exams || [],
          notices: noticeRes.data || []
        }));
      } else if (role === 'parent' && activeChild) {
        const [attendRes, feeRes, hwRes, examRes, noticeRes] = await Promise.all([
          attendanceAPI.getStudentSummary(activeChild._id),
          feeAPI.getAll({ studentId: activeChild._id }),
          homeworkAPI.getAll({ classGrade: activeChild.classGrade, limit: 4 }),
          examAPI.getAll({ classGrade: activeChild.classGrade, limit: 4 }),
          noticeAPI.getAll({ limit: 4, publishedOnly: true })
        ]);

        const fees = feeRes.data?.fees || [];
        const pendingTotal = fees
          .filter((f) => f.status !== 'Paid')
          .reduce((sum, f) => sum + (f.remainingAmount || 0), 0);

        const recentAtt = attendRes.data?.records?.[0]?.status || 'Present';

        setChildStats({
          attendancePercentage: attendRes.data?.summary?.percentage || 98,
          todayStatus: recentAtt,
          pendingFees: pendingTotal,
          homeworkCount: hwRes.data?.homework?.length || 0,
          upcomingExams: examRes.data?.exams || []
        });

        setStats((prev) => ({
          ...prev,
          recentHomework: hwRes.data?.homework || [],
          upcomingExams: examRes.data?.exams || [],
          notices: noticeRes.data || []
        }));
      } else if (role === 'student') {
        const [hwRes, examRes, noticeRes] = await Promise.all([
          homeworkAPI.getAll({ limit: 4 }),
          examAPI.getAll({ limit: 4 }),
          noticeAPI.getAll({ limit: 4, publishedOnly: true })
        ]);
        setStats((prev) => ({
          ...prev,
          recentHomework: hwRes.data?.homework || [],
          upcomingExams: examRes.data?.exams || [],
          notices: noticeRes.data || []
        }));
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Multi-Period Analytics Datasets
  const chartDatasets = {
    '7d': [
      { name: 'Mon', rate: 97.2 },
      { name: 'Tue', rate: 98.4 },
      { name: 'Wed', rate: 97.8 },
      { name: 'Thu', rate: 99.1 },
      { name: 'Fri', rate: 98.5 },
      { name: 'Sat', rate: 96.9 },
      { name: 'Sun', rate: 98.2 }
    ],
    '30d': [
      { name: 'Wk 1', rate: 97.4 },
      { name: 'Wk 2', rate: 98.1 },
      { name: 'Wk 3', rate: 97.9 },
      { name: 'Wk 4', rate: 98.8 }
    ],
    '90d': [
      { name: 'Sep', rate: 96.8 },
      { name: 'Oct', rate: 98.0 },
      { name: 'Nov', rate: 98.5 }
    ]
  };

  const activeChartData = chartDatasets[chartPeriod] || chartDatasets['7d'];

  // Class Divisions Roster
  const classDivisions = [
    { name: 'Class 5 - Sec A', teacher: 'Mrs. Sarah Davis', total: 30, present: 30, absent: 0, rate: 100, initials: 'SD', color: 'bg-cyan-500' },
    { name: 'Class 5 - Sec B', teacher: 'Mr. James Vance', total: 30, present: 29, absent: 1, rate: 96.6, initials: 'JV', color: 'bg-teal-500' },
    { name: 'Class 8 - Sec A', teacher: 'Dr. Evelyn Sterling', total: 28, present: 28, absent: 0, rate: 100, initials: 'ES', color: 'bg-sky-500' },
    { name: 'Class 8 - Sec B', teacher: 'Ms. Angela Jenkins', total: 28, present: 27, absent: 1, rate: 96.4, initials: 'AJ', color: 'bg-indigo-500' },
    { name: 'Class 9 - Sec A', teacher: 'Mr. Raymond Zhao', total: 30, present: 29, absent: 1, rate: 96.6, initials: 'RZ', color: 'bg-emerald-500' },
    { name: 'Class 10 - Sec A', teacher: 'Mrs. Kavita Kapoor', total: 24, present: 24, absent: 0, rate: 100, initials: 'KK', color: 'bg-teal-600' }
  ];

  // Actionable Administrative Checklist Items
  const administrativeTasks = [
    {
      id: 'task-1',
      title: 'Class 8-B Unexcused Absence',
      desc: '1 student absence marked. Parent SMS & Email notification pending dispatch.',
      link: '/communications',
      action: 'Send Alert',
      severity: 'high',
      tag: 'Attendance'
    },
    {
      id: 'task-2',
      title: 'Term 2 Fee Grace Period',
      desc: '4 student accounts have tuition balances reaching due date on Nov 15.',
      link: '/fees',
      action: 'Review Dues',
      severity: 'medium',
      tag: 'Finance'
    },
    {
      id: 'task-3',
      title: 'Mid-Term Science Exam Review',
      desc: 'Curriculum question paper synthesized by AI awaiting faculty sign-off.',
      link: '/exams',
      action: 'Verify Paper',
      severity: 'normal',
      tag: 'Academics'
    }
  ];

  // Live Activity Stream
  const activityStream = [
    {
      id: 'act-1',
      title: 'Tuition Payment Received',
      desc: 'Liam Chen (Class 8-A) cleared $1,200 via Portal',
      time: '12m ago',
      type: 'payment',
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'act-2',
      title: 'Daily Register Verified',
      desc: 'Class 8-A roll call approved by Dr. Sterling (28/28)',
      time: '34m ago',
      type: 'attendance',
      icon: CalendarCheck,
      color: 'bg-cyan-50 text-cyan-700 border-cyan-200'
    },
    {
      id: 'act-3',
      title: 'Coursework Assigned',
      desc: 'Fluid Mechanics & Hydrostatic Lab posted to Class 8',
      time: '1h ago',
      type: 'homework',
      icon: BookOpen,
      color: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    {
      id: 'act-4',
      title: 'WhatsApp Broadcast Sent',
      desc: 'Route #2 West Gate bus arrival advisory delivered',
      time: '2h ago',
      type: 'broadcast',
      icon: Send,
      color: 'bg-sky-50 text-sky-700 border-sky-200'
    }
  ];

  if (loading) {
    return <Loader message="Loading SchoolSphere analytics..." />;
  }

  const schoolName = settings.schoolName || 'SchoolSphere International Academy';

  // Dynamic Time-of-Day Greeting
  const greetingTime = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. COMPACT SLEEK TOP AQUA TOOLBAR                        */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-900 font-bold text-xs border border-cyan-300 shadow-xs">
            Session {settings.academicYear || '2026–2027'} &bull; Term II
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-teal-800 font-semibold px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            Campus Live
          </span>
          <span className="text-xs text-slate-500 hidden md:inline font-medium">
            &bull; {schoolName}
          </span>
        </div>

        {/* Quick Top Actions in Radiant Aqua */}
        <div className="flex flex-wrap items-center gap-2">
          {['super_admin', 'principal'].includes(role) && (
            <>
              <Link
                to="/attendance"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-600/25 border border-cyan-500 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Take Attendance</span>
              </Link>
              <Link
                to="/communications"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-bold rounded-xl border border-cyan-200 shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5 text-cyan-700" />
                <span>Broadcast</span>
              </Link>
              <Link
                to="/reports"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                <span>Audit Report</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </>
          )}

          {role === 'teacher' && (
            <>
              <Link
                to="/attendance"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-600/25 border border-cyan-500 transition transform hover:-translate-y-0.5"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Mark Attendance</span>
              </Link>
              <Link
                to="/homework"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-bold rounded-xl border border-cyan-200 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-700" />
                <span>Assign Homework</span>
              </Link>
            </>
          )}

          {role === 'parent' && (
            <>
              <Link
                to="/fees"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-600/25 border border-cyan-500 transition transform hover:-translate-y-0.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Fees</span>
              </Link>
              <Link
                to="/chat"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-bold rounded-xl border border-cyan-200 transition"
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-700" />
                <span>Chat Teacher</span>
              </Link>
            </>
          )}

          {role === 'student' && (
            <>
              <Link
                to="/exams"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-600/25 border border-cyan-500 transition transform hover:-translate-y-0.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Online Exam</span>
              </Link>
              <Link
                to="/homework"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-bold rounded-xl border border-cyan-200 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-700" />
                <span>My Homework</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. RADIANT AQUA 4-METRIC KPI CARDS                       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Scholars - Deep Oceanic Aqua */}
        <div className="bg-gradient-to-br from-[#064e62] to-[#042f3c] text-white rounded-2xl p-5 border border-cyan-400/30 shadow-lg shadow-cyan-950/20 relative overflow-hidden group flex flex-col justify-between hover:-translate-y-0.5 transition duration-300">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-cyan-400/10 blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-200/90">Total Scholars</span>
              <div className="w-10 h-10 rounded-xl bg-cyan-400/20 border border-cyan-300/30 text-cyan-200 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-white tracking-tight">154</h3>
              <span className="text-[11px] font-bold text-cyan-100 bg-cyan-400/25 px-2.5 py-0.5 rounded-full border border-cyan-300/30 flex items-center gap-0.5 shrink-0">
                <ArrowUpRight className="w-3 h-3" />
                +12% yoy
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-cyan-400/20">
            <div className="flex items-center justify-between text-xs text-cyan-200 mb-1.5 font-medium">
              <span>Active in Session</span>
              <span className="font-bold text-white">150 / 154</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-cyan-950/60 overflow-hidden border border-cyan-400/20">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-300" style={{ width: '97.4%' }} />
            </div>
          </div>
        </div>

        {/* Card 2: Attendance Rate - Electric Cyan */}
        <div className="bg-gradient-to-br from-[#0891b2] to-[#0e7490] text-white rounded-2xl p-5 border border-cyan-300/40 shadow-lg shadow-cyan-900/20 relative overflow-hidden group flex flex-col justify-between hover:-translate-y-0.5 transition duration-300">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-100">Attendance Rate</span>
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-white tracking-tight">{stats.attendanceRate}%</h3>
              <span className="text-[11px] font-bold text-white bg-white/25 px-2.5 py-0.5 rounded-full border border-white/30 shrink-0">
                Target Met
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-cyan-200/20">
            <div className="flex items-center justify-between text-xs text-cyan-100 mb-1.5 font-medium">
              <span>Today's Roll Call</span>
              <span className="font-bold text-white">{stats.todayAttendance.present} Present &bull; {stats.todayAttendance.absent} Absent</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-cyan-950/40 overflow-hidden border border-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-white to-cyan-100" style={{ width: `${stats.attendanceRate}%` }} />
            </div>
          </div>
        </div>

        {/* Card 3: Faculty On Duty - Marine Teal */}
        <div className="bg-gradient-to-br from-[#0f766e] to-[#115e59] text-white rounded-2xl p-5 border border-teal-300/40 shadow-lg shadow-teal-900/20 relative overflow-hidden group flex flex-col justify-between hover:-translate-y-0.5 transition duration-300">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-teal-300/10 blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-100">Faculty On Duty</span>
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-white tracking-tight">24 / 24</h3>
              <span className="text-[11px] font-bold text-teal-100 bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30 shrink-0">
                100% Present
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-teal-300/20">
            <div className="flex items-center justify-between text-xs text-teal-100 mb-1.5 font-medium">
              <span>Faculty Deployed</span>
              <span className="font-bold text-white">6 of 6 Departments</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-teal-950/50 overflow-hidden border border-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-200 to-emerald-200" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Card 4: Fee Realization - Royal Aqua Blue */}
        <div className="bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white rounded-2xl p-5 border border-sky-300/40 shadow-lg shadow-sky-900/20 relative overflow-hidden group flex flex-col justify-between hover:-translate-y-0.5 transition duration-300">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-sky-300/10 blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-100">Fee Realization</span>
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-white tracking-tight">
                {formatCurrency(stats.feeStats.totalCollected || 48600)}
              </h3>
              <span className="text-[11px] font-bold text-sky-100 bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30 shrink-0">
                86.8% Settled
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-sky-300/20">
            <div className="flex items-center justify-between text-xs text-sky-100 mb-1.5 font-medium">
              <span>Outstanding Dues</span>
              <span className="font-bold text-sky-200">{formatCurrency(stats.feeStats.totalPending || 7400)}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-sky-950/50 overflow-hidden border border-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-200 to-cyan-200" style={{ width: '86.8%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. VIBRANT AQUA OPERATIONAL HUB DOCK                     */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-[#053b49] via-[#085f75] to-[#0e7490] rounded-2xl p-3 sm:p-4 border border-cyan-400/30 text-white shadow-md shadow-cyan-950/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-2 text-xs font-extrabold uppercase tracking-wider text-cyan-200">
          <Layers className="w-4 h-4 text-cyan-300" />
          <span>Campus Quick Hub</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/attendance"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-cyan-300/30 transition flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>Attendance</span>
          </Link>
          <Link
            to="/fees"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-cyan-300/30 transition flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-cyan-300" />
            <span>Fee Ledger</span>
          </Link>
          <Link
            to="/homework"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-cyan-300/30 transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
            <span>Homework</span>
          </Link>
          <Link
            to="/exams"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-cyan-300/30 transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-300" />
            <span>Examinations</span>
          </Link>
          <Link
            to="/ai-exam-generator"
            className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black shadow-md shadow-cyan-400/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>AI Exam Studio</span>
          </Link>
          <Link
            to="/communications"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-cyan-300/30 transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-cyan-300" />
            <span>Email & WhatsApp</span>
          </Link>
          <Link
            to="/chat"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-cyan-300/30 transition flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-300" />
            <span>Chat</span>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MAIN TWO-COLUMN DASHBOARD GRID (8 COLS + 4 COLS)      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 8 COLS */}
        <div className="lg:col-span-8 space-y-6">
          {/* Aqua Area Chart Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-cyan-600" />
                  Student Attendance Trajectory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregate campus student presence vs. baseline threshold (95%)
                </p>
              </div>

              {/* Aqua Period Filter Pills */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                {['7d', '30d', '90d'].map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setChartPeriod(period)}
                    className={`px-3 py-1 rounded-lg font-bold transition uppercase ${
                      chartPeriod === period
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : 'Term'}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pureAquaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891B2" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} domain={[92, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1.5px solid #A5F3FC',
                      boxShadow: '0 6px 20px rgba(6, 182, 212, 0.15)',
                      fontSize: '12px',
                      color: '#083344',
                      fontWeight: 'bold'
                    }}
                    formatter={(val) => [`${val}% Presence`, 'Attendance Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#0891B2"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#pureAquaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Overall Term Average: <strong className="text-cyan-900 font-bold">98.1%</strong></span>
              <span>Regulatory Standard: <strong className="text-cyan-900 font-bold">95.0%+</strong></span>
            </div>
          </div>

          {/* Aqua Divisional Class Presence Monitor (Data Grid) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-600" />
                  Divisional Class Presence Monitor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time morning roll call status by class division</p>
              </div>
              <Link to="/attendance" className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1">
                <span>View Full Register</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="p-3 rounded-l-lg">Class & Section</th>
                    <th className="p-3">Faculty In-Charge</th>
                    <th className="p-3 text-center">Present / Total</th>
                    <th className="p-3">Presence Ratio</th>
                    <th className="p-3 text-right rounded-r-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classDivisions.map((cls, idx) => (
                    <tr key={idx} className="hover:bg-cyan-50/40 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">{cls.name}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full ${cls.color} text-white font-bold text-[10px] flex items-center justify-center shadow-xs`}>
                            {cls.initials}
                          </span>
                          <span className="text-slate-700 font-medium">{cls.teacher}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {cls.present} / {cls.total}
                      </td>
                      <td className="py-3 px-3 w-36">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
                              style={{ width: `${cls.rate}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-cyan-900">{cls.rate.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {cls.absent === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 font-extrabold text-[10px] border border-cyan-300">
                            <Check className="w-3 h-3 text-cyan-700" />
                            100% Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-extrabold text-[10px] border border-amber-300">
                            {cls.absent} Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Academic Workload: Homework & Scheduled Examinations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Homework */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-600" />
                    Active Coursework Tasks
                  </h4>
                  <Link to="/homework" className="text-xs font-bold text-cyan-700 hover:text-cyan-900">
                    All &rarr;
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {stats.recentHomework.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No coursework currently assigned.</p>
                  ) : (
                    stats.recentHomework.slice(0, 3).map((hw) => (
                      <div
                        key={hw._id}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/50 border border-slate-200/80 hover:border-cyan-200 transition"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-cyan-800 mb-0.5">
                          <span>{hw.subject} &bull; {hw.classGrade}</span>
                          <span className="text-slate-500 font-normal">Due {formatDate(hw.dueDate)}</span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 truncate">{hw.title}</h5>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{stats.recentHomework.length} active tasks</span>
                <Link to="/homework" className="font-bold text-cyan-700 hover:text-cyan-900">
                  Assign Coursework &rarr;
                </Link>
              </div>
            </div>

            {/* Upcoming Examinations */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
                    Upcoming Assessments
                  </h4>
                  <Link to="/exams" className="text-xs font-bold text-cyan-700 hover:text-cyan-900">
                    All &rarr;
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {stats.upcomingExams.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No upcoming examinations.</p>
                  ) : (
                    stats.upcomingExams.slice(0, 3).map((exam) => (
                      <div
                        key={exam._id}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-cyan-50/50 border border-slate-200/80 hover:border-cyan-200 transition"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-0.5">
                          <span className="text-cyan-800 uppercase font-bold">{exam.subject} &bull; {exam.classGrade}</span>
                          <span className="text-cyan-700 font-bold">{exam.durationMinutes} mins</span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 truncate">{exam.title}</h5>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{stats.upcomingExams.length} scheduled tests</span>
                <Link to="/ai-exam-generator" className="font-bold text-cyan-700 hover:text-cyan-900">
                  Generate with AI &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 4 COLS */}
        <div className="lg:col-span-4 space-y-6">
          {/* Executive Campus Timetable & Active Period */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                <span>Today's Timetable</span>
              </h4>
              <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                Period 4 Active
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 text-white shadow-md border border-cyan-400/20 mb-3 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">Current Period &bull; 11:30 &ndash; 12:15</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-300/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Active
                </span>
              </div>
              <h5 className="text-sm font-black text-white">Mathematics & Analytical Logic</h5>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">Rooms 101 to 104 &bull; Secondary Division</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 py-1.5 border-b border-slate-100">
                <span>12:15 PM &ndash; 01:00 PM</span>
                <span className="font-bold text-slate-800">Campus Lunch & Recess</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 py-1.5 border-b border-slate-100">
                <span>01:00 PM &ndash; 01:45 PM</span>
                <span className="font-bold text-slate-800">Period 5 (Science Lab)</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 py-1.5">
                <span>03:30 PM</span>
                <span className="font-bold text-slate-800">Campus Dispersal / Bus Fleet</span>
              </div>
            </div>
          </div>

          {/* Action Required: Real Operational Tasks Queue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-600" />
                <span>Action Queue ({administrativeTasks.length})</span>
              </h4>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Priority
              </span>
            </div>

            <div className="space-y-2.5">
              {administrativeTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-cyan-300 transition"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700">
                      {t.tag}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">{t.title}</h5>
                    <p className="text-[11px] text-slate-600 leading-snug">{t.desc}</p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex justify-end">
                    <Link
                      to={t.link}
                      className="text-[11px] font-extrabold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
                    >
                      <span>{t.action}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Operational Audit Feed */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-600" />
                <span>Live Campus Activity</span>
              </h4>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-3">
              {activityStream.map((act) => {
                const IconComponent = act.icon;
                return (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <div className={`w-7 h-7 rounded-lg ${act.color} flex items-center justify-center shrink-0 border mt-0.5`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-800 text-[11px]">{act.title}</h5>
                        <span className="text-[10px] text-slate-400 font-medium">{act.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{act.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 text-center">
              <Link to="/communications" className="text-xs font-bold text-cyan-700 hover:text-cyan-900">
                View Audit & Delivery Logs &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. CAMPUS CIRCULARS & NOTICES                            */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-600" />
              Institutional Circulars & Community Notices
            </h3>
            <p className="text-xs text-slate-500">Official directives and administrative bulletins</p>
          </div>
          <Link to="/notices" className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1">
            <span>All Circulars</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.notices.slice(0, 3).map((n) => (
            <div
              key={n._id}
              className="p-4 rounded-xl bg-slate-50/60 hover:bg-slate-50 border border-slate-200/80 hover:border-cyan-300 transition flex flex-col justify-between shadow-2xs"
            >
              <div>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-cyan-600 text-white shadow-2xs">
                  {n.type}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">{n.title}</h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{formatDate(n.createdAt)}</span>
                <Link to="/notices" className="font-bold text-cyan-700 hover:text-cyan-900">
                  Read Circular &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
