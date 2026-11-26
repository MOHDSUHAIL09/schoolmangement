import React, { useState, useEffect } from 'react';
import { teacherAttendanceAPI, userAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Loader } from '../components/Loader.jsx';
import { formatDate } from '../utils/formatters.js';
import { exportToExcel } from '../utils/exportExcel.js';
import {
  UserCheck,
  CalendarCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  CheckCheck,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  Search,
  Filter,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  BadgePercent,
  Check
} from 'lucide-react';

export const TeacherAttendance = () => {
  const { role } = useAuth();
  const { showToast } = useSchool();

  // Tabs: 'daily' | 'weekly' | 'monthly' | 'individual'
  const [activeTab, setActiveTab] = useState('daily');

  // Filters
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Teachers & Daily Attendance State
  const [teachers, setTeachers] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [checkInTimes, setCheckInTimes] = useState({});
  const [checkOutTimes, setCheckOutTimes] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Monthly Register State
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // Individual Separate Teacher Attendance Table State
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherHistory, setTeacherHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  useEffect(() => {
    fetchTeachersList();
  }, []);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyAttendance();
    } else if (activeTab === 'monthly' || activeTab === 'weekly') {
      fetchMonthlyData();
    } else if (activeTab === 'individual' && selectedTeacherId) {
      fetchIndividualHistory(selectedTeacherId);
    }
  }, [date, selectedMonth, selectedYear, activeTab, selectedTeacherId]);

  const fetchTeachersList = async () => {
    try {
      const res = await userAPI.getTeachers();
      if (res.success && Array.isArray(res.data)) {
        setTeachers(res.data);
        if (res.data.length > 0 && !selectedTeacherId) {
          setSelectedTeacherId(res.data[0]._id);
        }
      }
    } catch (err) {
      console.warn('Error fetching teachers list:', err);
    }
  };

  // 1. Fetch Daily Faculty Attendance
  const fetchDailyAttendance = async () => {
    setLoading(true);
    try {
      const res = await teacherAttendanceAPI.getDaily({ date });
      if (res.success) {
        setDailyData(res.data || []);
        const att = {};
        const inTimes = {};
        const outTimes = {};
        const rem = {};

        (res.data || []).forEach((item) => {
          const tId = item.teacher._id;
          att[tId] = item.status || 'Present';
          inTimes[tId] = item.checkInTime || '08:00 AM';
          outTimes[tId] = item.checkOutTime || '03:30 PM';
          rem[tId] = item.remarks || '';
        });

        setAttendanceRecords(att);
        setCheckInTimes(inTimes);
        setCheckOutTimes(outTimes);
        setRemarks(rem);
      }
    } catch (err) {
      showToast(err.message || 'Error fetching teacher attendance', 'error', 'Attendance Error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Monthly & Weekly Matrix Data
  const fetchMonthlyData = async () => {
    setLoadingMonthly(true);
    try {
      const res = await teacherAttendanceAPI.getMonthly({
        month: selectedMonth,
        year: selectedYear
      });
      if (res.success) {
        setMonthlyData(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Error fetching monthly data', 'error', 'Monthly Register Error');
    } finally {
      setLoadingMonthly(false);
    }
  };

  // 3. Fetch Individual Teacher's Separate Attendance Table
  const fetchIndividualHistory = async (tId) => {
    setLoadingHistory(true);
    try {
      const res = await teacherAttendanceAPI.getTeacherHistory(tId, {
        month: selectedMonth,
        year: selectedYear
      });
      if (res.success) {
        setTeacherHistory(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Error fetching teacher history', 'error', 'Individual History Error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStatusChange = (tId, status) => {
    setAttendanceRecords((prev) => ({ ...prev, [tId]: status }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    dailyData.forEach((item) => {
      updated[item.teacher._id] = status;
    });
    setAttendanceRecords(updated);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const records = dailyData.map((item) => ({
        teacherId: item.teacher._id,
        status: attendanceRecords[item.teacher._id] || 'Present',
        checkInTime: checkInTimes[item.teacher._id] || '08:00 AM',
        checkOutTime: checkOutTimes[item.teacher._id] || '03:30 PM',
        remarks: remarks[item.teacher._id] || ''
      }));

      const res = await teacherAttendanceAPI.saveDaily({
        date,
        records
      });

      if (res.success) {
        showToast(`Teacher attendance saved for ${records.length} faculty members.`, 'success', 'Attendance Recorded');
        fetchDailyAttendance();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save attendance', 'error', 'Saving Failed');
    } finally {
      setSaving(false);
    }
  };

  // Daily statistics
  const totalFaculty = dailyData.length;
  const presentCount = dailyData.filter((i) => (attendanceRecords[i.teacher._id] || 'Present') === 'Present').length;
  const lateCount = dailyData.filter((i) => attendanceRecords[i.teacher._id] === 'Late').length;
  const absentCount = dailyData.filter((i) => attendanceRecords[i.teacher._id] === 'Absent').length;
  const leaveCount = dailyData.filter((i) => ['Half Day', 'On Leave'].includes(attendanceRecords[i.teacher._id])).length;
  const dailyRate = totalFaculty > 0 ? Math.round(((presentCount + lateCount * 0.8) / totalFaculty) * 100) : 100;

  // Export Individual Teacher Attendance
  const handleExportIndividual = () => {
    if (!teacherHistory || !teacherHistory.dailyRecords) return;
    const exportable = teacherHistory.dailyRecords.map((r) => ({
      'Date': r.date,
      'Day': r.dayName,
      'Status': r.status,
      'Check In': r.checkInTime,
      'Check Out': r.checkOutTime,
      'Remarks': r.remarks
    }));
    exportToExcel(exportable, `${teacherHistory.teacher.name.replace(/\\s+/g, '_')}_Attendance_${selectedMonth}_${selectedYear}`);
  };

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.email.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]">
              Super Admin Exclusive
            </span>
            <span className="text-xs text-slate-500 font-semibold">&bull; Faculty Telemetry &bull; Excel Grid</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-[#FF5E3A]" />
            <span>Teacher Attendance Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Super Admin faculty roll call, individual attendance records, daily/weekly/monthly breakdown &amp; automated monthly calculations.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'individual' && teacherHistory && (
            <button
              onClick={handleExportIndividual}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FFF0EB] text-[#0F172A] text-xs font-bold rounded-xl border border-slate-200 hover:border-[#FFD5C5] shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#FF5E3A]" />
              <span>Export Table (.XLSX)</span>
            </button>
          )}
          {activeTab === 'daily' && (
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white font-bold text-xs rounded-xl shadow-md shadow-[#FF5E3A]/25 border border-[#FF8C70] transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top KPI Metric Cards (Coral Orange & Modern Black Palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Faculty */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-2xl p-5 border border-slate-700/60 shadow-lg shadow-slate-900/10 relative overflow-hidden flex flex-col justify-between spring-lift">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Faculty</span>
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-white">{totalFaculty}</h3>
            <span className="text-[11px] font-bold text-orange-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              100% Onboarded
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
            Active instructional staff members
          </div>
        </div>

        {/* Card 2: Daily Attendance Rate */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-2xl p-5 border border-slate-700/60 shadow-lg shadow-slate-900/10 relative overflow-hidden flex flex-col justify-between spring-lift">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Daily Attendance Rate</span>
            <CalendarCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-white">{dailyRate}%</h3>
            <span className="text-[11px] font-bold text-white bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30">
              {dailyRate >= 95 ? 'Target Met' : 'Attention'}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
            {presentCount} Present &bull; {absentCount} Absent
          </div>
        </div>

        {/* Card 3: Present Today - Signature Coral Orange */}
        <div className="bg-gradient-to-br from-[#FF5E3A] via-[#E04826] to-[#C84222] text-white rounded-2xl p-5 border border-[#FF8C70]/40 shadow-lg shadow-[#FF5E3A]/25 relative overflow-hidden flex flex-col justify-between spring-lift">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100">Present Today</span>
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-white">{presentCount}</h3>
            <span className="text-[11px] font-bold text-white bg-white/25 px-2.5 py-0.5 rounded-full border border-white/30">
              In Campus
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-orange-400/30 text-xs text-orange-100">
            {lateCount} Late Arrivals recorded
          </div>
        </div>

        {/* Card 4: Leaves & Half Days */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-2xl p-5 border border-slate-700/60 shadow-lg shadow-slate-900/10 relative overflow-hidden flex flex-col justify-between spring-lift">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Leaves &amp; Half Days</span>
            <Clock className="w-5 h-5 text-orange-300" />
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-white">{leaveCount}</h3>
            <span className="text-[11px] font-bold text-orange-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
              Approved
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
            {absentCount} Unexcused Absences
          </div>
        </div>
      </div>

      {/* 3. Navigation View Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'daily'
                ? 'bg-[#FF5E3A] text-white shadow-md shadow-[#FF5E3A]/25'
                : 'text-slate-700 hover:text-black hover:bg-white/80'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Roll Call</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'weekly'
                ? 'bg-[#FF5E3A] text-white shadow-md shadow-[#FF5E3A]/25'
                : 'text-slate-700 hover:text-black hover:bg-white/80'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Weekly Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'monthly'
                ? 'bg-[#FF5E3A] text-white shadow-md shadow-[#FF5E3A]/25'
                : 'text-slate-700 hover:text-black hover:bg-white/80'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Monthly Register</span>
          </button>

          <button
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'individual'
                ? 'bg-[#FF5E3A] text-white shadow-md shadow-[#FF5E3A]/25'
                : 'text-slate-700 hover:text-black hover:bg-white/80'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Separate Teacher Table</span>
          </button>
        </div>

        {/* Date / Month / Year Selectors */}
        <div className="flex flex-wrap items-center gap-2 px-2">
          {activeTab === 'daily' ? (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:outline-none focus:border-[#FF5E3A]"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:outline-none focus:border-[#FF5E3A]"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:outline-none focus:border-[#FF5E3A]"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DAILY ROLL CALL (EXCEL-STYLE ORANGE & BLACK GRID) */}
      {/* ========================================================= */}
      {activeTab === 'daily' && (() => {
        const filteredDailyData = dailyData.filter((item) => {
          if (!teacherSearch.trim()) return true;
          const term = teacherSearch.toLowerCase();
          const name = item.teacher?.name?.toLowerCase() || '';
          const email = item.teacher?.email?.toLowerCase() || '';
          const phone = item.teacher?.phone?.toLowerCase() || '';
          const id = item.teacher?._id?.toLowerCase() || '';
          return name.includes(term) || email.includes(term) || phone.includes(term) || id.includes(term);
        });

        return (
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
            {/* Excel Toolbar with Teacher Search */}
            <div className="p-4 bg-slate-50 border-b border-slate-300 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#FF5E3A]" />
                  <span>Quick Roll Call:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Present')}
                  className="px-3 py-1.5 rounded-lg bg-[#FF5E3A] hover:bg-[#E04826] text-white text-xs font-black border border-[#E04826] shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>All Present</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Absent')}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-black text-white text-xs font-black border border-black shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5 text-[#FF5E3A]" />
                  <span>All Absent</span>
                </button>

                {/* Faculty Search Bar */}
                <div className="relative min-w-[220px] max-w-xs ml-0 sm:ml-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Search teacher by name or email..."
                    className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A] shadow-xs"
                  />
                  {teacherSearch && (
                    <button
                      type="button"
                      onClick={() => setTeacherSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      title="Clear search"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  Showing: <strong className="text-[#0F172A]">{filteredDailyData.length}</strong> / {dailyData.length}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FFF0EB] text-[#FF5E3A] font-bold border border-[#FFD5C5]">
                  {presentCount} Present
                </span>
                <span className="px-2 py-0.5 rounded bg-[#0F172A] text-white font-bold border border-black">
                  {absentCount} Absent
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading daily Excel attendance records...</div>
            ) : filteredDailyData.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF0EB] border border-[#FFD5C5] text-[#FF5E3A] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-[#0F172A]">No Faculty Found</h4>
                <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                  No teacher matching "{teacherSearch}" was found in the register.
                </p>
                <button
                  type="button"
                  onClick={() => setTeacherSearch('')}
                  className="mt-3 px-3.5 py-1.5 bg-[#0F172A] hover:bg-[#FF5E3A] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-[#0F172A] text-white border-b-2 border-[#FF5E3A] text-[11px] font-bold uppercase tracking-wider select-none">
                      <th className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-400 border-r border-slate-800 w-10">
                        #
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-800">
                        Faculty Member <span className="text-[#FF5E3A] text-[9px] font-mono">(Col A)</span>
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-800">
                        Email &amp; Phone <span className="text-[#FF5E3A] text-[9px] font-mono">(Col B)</span>
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-800 text-center">
                        Attendance Status &bull; Excel Toggle <span className="text-[#FF5E3A] text-[9px] font-mono">(Col C)</span>
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-800">
                        Check-In <span className="text-[#FF5E3A] text-[9px] font-mono">(Col D)</span>
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-800">
                        Check-Out <span className="text-[#FF5E3A] text-[9px] font-mono">(Col E)</span>
                      </th>
                      <th className="py-2.5 px-4 border-r border-slate-800">
                        Remarks <span className="text-[#FF5E3A] text-[9px] font-mono">(Col F)</span>
                      </th>
                      <th className="py-2.5 px-4 text-center">
                        Ledger
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {filteredDailyData.map((item, idx) => {
                    const t = item.teacher;
                    const status = attendanceRecords[t._id] || 'Present';
                    return (
                      <tr
                        key={t._id}
                        className={`border-b border-slate-200 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                        } hover:bg-[#FFF0EB]/40 group`}
                      >
                        {/* Excel Row Index */}
                        <td className="py-3 px-2 text-center font-mono text-[11px] font-bold text-slate-500 bg-slate-100/90 border-r border-slate-300 select-none">
                          {idx + 1}
                        </td>

                        {/* Col A: Faculty Member */}
                        <td className="py-3 px-4 border-r border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#0F172A] text-white font-black flex items-center justify-center text-xs shadow-xs border border-slate-700">
                              {t.name?.[0] || 'T'}
                            </div>
                            <div>
                              <div className="font-bold text-[#0F172A] group-hover:text-[#FF5E3A] transition-colors">{t.name}</div>
                              <div className="text-[11px] font-mono text-slate-400">ID: FAC-{t._id.slice(-4).toUpperCase()}</div>
                            </div>
                          </div>
                        </td>

                        {/* Col B: Email & Phone */}
                        <td className="py-3 px-4 text-slate-600 border-r border-slate-200 font-mono text-[11px]">
                          <div>{t.email}</div>
                          <div className="text-[10px] text-slate-400">{t.phone || 'N/A'}</div>
                        </td>

                        {/* Col C: Attendance Status (Excel-Style Orange & Black Toggle Buttons) */}
                        <td className="py-3 px-4 border-r border-slate-200">
                          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-300 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(t._id, 'Present')}
                              className={`px-3 py-1 rounded text-xs font-black transition cursor-pointer border ${
                                status === 'Present'
                                  ? 'bg-[#FF5E3A] text-white border-[#E04826] shadow-xs scale-105'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-[#FFF0EB] hover:text-[#FF5E3A]'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(t._id, 'Absent')}
                              className={`px-3 py-1 rounded text-xs font-black transition cursor-pointer border ${
                                status === 'Absent'
                                  ? 'bg-[#0F172A] text-white border-black shadow-xs scale-105'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200 hover:text-black'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(t._id, 'Late')}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                                status === 'Late'
                                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-amber-50'
                              }`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(t._id, 'Half Day')}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                                status === 'Half Day'
                                  ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-orange-50'
                              }`}
                            >
                              Half Day
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(t._id, 'On Leave')}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                                status === 'On Leave'
                                  ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              Leave
                            </button>
                          </div>
                        </td>

                        {/* Col D: Check-In */}
                        <td className="py-3 px-4 border-r border-slate-200">
                          <input
                            type="text"
                            value={checkInTimes[t._id] || '08:00 AM'}
                            onChange={(e) => setCheckInTimes({ ...checkInTimes, [t._id]: e.target.value })}
                            className="w-24 px-2.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-[#0F172A] focus:outline-none focus:border-[#FF5E3A]"
                          />
                        </td>

                        {/* Col E: Check-Out */}
                        <td className="py-3 px-4 border-r border-slate-200">
                          <input
                            type="text"
                            value={checkOutTimes[t._id] || '03:30 PM'}
                            onChange={(e) => setCheckOutTimes({ ...checkOutTimes, [t._id]: e.target.value })}
                            className="w-24 px-2.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-[#0F172A] focus:outline-none focus:border-[#FF5E3A]"
                          />
                        </td>

                        {/* Col F: Remarks */}
                        <td className="py-3 px-4 border-r border-slate-200">
                          <input
                            type="text"
                            value={remarks[t._id] || ''}
                            onChange={(e) => setRemarks({ ...remarks, [t._id]: e.target.value })}
                            placeholder="Optional remark..."
                            className="w-36 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#FF5E3A]"
                          />
                        </td>

                        {/* Col G: Ledger */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeacherId(t._id);
                              setActiveTab('individual');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#0F172A] text-slate-700 hover:text-[#FF5E3A] border border-slate-300 transition-colors cursor-pointer"
                            title="View Individual Separate Table"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ); })()}

      {/* ========================================================= */}
      {/* TAB 2: WEEKLY BREAKDOWN (EXCEL-STYLE SPREADSHEET)         */}
      {/* ========================================================= */}
      {activeTab === 'weekly' && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF5E3A]" />
                <span>Weekly Faculty Attendance Tracking &bull; {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregated 4-week performance cycles for each faculty teacher in spreadsheet format.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#FFF0EB] text-[#FF5E3A] font-mono font-bold text-xs border border-[#FFD5C5]">
              WEEKLY MATRIX
            </span>
          </div>

          {loadingMonthly ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading weekly telemetry...</div>
          ) : (
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-[#0F172A] text-white border-b-2 border-[#FF5E3A] text-[11px] font-bold uppercase tracking-wider select-none">
                      <th className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-400 border-r border-slate-800 w-10">#</th>
                      <th className="py-2.5 px-4 border-r border-slate-800">Teacher (Col A)</th>
                      <th className="py-2.5 px-4 border-r border-slate-800">Week 1 (Days 1–7)</th>
                      <th className="py-2.5 px-4 border-r border-slate-800">Week 2 (Days 8–14)</th>
                      <th className="py-2.5 px-4 border-r border-slate-800">Week 3 (Days 15–21)</th>
                      <th className="py-2.5 px-4 border-r border-slate-800">Week 4 (Days 22–28)</th>
                      <th className="py-2.5 px-4 text-right">Monthly Avg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(monthlyData || []).map((row, idx) => (
                      <tr key={row.teacher._id} className="hover:bg-[#FFF0EB]/30 transition group">
                        <td className="py-3 px-2 text-center font-mono text-[11px] font-bold text-slate-500 bg-slate-100/90 border-r border-slate-300 select-none">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#0F172A] border-r border-slate-200 group-hover:text-[#FF5E3A] transition-colors">
                          {row.teacher.name}
                        </td>
                        <td className="py-3 px-4 border-r border-slate-200">
                          <span className="px-2.5 py-1 rounded-md bg-[#FFF0EB] text-[#FF5E3A] font-black border border-[#FFD5C5] font-mono">
                            {Math.min(6, row.present >= 6 ? 6 : row.present)} / 6 Days
                          </span>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-200">
                          <span className="px-2.5 py-1 rounded-md bg-[#FFF0EB] text-[#FF5E3A] font-black border border-[#FFD5C5] font-mono">
                            {Math.min(6, row.present >= 12 ? 6 : Math.max(0, row.present - 6))} / 6 Days
                          </span>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-200">
                          <span className="px-2.5 py-1 rounded-md bg-[#FFF0EB] text-[#FF5E3A] font-black border border-[#FFD5C5] font-mono">
                            {Math.min(6, row.present >= 18 ? 6 : Math.max(0, row.present - 12))} / 6 Days
                          </span>
                        </td>
                        <td className="py-3 px-4 border-r border-slate-200">
                          <span className="px-2.5 py-1 rounded-md bg-[#FFF0EB] text-[#FF5E3A] font-black border border-[#FFD5C5] font-mono">
                            {Math.min(6, row.present >= 24 ? 6 : Math.max(0, row.present - 18))} / 6 Days
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#0F172A] text-white border border-black font-mono font-black">
                            {row.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ========================================================= */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#FF5E3A]" />
                <span>Monthly Master Faculty Register &bull; {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full 30-day attendance spreadsheet matrix with automated monthly calculations.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]">
                <span className="w-2 h-2 rounded-full bg-[#FF5E3A]" /> P: Present (Orange)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0F172A] text-white border border-black">
                <span className="w-2 h-2 rounded-full bg-white" /> A: Absent (Black)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> L: Late
              </span>
            </div>
          </div>

          {loadingMonthly ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading monthly register matrix...</div>
          ) : (
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-[#0F172A] text-white border-b-2 border-[#FF5E3A] text-[10px] font-extrabold uppercase select-none">
                      <th className="py-2.5 px-3 sticky left-0 bg-[#0F172A] z-10 min-w-[140px] border-r border-slate-800">
                        Teacher
                      </th>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                        <th key={d} className="py-2.5 px-1.5 text-center min-w-[28px] border-r border-slate-800 font-mono">
                          {d}
                        </th>
                      ))}
                      <th className="py-2.5 px-2 text-center bg-slate-800 text-white font-bold min-w-[45px] border-r border-slate-700 font-mono">
                        Total
                      </th>
                      <th className="py-2.5 px-2 text-center bg-[#FF5E3A] text-white font-black min-w-[45px] font-mono">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(monthlyData || []).map((row) => (
                      <tr key={row.teacher._id} className="hover:bg-[#FFF0EB]/20">
                        <td className="py-2.5 px-3 font-bold text-[#0F172A] sticky left-0 bg-white hover:bg-slate-50 shadow-xs border-r border-slate-200">
                          {row.teacher.name}
                        </td>
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                          const st = row.days[d] || 'Present';
                          const isSun = new Date(selectedYear, selectedMonth - 1, d).getDay() === 0;
                          return (
                            <td key={d} className="py-2 px-1 text-center font-mono text-[11px] border-r border-slate-100">
                              {isSun ? (
                                <span className="text-slate-300 select-none">-</span>
                              ) : st === 'Present' ? (
                                <span className="text-[#FF5E3A] font-black bg-[#FFF0EB] border border-[#FFD5C5] px-1 py-0.5 rounded text-[10px]">P</span>
                              ) : st === 'Absent' ? (
                                <span className="text-white font-black bg-[#0F172A] border border-black px-1 py-0.5 rounded text-[10px]">A</span>
                              ) : (
                                <span className="text-amber-800 font-bold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded text-[10px]">L</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-center bg-slate-100 font-bold text-[#0F172A] font-mono border-r border-slate-200">
                          {row.present}
                        </td>
                        <td className="py-2 px-2 text-center bg-[#FFF0EB] font-black text-[#FF5E3A] font-mono">
                          {row.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ========================================================= */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          {/* Teacher Selector Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                Select Faculty Teacher:
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 focus:border-[#FF5E3A]"
              >
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Period:</span>
              <span className="px-3 py-1 rounded-xl bg-[#FFF0EB] border border-[#FFD5C5] text-xs font-bold text-[#FF5E3A]">
                {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
              </span>
            </div>
          </div>

          {loadingHistory || !teacherHistory ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-300 font-mono text-xs">
              Loading individual separate teacher attendance table...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Teacher Identity & Automated Monthly Calculations (Orange & Black Banner) */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5E3A] to-[#E04826] text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
                    {teacherHistory.teacher.name?.[0] || 'T'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FF5E3A]/20 text-[#FF5E3A] border border-[#FF5E3A]/40 text-[10px] font-black uppercase tracking-wider">
                        Faculty Record
                      </span>
                      <span className="text-xs text-white/70">&bull; Separate Attendance Ledger</span>
                    </div>
                    <h2 className="text-xl font-black text-white">{teacherHistory.teacher.name}</h2>
                    <p className="text-xs text-white/70 mt-0.5">
                      {teacherHistory.teacher.email} &bull; {teacherHistory.teacher.phone || 'Phone Not Registered'}
                    </p>
                  </div>
                </div>

                {/* Automated Monthly Calculations Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 p-4 rounded-xl border border-white/10 text-center font-mono">
                  <div>
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Working Days</div>
                    <div className="text-xl font-black text-white mt-0.5">{teacherHistory.summary.totalWorkingDays}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-orange-300 uppercase tracking-wider">Present Days</div>
                    <div className="text-xl font-black text-[#FF5E3A] mt-0.5">{teacherHistory.summary.presentCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Absent Days</div>
                    <div className="text-xl font-black text-white bg-black/60 rounded px-2 mt-0.5">{teacherHistory.summary.absentCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-orange-300 uppercase tracking-wider">Monthly Score</div>
                    <div className="text-xl font-black text-[#FF5E3A] mt-0.5">{teacherHistory.summary.attendancePercentage}%</div>
                  </div>
                </div>
              </div>

              {/* Weekly Summary Cards for this Teacher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {teacherHistory.weeklySummary.map((w, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white border border-slate-300 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">{w.week}</span>
                      <span className="text-[11px] font-black text-[#FF5E3A] bg-[#FFF0EB] px-2 py-0.5 rounded-md border border-[#FFD5C5]">
                        {w.attendanceRate}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Present: <strong className="text-slate-900">{w.presentDays}</strong> of {w.totalWorkingDays} working days
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-3">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-[#FF5E3A] rounded-full" style={{ width: `${w.attendanceRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Separate Individual Attendance Table (Excel Grid) */}
              <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-300 flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#FF5E3A]" />
                    <span>Daily Attendance Log Table for {teacherHistory.teacher.name}</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-600 font-semibold">
                    Calculation: <strong className="text-[#FF5E3A]">{teacherHistory.summary.presentCount} / {teacherHistory.summary.totalWorkingDays} Days</strong> ({teacherHistory.summary.attendancePercentage}%)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="bg-[#0F172A] text-white border-b-2 border-[#FF5E3A] text-[11px] font-bold uppercase tracking-wider select-none">
                        <th className="py-3 px-4 border-r border-slate-800 font-mono">Date</th>
                        <th className="py-3 px-4 border-r border-slate-800">Day</th>
                        <th className="py-3 px-4 border-r border-slate-800 text-center">Attendance Status</th>
                        <th className="py-3 px-4 border-r border-slate-800">Check-In Time</th>
                        <th className="py-3 px-4 border-r border-slate-800">Check-Out Time</th>
                        <th className="py-3 px-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {teacherHistory.dailyRecords.map((r, idx) => (
                        <tr key={idx} className={r.isWeekend ? 'bg-slate-50/70 text-slate-400' : 'hover:bg-[#FFF0EB]/30'}>
                          <td className="py-3 px-4 font-mono font-medium text-slate-800 border-r border-slate-200">
                            {r.date}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 border-r border-slate-200">
                            {r.dayName}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-200 text-center">
                            {r.status === 'Present' ? (
                              <span className="px-2.5 py-1 rounded-md text-xs font-black border bg-[#FFF0EB] text-[#FF5E3A] border-[#FFD5C5] inline-flex items-center gap-1 shadow-2xs">
                                <Check className="w-3 h-3 text-[#FF5E3A]" />
                                <span>Present</span>
                              </span>
                            ) : r.status === 'Absent' ? (
                              <span className="px-2.5 py-1 rounded-md text-xs font-black border bg-[#0F172A] text-white border-black inline-flex items-center gap-1 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E3A]" />
                                <span>Absent</span>
                              </span>
                            ) : r.status === 'Late' ? (
                              <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-amber-50 text-amber-800 border-amber-300">
                                Late
                              </span>
                            ) : r.status === 'Half Day' ? (
                              <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-orange-50 text-orange-800 border-orange-300">
                                Half Day
                              </span>
                            ) : r.status === 'On Leave' ? (
                              <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-slate-100 text-slate-800 border-slate-300">
                                On Leave
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-slate-100 text-slate-500 border-slate-200">
                                {r.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 border-r border-slate-200">
                            {r.checkInTime}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 border-r border-slate-200">
                            {r.checkOutTime}
                          </td>
                          <td className="py-3 px-4 text-slate-500 italic">
                            {r.remarks || (r.isWeekend ? 'Campus Closed' : 'Normal session')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
