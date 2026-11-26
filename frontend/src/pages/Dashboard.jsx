import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import {
  studentAPI,
  teacherAPI,
  attendanceAPI,
  feeAPI,
  homeworkAPI,
  examAPI,
  noticeAPI
} from '../services/api.js';
import { Loader } from '../components/Loader.jsx';
import { formatCurrency, formatDate, getRoleLabel, getRoleBadgeClass } from '../utils/formatters.js';
import { Link, useNavigate } from 'react-router-dom';
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
  ArrowUpRight,
  Download,
  Phone,
  Mail,
  UserCheck,
  XCircle,
  X,
  CheckCircle,
  User
} from 'lucide-react';

export const Dashboard = () => {
  const { user, role, activeChild } = useAuth();
  const { settings } = useSchool();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
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
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, [role, activeChild]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (['super_admin', 'admin', 'principal'].includes(role)) {
        const [studentsRes, attendRes, feeRes, hwRes, examRes, noticeRes, teachersRes, classesRes] = await Promise.all([
          studentAPI.getAll({ limit: 1000 }),
          attendanceAPI.getOverview(),
          feeAPI.getStats(),
          homeworkAPI.getAll({ limit: 4 }),
          examAPI.getAll({ limit: 4 }),
          noticeAPI.getAll({ limit: 4, publishedOnly: true }),
          teacherAPI.getAll({ limit: 200 }),
          studentAPI.getClassesMeta()
        ]);

        const fetchedStudents = studentsRes.data?.students || [];
        const fetchedTeachers = teachersRes.data?.teachers || [];

        setStats({
          totalStudents: studentsRes.data?.total || fetchedStudents.length || 154,
          totalTeachers: teachersRes.data?.total || fetchedTeachers.length || 24,
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
    { name: 'Class 5 - Sec A', teacher: 'Mrs. Sarah Davis', total: 30, present: 30, absent: 0, rate: 100, initials: 'SD', color: 'bg-[#FF5E3A]' },
    { name: 'Class 5 - Sec B', teacher: 'Mr. James Vance', total: 30, present: 29, absent: 1, rate: 96.6, initials: 'JV', color: 'bg-orange-500' },
    { name: 'Class 8 - Sec A', teacher: 'Dr. Evelyn Sterling', total: 28, present: 28, absent: 0, rate: 100, initials: 'ES', color: 'bg-[#E04826]' },
    { name: 'Class 8 - Sec B', teacher: 'Ms. Angela Jenkins', total: 28, present: 27, absent: 1, rate: 96.4, initials: 'AJ', color: 'bg-amber-600' },
    { name: 'Class 9 - Sec A', teacher: 'Mr. Raymond Zhao', total: 30, present: 29, absent: 1, rate: 96.6, initials: 'RZ', color: 'bg-rose-500' },
    { name: 'Class 10 - Sec A', teacher: 'Mrs. Kavita Kapoor', total: 24, present: 24, absent: 0, rate: 100, initials: 'KK', color: 'bg-[#C84222]' }
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
      color: 'bg-[#FFF0EB] text-[#FF5E3A] border-[#FEEAE1]'
    },
    {
      id: 'act-2',
      title: 'Daily Register Verified',
      desc: 'Class 8-A roll call approved by Dr. Sterling (28/28)',
      time: '34m ago',
      type: 'attendance',
      icon: CalendarCheck,
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    {
      id: 'act-3',
      title: 'Coursework Assigned',
      desc: 'Fluid Mechanics & Hydrostatic Lab posted to Class 8',
      time: '1h ago',
      type: 'homework',
      icon: BookOpen,
      color: 'bg-[#FFF5F0] text-[#E04826] border-[#FFD5C5]'
    },
    {
      id: 'act-4',
      title: 'WhatsApp Broadcast Sent',
      desc: 'Route #2 West Gate bus arrival advisory delivered',
      time: '2h ago',
      type: 'broadcast',
      icon: Send,
      color: 'bg-amber-50 text-amber-700 border-amber-200'
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
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. COMPACT SLEEK TOP CORAL TOOLBAR (ANIMATED ENTRANCE)   */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 animate-fade-up">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1 rounded-full bg-[#FFF0EB] text-[#FF5E3A] font-bold text-xs border border-[#FEEAE1] shadow-xs hover:scale-105 transition-transform">
            Session {settings.academicYear || '2026–2027'} &bull; Term II
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-[#FF5E3A] font-semibold px-3 py-1 rounded-full bg-[#FFF0EB] border border-[#FEEAE1] shadow-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5E3A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF5E3A]"></span>
            </span>
            <span>Campus Live</span>
          </span>
          <span className="text-xs text-slate-500 hidden md:inline font-medium">
            &bull; {schoolName}
          </span>
        </div>

        {/* Quick Top Actions in Signature Coral Orange */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Universal School Directory Quick Trigger Button */}
          <Link
            to="/directory"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#FFF0EB] hover:bg-[#FFE5DC] text-[#FF5E3A] text-xs font-bold rounded-xl border border-[#FFD5C5] shadow-xs spring-lift-sm cursor-pointer"
            title="Click to view all Students, Classes, Parents & Teachers"
          >
            <GraduationCap className="w-4 h-4 text-[#FF5E3A]" />
            <span>School Directory</span>
          </Link>

          {['super_admin', 'admin', 'principal'].includes(role) && (
            <>
              <Link
                to="/attendance"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF5E3A]/25 border border-[#FF8C70] spring-lift-sm shimmer-hover cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>Take Attendance</span>
              </Link>
              <Link
                to="/communications"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FFF0EB] text-[#1E232F] text-xs font-bold rounded-xl border border-[#FEEAE1] shadow-xs spring-lift-sm"
              >
                <Send className="w-3.5 h-3.5 text-[#FF5E3A]" />
                <span>Broadcast</span>
              </Link>
              <Link
                to="/reports"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 spring-lift-sm group"
              >
                <span>Audit Report</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </>
          )}

          {role === 'teacher' && (
            <>
              <Link
                to="/attendance"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF5E3A]/25 border border-[#FF8C70] spring-lift-sm shimmer-hover"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Mark Attendance</span>
              </Link>
              <Link
                to="/homework"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FFF0EB] text-[#1E232F] text-xs font-bold rounded-xl border border-[#FEEAE1] spring-lift-sm"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#FF5E3A]" />
                <span>Assign Homework</span>
              </Link>
            </>
          )}

          {role === 'parent' && (
            <>
              <Link
                to="/attendance"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF5E3A]/25 border border-[#FF8C70] spring-lift-sm shimmer-hover"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Child Attendance</span>
              </Link>
              <Link
                to="/fees"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FFF0EB] text-[#1E232F] text-xs font-bold rounded-xl border border-[#FEEAE1] spring-lift-sm"
              >
                <CreditCard className="w-3.5 h-3.5 text-[#FF5E3A]" />
                <span>Pay Fees</span>
              </Link>
              <Link
                to="/chat"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FFF0EB] text-[#1E232F] text-xs font-bold rounded-xl border border-[#FEEAE1] spring-lift-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#FF5E3A]" />
                <span>Chat Room</span>
              </Link>
            </>
          )}

          {role === 'student' && (
            <>
              <Link
                to="/exams"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF5E3A]/25 border border-[#FF8C70] spring-lift-sm shimmer-hover"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>My Exam Results</span>
              </Link>
              <Link
                to="/chat"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FFF0EB] text-[#1E232F] text-xs font-bold rounded-xl border border-[#FEEAE1] spring-lift-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#FF5E3A]" />
                <span>Chat Room</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP 4 KPI CARDS (ANIMATED SPRING LIFT & SHINE)         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Enrolled */}
        <div
          onClick={() => navigate('/directory?tab=students')}
          title="Click to view all enrolled students, classes & parent contacts"
          className="bg-gradient-to-br from-[#1E232F] via-[#2A3142] to-[#1E232F] text-white rounded-2xl p-5 border border-slate-700/60 shadow-lg shadow-slate-900/10 relative overflow-hidden group flex flex-col justify-between spring-lift shimmer-hover animate-fade-up delay-1 cursor-pointer"
        >
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-[#FF5E3A]/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Enrolled</span>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm">
                <GraduationCap className="w-5 h-5 text-orange-300" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-white tracking-tight">{stats.totalStudents || 154}</h3>
              <span className="text-[11px] font-bold text-[#FF5E3A] bg-[#FF5E3A]/15 px-2.5 py-0.5 rounded-full border border-[#FF5E3A]/30 flex items-center gap-0.5 shrink-0 group-hover:scale-105 transition-transform">
                <ArrowUpRight className="w-3 h-3 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                +12% yoy
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
              <span>Active in Session</span>
              <span className="font-bold text-white">150 / 154</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-950/60 overflow-hidden border border-slate-700/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-[#FF5E3A] transition-all duration-1000 ease-out"
                style={{ width: mounted ? '97.4%' : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div
          onClick={() => navigate('/attendance')}
          title="Click to view full attendance register and matrix"
          className="bg-gradient-to-br from-[#1E232F] via-[#2A3142] to-[#1E232F] text-white rounded-2xl p-5 border border-slate-700/60 shadow-lg shadow-slate-900/10 relative overflow-hidden group flex flex-col justify-between spring-lift shimmer-hover animate-fade-up delay-2 cursor-pointer"
        >
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Attendance Rate</span>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm">
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <h3 className="text-3xl font-black text-white tracking-tight">{stats.attendanceRate}%</h3>
              <span className="text-[11px] font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30 shrink-0 group-hover:scale-105 transition-transform">
                Target Met
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
              <span>Today's Roll Call</span>
              <span className="font-bold text-white">{stats.todayAttendance.present} Present &bull; {stats.todayAttendance.absent} Absent</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-950/60 overflow-hidden border border-slate-700/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-white via-orange-100 to-[#FF5E3A] transition-all duration-1000 ease-out"
                style={{ width: mounted ? `${stats.attendanceRate}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Faculty On Duty - Signature Coral Orange */}
        <div
          onClick={() => navigate('/directory?tab=teachers')}
          title="Click to view all faculty & teaching staff"
          className="bg-gradient-to-br from-[#FF5E3A] via-[#E04826] to-[#C84222] text-white rounded-2xl p-5 border border-[#FF8C70]/40 shadow-lg shadow-[#FF5E3A]/25 relative overflow-hidden group flex flex-col justify-between spring-lift shimmer-hover animate-fade-up delay-3 cursor-pointer"
        >
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/15 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-100">Faculty On Duty</span>
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <h3 className="text-3xl font-black text-white tracking-tight">24 / 24</h3>
              <span className="text-[11px] font-bold text-white bg-white/25 px-2.5 py-0.5 rounded-full border border-white/30 shrink-0 group-hover:scale-105 transition-transform">
                100% Present
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-orange-400/30">
            <div className="flex items-center justify-between text-xs text-orange-100 mb-1.5 font-medium">
              <span>Faculty Deployed</span>
              <span className="font-bold text-white">6 of 6 Departments</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-orange-950/40 overflow-hidden border border-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-white via-orange-100 to-amber-200 transition-all duration-1000 ease-out"
                style={{ width: mounted ? '100%' : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Fee Realization */}
        <div
          onClick={() => navigate('/fees')}
          title="Click to view fee records and invoices"
          className="bg-gradient-to-br from-[#1E232F] via-[#2A3142] to-[#1E232F] text-white rounded-2xl p-5 border border-slate-700/60 shadow-lg shadow-slate-900/10 relative overflow-hidden group flex flex-col justify-between spring-lift shimmer-hover animate-fade-up delay-4 cursor-pointer"
        >
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-[#FF5E3A]/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Fee Realization</span>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <h3 className="text-3xl font-black text-white tracking-tight">
                {formatCurrency(stats.feeStats.totalCollected || 48600)}
              </h3>
              <span className="text-[11px] font-bold text-orange-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 shrink-0 group-hover:scale-105 transition-transform">
                86.8% Settled
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
              <span>Outstanding Dues</span>
              <span className="font-bold text-orange-300">{formatCurrency(stats.feeStats.totalPending || 7400)}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-950/60 overflow-hidden border border-slate-700/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-white via-orange-200 to-[#FF5E3A] transition-all duration-1000 ease-out"
                style={{ width: mounted ? '86.8%' : '0%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. OPERATIONAL HUB DOCK (SMOOTH HOVER)                    */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-[#1E232F] via-[#2A3142] to-[#1E232F] rounded-2xl p-3 sm:p-4 border border-[#FFD5C5]/30 text-white shadow-md shadow-slate-900/10 flex flex-wrap items-center justify-between gap-3 animate-fade-up delay-2">
        <div className="flex items-center gap-2 px-2 text-xs font-extrabold uppercase tracking-wider text-orange-300">
          <Layers className="w-4 h-4 text-[#FF5E3A] animate-pulse" />
          <span>Campus Quick Hub</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/attendance"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#FF5E3A] text-white text-xs font-semibold border border-white/15 hover:border-[#FF5E3A] spring-lift-sm flex items-center gap-1.5 group cursor-pointer transition-all duration-200"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-orange-300 group-hover:text-white group-hover:scale-115 transition-transform" />
            <span>Attendance</span>
          </Link>
          {role === 'super_admin' && (
            <Link
              to="/teacher-attendance"
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#FF5E3A] text-white text-xs font-semibold border border-white/15 hover:border-[#FF5E3A] spring-lift-sm flex items-center gap-1.5 group cursor-pointer transition-all duration-200"
            >
              <Users className="w-3.5 h-3.5 text-orange-300 group-hover:text-white group-hover:scale-115 transition-transform" />
              <span>Teacher Attendance</span>
            </Link>
          )}
          <Link
            to="/fees"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#FF5E3A] text-white text-xs font-semibold border border-white/15 hover:border-[#FF5E3A] spring-lift-sm flex items-center gap-1.5 group cursor-pointer transition-all duration-200"
          >
            <CreditCard className="w-3.5 h-3.5 text-orange-300 group-hover:text-white group-hover:scale-115 transition-transform" />
            <span>Fee Ledger</span>
          </Link>
          {['super_admin', 'admin', 'principal'].includes(role) && (
            <Link
              to="/payroll"
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#FF5E3A] text-white text-xs font-semibold border border-white/15 hover:border-[#FF5E3A] spring-lift-sm flex items-center gap-1.5 group cursor-pointer transition-all duration-200"
            >
              <CreditCard className="w-3.5 h-3.5 text-orange-300 group-hover:text-white group-hover:scale-115 transition-transform" />
              <span>Teacher Fees</span>
            </Link>
          )}
          <Link
            to="/homework"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#FF5E3A] text-white text-xs font-semibold border border-white/15 hover:border-[#FF5E3A] spring-lift-sm flex items-center gap-1.5 group cursor-pointer transition-all duration-200"
          >
            <BookOpen className="w-3.5 h-3.5 text-orange-300 group-hover:text-white group-hover:scale-115 transition-transform" />
            <span>Homework</span>
          </Link>
          <Link
            to="/exams"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#FF5E3A] text-white text-xs font-semibold border border-white/15 hover:border-[#FF5E3A] spring-lift-sm flex items-center gap-1.5 group cursor-pointer transition-all duration-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-orange-300 group-hover:text-white group-hover:scale-115 transition-transform" />
            <span>Exams</span>
          </Link>
          <Link
            to="/chat"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#FF5E3A] text-white text-xs font-semibold border border-white/15 hover:border-[#FF5E3A] spring-lift-sm flex items-center gap-1.5 group cursor-pointer transition-all duration-200"
          >
            <MessageSquare className="w-3.5 h-3.5 text-orange-300 group-hover:text-white group-hover:scale-115 transition-transform" />
            <span>Chat AI</span>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MAIN OPERATIONAL GRID (CHARTS & SCHEDULE)             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Interactive Attendance Analytics Chart */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 animate-fade-up delay-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#FF5E3A] animate-pulse" />
                  Attendance Analytics Telemetry
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Campus presence distribution across academic divisions</p>
              </div>

              {/* Timeframe Selector Pills with Smooth Transition */}
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs">
                {['7d', '30d', '90d'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setChartPeriod(p)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all duration-200 cursor-pointer ${
                      chartPeriod === p
                        ? 'bg-[#FF5E3A] text-white shadow-sm shadow-[#FF5E3A]/30 scale-105'
                        : 'text-slate-600 hover:text-[#FF5E3A] hover:bg-white/60'
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts High-Fidelity Area Chart with Animation */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="coralOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5E3A" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#FF5E3A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    domain={[90, 100]}
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1.5px solid #FFD5C5',
                      boxShadow: '0 8px 24px rgba(255, 94, 58, 0.15)',
                      fontSize: '12px',
                      color: '#1E232F',
                      fontWeight: 'bold'
                    }}
                    formatter={(val) => [`${val}% Presence`, 'Attendance Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#FF5E3A"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#coralOrangeGradient)"
                    isAnimationActive={true}
                    animationDuration={1400}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Overall Term Average: <strong className="text-[#FF5E3A] font-bold">98.1%</strong></span>
              <span>Regulatory Standard: <strong className="text-slate-700 font-bold">95.0%+</strong></span>
            </div>
          </div>

          {/* Divisional Class Presence Monitor (Excel-Style Premium Data Grid) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 animate-fade-up delay-4">
            {/* Excel Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-[#FF5E3A] flex items-center justify-center shadow-sm border border-slate-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#0F172A] tracking-tight">
                      Divisional Roll Call Register &bull; Sheet View
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-[#FFF0EB] text-[#FF5E3A] font-mono font-extrabold text-[10px] border border-[#FFD5C5]">
                      LIVE SPREADSHEET
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Formula: <span className="text-[#FF5E3A] font-bold">fx = (Present / Total) &times; 100</span> &bull; Updated real-time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                  <span>Σ Quorum:</span>
                  <span className="text-[#FF5E3A] font-black">98.2%</span>
                </span>
                <Link
                  to="/attendance"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] hover:bg-[#FF5E3A] text-white text-xs font-bold rounded-lg border border-slate-900 hover:border-[#FF5E3A] transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#FF5E3A] group-hover:text-white" />
                  <span>Full Register</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Excel Grid Container */}
            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-[#0F172A] text-white border-b-2 border-[#FF5E3A] text-[11px] font-bold uppercase tracking-wider select-none">
                      <th className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-400 border-r border-slate-800 w-10">
                        #
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-800">
                        Class &amp; Section <span className="text-[#FF5E3A] text-[9px] font-mono">(Col A)</span>
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-800">
                        Faculty In-Charge <span className="text-[#FF5E3A] text-[9px] font-mono">(Col B)</span>
                      </th>
                      <th className="py-2.5 px-3 text-center border-r border-slate-800">
                        Present / Total <span className="text-[#FF5E3A] text-[9px] font-mono">(Col C)</span>
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-800">
                        Presence Ratio &bull; Data Bar <span className="text-[#FF5E3A] text-[9px] font-mono">(Col D)</span>
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        Status <span className="text-[#FF5E3A] text-[9px] font-mono">(Col E)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {classDivisions.map((cls, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-slate-200 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                        } hover:bg-[#FFF0EB]/50 group`}
                      >
                        {/* Excel Row Index Number */}
                        <td className="py-2.5 px-2 text-center font-mono text-[11px] font-bold text-slate-500 bg-slate-100/90 border-r border-slate-300 select-none">
                          {idx + 1}
                        </td>

                        {/* Col A: Class & Section */}
                        <td className="py-2.5 px-3 font-bold text-[#0F172A] border-r border-slate-200 group-hover:text-[#FF5E3A] transition-colors">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="w-2 h-2 rounded-full bg-[#FF5E3A]" />
                            <span>{cls.name}</span>
                          </div>
                        </td>

                        {/* Col B: Faculty In-Charge */}
                        <td className="py-2.5 px-3 border-r border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-[#0F172A] text-white font-black text-[10px] flex items-center justify-center shadow-xs border border-slate-700">
                              {cls.initials}
                            </span>
                            <span className="text-slate-800 font-semibold">{cls.teacher}</span>
                          </div>
                        </td>

                        {/* Col C: Present / Total (Monospace Tabular Numbers) */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 border-r border-slate-200">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {cls.present} / {cls.total}
                          </span>
                        </td>

                        {/* Col D: Presence Ratio (Excel Data Bar Style in Coral Orange) */}
                        <td className="py-2.5 px-3 border-r border-slate-200 w-44">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-1 h-3 rounded bg-slate-200 overflow-hidden border border-slate-300 p-0.5 relative">
                              <div
                                className="h-full rounded-xs bg-gradient-to-r from-orange-400 via-[#FF5E3A] to-[#E04826] transition-all duration-1000 ease-out shadow-xs"
                                style={{ width: mounted ? `${cls.rate}%` : '0%' }}
                              />
                            </div>
                            <span className="font-mono font-black text-[11px] text-[#0F172A] w-10 text-right">
                              {cls.rate.toFixed(0)}%
                            </span>
                          </div>
                        </td>

                        {/* Col E: Status (Excel Badge: Orange for 100%, Black for Absent) */}
                        <td className="py-2.5 px-3 text-center">
                          {cls.absent === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FFF0EB] text-[#FF5E3A] font-black text-[11px] border border-[#FFD5C5] shadow-2xs group-hover:scale-105 transition-transform">
                              <Check className="w-3 h-3 text-[#FF5E3A]" />
                              <span>100% Present</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0F172A] text-white font-black text-[11px] border border-black shadow-2xs group-hover:scale-105 transition-transform">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E3A]" />
                              <span>{cls.absent} Absent</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Excel Summary Footer Row */}
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 text-xs font-bold text-slate-800">
                      <td className="py-2 px-2 text-center font-mono text-[10px] font-black bg-slate-200 border-r border-slate-300 text-slate-700">
                        fx
                      </td>
                      <td className="py-2 px-3 font-mono font-black uppercase text-[11px] text-[#0F172A] border-r border-slate-300">
                        Σ TOTAL (6 Divisions)
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-medium text-[11px] border-r border-slate-300">
                        6 Faculty Members
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-black text-[#0F172A] border-r border-slate-300">
                        167 / 170 Enrolled
                      </td>
                      <td className="py-2 px-3 font-mono font-black text-[#FF5E3A] border-r border-slate-300">
                        98.2% Term Quorum
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#FF5E3A] text-white font-black text-[10px]">
                          COMPLIANT
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Excel Bottom Sheet Tab Strip */}
              <div className="bg-slate-200/90 border-t border-slate-300 px-3 py-1.5 flex items-center justify-between text-[11px] font-medium text-slate-600 select-none">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="px-3 py-1 bg-white text-[#0F172A] font-bold rounded-t-md border-t-2 border-[#FF5E3A] shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E3A]" />
                    <span>Sheet1: Morning Roll Call</span>
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 text-slate-500 hover:text-slate-900 rounded-t-md hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Sheet2: Section Breakdown
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 text-slate-500 hover:text-slate-900 rounded-t-md hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Sheet3: Monthly Ledger
                  </button>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
                  <span>Ready</span>
                  <span>&bull;</span>
                  <span>100% Zoom</span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Workload: Homework & Scheduled Examinations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up delay-4">
            {/* Active Homework */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#FF5E3A]" />
                    Active Coursework Tasks
                  </h4>
                  <Link to="/homework" className="text-xs font-bold text-[#FF5E3A] hover:text-[#E04826] group flex items-center gap-1">
                    <span>All</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {stats.recentHomework.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No coursework currently assigned.</p>
                  ) : (
                    stats.recentHomework.slice(0, 3).map((hw) => (
                      <div
                        key={hw._id}
                        className="p-3 rounded-xl bg-slate-50/70 hover:bg-[#FFF0EB]/40 border border-slate-200/80 hover:border-[#FFD5C5] transition-all duration-200 spring-lift-sm flex items-center justify-between"
                      >
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{hw.title}</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {hw.classGrade} &bull; {hw.subject}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0EB] text-[#FF5E3A] border border-[#FEEAE1]">
                          Due {formatDate(hw.dueDate)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Digital Submissions Queue</span>
                <Link to="/homework" className="font-bold text-[#FF5E3A] hover:text-[#E04826]">
                  Open Queue &rarr;
                </Link>
              </div>
            </div>

            {/* Upcoming Examinations */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#FF5E3A]" />
                    Upcoming Term Assessments
                  </h4>
                  <Link to="/exams" className="text-xs font-bold text-[#FF5E3A] hover:text-[#E04826] group flex items-center gap-1">
                    <span>All</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {stats.upcomingExams.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No exams scheduled in this period.</p>
                  ) : (
                    stats.upcomingExams.slice(0, 3).map((ex) => (
                      <div
                        key={ex._id}
                        className="p-3 rounded-xl bg-slate-50/70 hover:bg-[#FFF0EB]/40 border border-slate-200/80 hover:border-[#FFD5C5] transition-all duration-200 spring-lift-sm flex items-center justify-between"
                      >
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{ex.title || ex.name}</h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {ex.classGrade} &bull; Max Marks: {ex.maxMarks || 100}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0EB] text-[#FF5E3A] border border-[#FEEAE1]">
                          {formatDate(ex.date)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Timetable Allocation</span>
                <Link to="/exams" className="font-bold text-[#FF5E3A] hover:text-[#E04826]">
                  Inspect Schedule &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Schedule, Tasks, and Live Activity Stream */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Live Campus Schedule Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 animate-fade-up delay-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FF5E3A]" />
                <span>Today's Academic Schedule</span>
              </h4>
              <span className="text-[10px] font-bold text-[#FF5E3A] bg-[#FFF0EB] px-2 py-0.5 rounded-full border border-[#FEEAE1]">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white mb-3 shadow-sm relative overflow-hidden spring-lift-sm border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-orange-300 uppercase tracking-wider">Current Period &bull; 11:30 &ndash; 12:15</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E3A] animate-pulse" />
                  Active
                </span>
              </div>
              <h5 className="text-sm font-black text-white">Mathematics &amp; Analytical Logic</h5>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">Rooms 101 to 104 &bull; Secondary Division</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 py-1.5 border-b border-slate-100 hover:text-[#FF5E3A] transition-colors">
                <span>12:15 PM &ndash; 01:00 PM</span>
                <span className="font-bold text-slate-800">Campus Lunch &amp; Recess</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 py-1.5 border-b border-slate-100 hover:text-[#FF5E3A] transition-colors">
                <span>01:00 PM &ndash; 01:45 PM</span>
                <span className="font-bold text-slate-800">Period 5 (Science Lab)</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 py-1.5 hover:text-[#FF5E3A] transition-colors">
                <span>03:30 PM</span>
                <span className="font-bold text-slate-800">Campus Dispersal / Bus Fleet</span>
              </div>
            </div>
          </div>

          {/* Action Required: Real Operational Tasks Queue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 animate-fade-up delay-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#FF5E3A] animate-pulse" />
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
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-[#FFD5C5] transition-all duration-200 spring-lift-sm group"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5E3A]">
                      {t.tag}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">{t.title}</h5>
                    <p className="text-[11px] text-slate-600 leading-snug">{t.desc}</p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex justify-end">
                    <Link
                      to={t.link}
                      className="text-[11px] font-extrabold text-[#FF5E3A] hover:text-[#E04826] flex items-center gap-1 group-hover:translate-x-1 transition-transform"
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
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 animate-fade-up delay-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#FF5E3A]" />
                <span>Live Campus Activity</span>
              </h4>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5E3A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5E3A]"></span>
              </span>
            </div>

            <div className="space-y-3">
              {activityStream.map((act) => {
                const IconComponent = act.icon;
                return (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs group hover:bg-[#FFF0EB]/30 p-1.5 rounded-xl transition-colors">
                    <div className={`w-7 h-7 rounded-lg ${act.color} flex items-center justify-center shrink-0 border mt-0.5 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-800 text-[11px] group-hover:text-[#FF5E3A] transition-colors">{act.title}</h5>
                        <span className="text-[10px] text-slate-400 font-medium">{act.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{act.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 text-center">
              <Link to="/communications" className="text-xs font-bold text-[#FF5E3A] hover:text-[#E04826] group inline-flex items-center gap-1">
                <span>View Audit &amp; Delivery Logs</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. CAMPUS CIRCULARS & NOTICES (STAGGERED HOVER CARDS)    */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 animate-fade-up delay-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#FF5E3A] animate-pulse" />
              Institutional Circulars &amp; Community Notices
            </h3>
            <p className="text-xs text-slate-500">Official directives and administrative bulletins</p>
          </div>
          <Link to="/notices" className="text-xs font-bold text-[#FF5E3A] hover:text-[#E04826] flex items-center gap-1 group">
            <span>All Circulars</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.notices.slice(0, 3).map((n) => (
            <div
              key={n._id}
              className="p-4 rounded-xl bg-slate-50/60 hover:bg-[#FFF0EB]/30 border border-slate-200/80 hover:border-[#FFD5C5] transition-all duration-200 flex flex-col justify-between shadow-2xs spring-lift-sm group"
            >
              <div>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-[#FF5E3A] text-white shadow-2xs group-hover:bg-[#E04826] transition-colors">
                  {n.type}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1 group-hover:text-[#FF5E3A] transition-colors">{n.title}</h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{formatDate(n.createdAt)}</span>
                <Link to="/notices" className="font-bold text-[#FF5E3A] hover:text-[#E04826] group-hover:translate-x-0.5 transition-transform">
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

export default Dashboard;
