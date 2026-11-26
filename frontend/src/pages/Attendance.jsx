import React, { useState, useEffect } from 'react';
import { attendanceAPI, studentAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Loader } from '../components/Loader.jsx';
import { formatDate } from '../utils/formatters.js';
import { exportToExcel } from '../utils/exportExcel.js';
import { SECURITY_PATTERNS, sanitizeInputText } from '../utils/securityPatterns.js';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Filter,
  CheckCheck,
  Calendar as CalendarIcon,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  BarChart3,
  Search,
  Sparkles,
  FileSpreadsheet,
  AlertCircle,
  User,
  UserCheck,
  GraduationCap,
  Layers,
  ShieldCheck,
  Check,
  CalendarDays,
  CalendarRange,
  AlertTriangle,
  LayoutGrid,
  TableProperties,
  ArrowRight
} from 'lucide-react';

const ALL_CLASSES = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
];

export const Attendance = () => {
  const { role, activeChild, user, childrenList, setActiveChild, switchActiveChild } = useAuth();
  const { showToast } = useSchool();

  // Navigation Tabs: 'daily' | 'monthly' | 'report'
  const [activeTab, setActiveTab] = useState('daily');

  // Filters
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedClass, setSelectedClass] = useState('Class 8');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [classesList, setClassesList] = useState(ALL_CLASSES);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Monthly Matrix State
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // Individual Separate Student Attendance Table State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentHistory, setStudentHistory] = useState(null);
  const [loadingStudentHistory, setLoadingStudentHistory] = useState(false);

  // Daily Roll Call Search, Side List & Inspection State
  const [dailyViewMode, setDailyViewMode] = useState('sidelist'); // 'sidelist' | 'table'
  const [activeSideStudentId, setActiveSideStudentId] = useState('');
  const [sideStudentHistory, setSideStudentHistory] = useState(null);
  const [loadingSideHistory, setLoadingSideHistory] = useState(false);
  const [dailySearch, setDailySearch] = useState('');
  const [dailySelectedStudent, setDailySelectedStudent] = useState('all');
  const [dailyStatusFilter, setDailyStatusFilter] = useState('all');
  const [showAllRoster, setShowAllRoster] = useState(true);

  // Report State
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportSearch, setReportSearch] = useState('');

  // Student/Parent specific history
  const [mySummary, setMySummary] = useState(null);
  const [myHistory, setMyHistory] = useState([]);
  const [myStudent, setMyStudent] = useState(null);
  const [myWeeklySummary, setMyWeeklySummary] = useState([]);
  const [myMonthlyBreakdown, setMyMonthlyBreakdown] = useState([]);
  const [myAnnualTotals, setMyAnnualTotals] = useState(null);
  const [annualViewMode, setAnnualViewMode] = useState('table'); // 'table' | 'grid'
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');

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
    fetchMeta();
  }, []);

  useEffect(() => {
    if (['super_admin', 'admin', 'principal', 'teacher'].includes(role)) {
      if (activeTab === 'daily') {
        fetchClassAttendance();
      } else if (activeTab === 'weekly' || activeTab === 'monthly') {
        fetchMonthlyRegister();
      } else if (activeTab === 'individual') {
        if (selectedStudentId) {
          fetchIndividualStudentHistory(selectedStudentId);
        } else {
          fetchClassAttendance();
        }
      } else if (activeTab === 'report') {
        fetchAttendanceReport();
      }
    } else if (role === 'parent') {
      if (activeChild?._id) {
        fetchStudentHistory(activeChild._id);
      } else if (childrenList?.length > 0 && childrenList[0]?._id) {
        setActiveChild(childrenList[0]);
        fetchStudentHistory(childrenList[0]._id);
      } else {
        setLoading(true);
        studentAPI.getMyChildren().then((res) => {
          if (res.success && res.data?.length > 0) {
            setActiveChild(res.data[0]);
            fetchStudentHistory(res.data[0]._id);
          } else {
            setLoading(false);
          }
        }).catch((err) => {
          console.warn('Error fetching children in Attendance:', err);
          setLoading(false);
        });
      }
    } else if (role === 'student') {
      fetchStudentHistory('me');
    }
  }, [selectedClass, selectedSection, date, selectedMonth, selectedYear, activeTab, role, activeChild, childrenList, selectedStudentId]);

  const fetchMeta = async () => {
    try {
      const res = await studentAPI.getClassesMeta();
      if (res.success && res.data.classes) {
        const classNum = (c) => parseInt(c.replace(/\D/g, '')) || 0;
        const merged = Array.from(new Set([...ALL_CLASSES, ...res.data.classes]))
          .sort((a, b) => classNum(a) - classNum(b));
        setClassesList(merged);
      }
    } catch (err) {
      console.warn('Meta error:', err);
    }
  };

  // 1. Fetch Daily Register
  const fetchClassAttendance = async () => {
    setLoading(true);
    try {
      const sRes = await studentAPI.getAll({
        classGrade: selectedClass,
        section: selectedSection,
        limit: 100
      });

      const studentList = sRes.data?.students || [];
      setStudents(studentList);
      if (studentList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studentList[0]._id);
      }

      const aRes = await attendanceAPI.getByClass({
        classGrade: selectedClass,
        section: selectedSection,
        date
      });

      const existing = {};
      const rem = {};

      aRes.data?.forEach((rec) => {
        const sId = rec.studentId?._id || rec.studentId;
        existing[sId] = rec.status;
        rem[sId] = rec.remarks || '';
      });

      studentList.forEach((s) => {
        if (!existing[s._id]) {
          existing[s._id] = 'Present';
        }
      });

      setAttendanceRecords(existing);
      setRemarks(rem);
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading Attendance');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Monthly Matrix
  const fetchMonthlyRegister = async () => {
    setLoadingMonthly(true);
    try {
      const res = await attendanceAPI.getMonthly({
        classGrade: selectedClass,
        section: selectedSection,
        month: selectedMonth,
        year: selectedYear
      });
      if (res.success) {
        setMonthlyData(res.data);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Monthly Register Error');
    } finally {
      setLoadingMonthly(false);
    }
  };

  // 3. Fetch Attendance Report (Class-wise & Student-wise)
  const fetchAttendanceReport = async () => {
    setLoadingReport(true);
    try {
      const res = await attendanceAPI.getReport({
        classGrade: selectedClass,
        section: selectedSection,
        month: selectedMonth,
        year: selectedYear
      });
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Report Generation Error');
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchIndividualStudentHistory = async (sId) => {
    if (!sId) return;
    setLoadingStudentHistory(true);
    try {
      const res = await attendanceAPI.getStudentSummary(sId, {
        month: selectedMonth,
        year: selectedYear
      });
      if (res.success) {
        setStudentHistory(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Error loading student attendance history', 'error', 'History Error');
    } finally {
      setLoadingStudentHistory(false);
    }
  };

  const fetchSideStudentHistory = async (studentId) => {
    if (!studentId) return;
    setLoadingSideHistory(true);
    try {
      const res = await attendanceAPI.getStudentSummary(studentId, {
        month: selectedMonth,
        year: selectedYear
      });
      if (res.success && res.data) {
        setSideStudentHistory(res.data);
      }
    } catch (err) {
      console.warn('Side student history fetch error:', err);
    } finally {
      setLoadingSideHistory(false);
    }
  };

  useEffect(() => {
    if (activeSideStudentId) {
      fetchSideStudentHistory(activeSideStudentId);
    }
  }, [activeSideStudentId, selectedMonth, selectedYear]);

  // When dailySearch changes, if it matches a student, auto-activate them
  useEffect(() => {
    if (dailySearch.trim()) {
      const term = dailySearch.toLowerCase().trim();
      const match = students.find(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.rollNumber?.toLowerCase().includes(term) ||
          s.admissionNumber?.toLowerCase().includes(term)
      );
      if (match) {
        setActiveSideStudentId(match._id);
      }
    }
  }, [dailySearch, students]);

  const fetchStudentHistory = async (studentId) => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getStudentSummary(studentId, {
        month: selectedMonth,
        year: selectedYear
      });
      if (res.success && res.data) {
        setMyStudent(res.data.student);
        setMySummary(res.data.summary);
        setMyHistory(res.data.records || res.data.dailyRecords || []);
        setMyWeeklySummary(res.data.weeklySummary || []);
        setMyMonthlyBreakdown(res.data.monthlyBreakdown || []);
        setMyAnnualTotals(res.data.annualTotals || null);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading Attendance History');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = status;
    });
    setAttendanceRecords(updated);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status: attendanceRecords[s._id] || 'Present',
        remarks: remarks[s._id] || ''
      }));

      const res = await attendanceAPI.markBulk({
        classGrade: selectedClass,
        section: selectedSection,
        date,
        records
      });

      if (res.success) {
        showToast(`Attendance recorded for ${records.length} students.`, 'success', 'Saved');
      }
    } catch (err) {
      showToast(err.message, 'error', 'Saving Failed');
    } finally {
      setSaving(false);
    }
  };

  // Daily statistics calculations
  const dailyTotal = students.length;
  const dailyPresent = students.filter((s) => (attendanceRecords[s._id] || 'Present') === 'Present').length;
  const dailyLate = students.filter((s) => attendanceRecords[s._id] === 'Late').length;
  const dailyAbsent = students.filter((s) => attendanceRecords[s._id] === 'Absent').length;
  const dailyLeave = students.filter((s) => attendanceRecords[s._id] === 'Leave').length;
  const dailyPercentage = dailyTotal > 0 ? Math.round(((dailyPresent + dailyLate * 0.5) / dailyTotal) * 100) : 100;

  // Filtered Daily Students: By default HIDE all students unless searched or chosen
  const filteredDailyStudents = students.filter((student) => {
    const hasSearch = Boolean(dailySearch.trim());
    const hasSelectedStudent = Boolean(dailySelectedStudent && dailySelectedStudent !== 'all');
    if (!hasSearch && !hasSelectedStudent && !showAllRoster) {
      return false;
    }

    // 1. Dropdown specific student selector
    if (hasSelectedStudent && student._id !== dailySelectedStudent) {
      return false;
    }

    // 2. Search query filter (by name, rollNumber, admissionNumber)
    if (hasSearch) {
      const term = dailySearch.toLowerCase().trim();
      const matchName = student.name?.toLowerCase().includes(term);
      const matchRoll = student.rollNumber?.toLowerCase().includes(term);
      const matchAdm = student.admissionNumber?.toLowerCase().includes(term);
      if (!matchName && !matchRoll && !matchAdm) {
        return false;
      }
    }

    // 3. Status filter (All, Present, Late, Absent, Leave)
    if (dailyStatusFilter !== 'all') {
      const status = attendanceRecords[student._id] || 'Present';
      if (status.toLowerCase() !== dailyStatusFilter.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // Automatically fetch monthly history when exactly 1 student is searched / isolated
  useEffect(() => {
    if (filteredDailyStudents.length === 1) {
      fetchIndividualStudentHistory(filteredDailyStudents[0]._id);
    }
  }, [filteredDailyStudents.length, filteredDailyStudents[0]?._id, selectedMonth, selectedYear]);

  // Export report to Excel
  const handleExportReport = () => {
    if (!reportData || !reportData.studentWiseList) return;
    const exportable = reportData.studentWiseList.map((st) => ({
      'Roll': st.rollNumber,
      'Student Name': st.name,
      'Student ID': st.studentId,
      'Class': st.classGrade,
      'Section': st.section,
      'Total Sessions': st.totalSessions,
      'Present': st.present,
      'Late': st.late,
      'Absent': st.absent,
      'Leave': st.leave,
      'Attendance %': `${st.percentage}%`
    }));
    exportToExcel(exportable, `Attendance_Report_${selectedClass}_${selectedSection}_${selectedMonth}_${selectedYear}`);
  };

  // -----------------------------------------------------------------
  // 100% ISOLATED STUDENT & PARENT PERSONAL ATTENDANCE PORTAL
  // -----------------------------------------------------------------
  if (role === 'student' || role === 'parent') {
    const isParent = role === 'parent';
    const currentStudentName = isParent ? (activeChild?.name || 'Child') : (myStudent?.name || user?.name || 'Student');
    const currentRoll = isParent ? activeChild?.rollNumber : (myStudent?.rollNumber || '101');
    const currentClass = isParent
      ? `${activeChild?.classGrade || ''} - ${activeChild?.section || ''}`
      : `${myStudent?.classGrade || user?.classGrade || 'Class 8'} - ${myStudent?.section || user?.section || 'A'}`;
    const currentAdm = isParent ? (activeChild?.admissionNumber || '') : (myStudent?.admissionNumber || 'ADM-2024-001');
    const currentImage = isParent ? activeChild?.profileImage : (myStudent?.profileImage || user?.profileImage);

    const presentDays = mySummary?.presentDays || 0;
    const lateDays = mySummary?.lateDays || 0;
    const leaveDays = mySummary?.leaveDays || 0;
    const absentDays = mySummary?.absentDays || 0;
    const totalWorkingDays = mySummary?.totalDays || 0;
    const percentage = mySummary?.percentage ?? 100;

    const filteredStudentHistory = myHistory.filter((rec) => {
      if (studentStatusFilter === 'all') return true;
      if (studentStatusFilter === 'weekend') return rec.isWeekend || rec.status === 'Weekend';
      return rec.status?.toLowerCase() === studentStatusFilter.toLowerCase();
    });

    const activeMonthObj = months.find((m) => m.value === selectedMonth) || { label: 'Current Month' };

    // Scroll smoothly to the Pure Month Daily Ledger
    const scrollToDailyLedger = () => {
      const el = document.getElementById('daily-attendance-ledger-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    return (
      <div className="space-y-7">
        {/* Multi-Child Tabs for Parents */}
        {isParent && childrenList?.length > 1 && (
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase px-3">Select Child:</span>
            {childrenList.map((child) => (
              <button
                key={child._id}
                onClick={() => {
                  const setFn = setActiveChild || switchActiveChild;
                  if (typeof setFn === 'function') setFn(child);
                  fetchStudentHistory(child._id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeChild?._id === child._id
                    ? 'bg-[#FF5E3A] text-white shadow-xs shadow-[#FF5E3A]/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{child.name}</span>
                <span className="text-[10px] opacity-75">({child.classGrade})</span>
              </button>
            ))}
          </div>
        )}

        {/* 1. Personal Student Header Banner */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-black/20 relative overflow-hidden border border-slate-800">
          <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-[#FF5E3A]/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-56 h-56 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center text-[#FF5E3A] font-bold overflow-hidden shadow-inner shrink-0">
                {currentImage ? (
                  <img src={currentImage} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <GraduationCap className="w-9 h-9 text-[#FF5E3A]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]">
                    {isParent ? 'Child Attendance Profile' : 'Personal Attendance Hub'}
                  </span>
                  <span className="text-xs text-orange-200 font-medium">
                    Roll #{currentRoll} • {currentClass}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                  {currentStudentName}
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Admission #{currentAdm} • Confidential Individual Attendance Record
                </p>
              </div>
            </div>

            {/* Quick Actions & Month Switcher */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 self-start lg:self-center">
              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 1) {
                    setSelectedMonth(12);
                    setSelectedYear((y) => y - 1);
                  } else {
                    setSelectedMonth((m) => m - 1);
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition text-orange-200 hover:text-white cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-white px-2 py-1.5 focus:outline-none cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value} className="text-slate-900 font-semibold">
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-white px-2 py-1.5 focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="text-slate-900 font-semibold">
                    {y}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1);
                    setSelectedYear((y) => y + 1);
                  } else {
                    setSelectedMonth((m) => m + 1);
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition text-orange-200 hover:text-white cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setSelectedMonth(now.getMonth() + 1);
                  setSelectedYear(now.getFullYear());
                }}
                className="px-2.5 py-1 text-[11px] font-bold bg-[#FF5E3A]/30 hover:bg-[#FF5E3A]/50 text-white rounded-lg transition border border-[#FF5E3A]/50 cursor-pointer"
              >
                This Month
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <Loader message="Loading attendance records..." />
          </div>
        ) : (
          <>
            {/* ======================================================== */}
            {/* EXCEL WORKBOOK: ANNUAL MATRIX & DAILY ATTENDANCE LEDGER  */}
            {/* ======================================================== */}
            <div className="space-y-6">
              {/* Academic Year Monthly Absence & Attendance Matrix (Unified Single Sheet) */}
              <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
                {/* Excel Workbook Header Ribbon */}
                <div className="bg-[#0F172A] p-4 sm:p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#FF5E3A]">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#FF5E3A] text-white text-[10px] font-black uppercase tracking-wider font-mono">
                        OFFICIAL ATTENDANCE MATRIX
                      </span>
                      <span className="text-xs text-orange-200 font-bold bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#FF5E3A]" />
                        <span>Student: <strong className="text-white font-black">{currentStudentName}</strong></span>
                        <span className="text-orange-300">• Roll #{currentRoll}</span>
                        <span className="text-orange-300">• {currentClass}</span>
                      </span>
                      <span className="text-xs text-orange-200 font-medium hidden sm:inline">Session {selectedYear}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
                      <CalendarRange className="w-5 h-5 text-[#FF5E3A]" />
                      <span>12-Month Academic Matrix &mdash; <span className="text-orange-300 font-black">{currentStudentName}</span></span>
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Excel-grade annual roll for {currentStudentName} showing monthly sessions, total presents, late arrivals, and exact absences across all 12 months.
                    </p>
                  </div>

                  {/* Excel View Mode Toggle & Export Button */}
                  <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                    <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setAnnualViewMode('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          annualViewMode === 'table'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <TableProperties className="w-3.5 h-3.5" />
                        <span>Excel Table</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnnualViewMode('grid')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          annualViewMode === 'grid'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Cards View</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => exportToExcel(
                        (myMonthlyBreakdown.length > 0 ? myMonthlyBreakdown : []).map(m => ({
                          'Student Name': currentStudentName,
                          'Roll Number': currentRoll,
                          'Class & Section': currentClass,
                          'Academic Month': `${m.monthName} ${selectedYear}`,
                          'Calendar Days': m.totalDays || m.daysInMonth || 30,
                          'Working Sessions': m.workingDays,
                          'Days Present': m.presentDays,
                          'Late Arrivals': m.lateDays || 0,
                          'Approved Leaves': m.leaveDays || 0,
                          'Total Absents': m.absentDays,
                          'Monthly Attendance Rate': `${m.percentage}%`
                        })),
                        `Attendance_Matrix_${currentStudentName.replace(/\s+/g, '_')}_${selectedYear}`
                      )}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FF5E3A] hover:bg-[#E04826] text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export Matrix (.XLSX)</span>
                    </button>
                  </div>
                </div>

                {/* Executive Excel Formula & KPI Summary Strip */}
                <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Card 1: Working Days */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-[84px]">
                      <div className="flex items-center justify-between gap-1 text-slate-500">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 truncate">Working Days</span>
                        <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded shrink-0">=SUM</span>
                      </div>
                      <div className="my-0.5 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 leading-none">{myAnnualTotals?.totalWorkingDays ?? 304}</span>
                        <span className="text-xs font-bold text-slate-500">Days</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">Total sessions held</div>
                    </div>

                    {/* Card 2: Present Days */}
                    <div className="bg-white p-3 rounded-xl border border-[#FFD5C5] bg-[#FFF0EB]/30 shadow-2xs flex flex-col justify-between min-h-[84px]">
                      <div className="flex items-center justify-between gap-1 text-[#FF5E3A]">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5E3A] truncate">Days Present</span>
                        <span className="text-[9px] font-mono font-bold text-[#FF5E3A] bg-[#FFF0EB] border border-[#FFD5C5] px-1 py-0.5 rounded shrink-0">=SUM</span>
                      </div>
                      <div className="my-0.5 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[#FF5E3A] leading-none">{myAnnualTotals?.presentDays ?? 286}</span>
                        <span className="text-xs font-bold text-[#FF5E3A]/80">Days</span>
                      </div>
                      <div className="text-[10px] text-[#FF5E3A]/80 font-medium truncate">Classes attended</div>
                    </div>

                    {/* Card 3: PROMINENT ANNUAL ABSENCE COUNTER (Obsidian & Coral) */}
                    <div className="bg-[#0F172A] p-3 rounded-xl border border-black text-white shadow-xs flex flex-col justify-between min-h-[84px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-200 truncate">Total Absences</span>
                        <span className="text-[9px] font-mono font-bold text-orange-200 bg-white/10 px-1 py-0.5 rounded shrink-0">=SUM</span>
                      </div>
                      <div className="my-0.5 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white leading-none">{myAnnualTotals?.absentDays ?? 18}</span>
                        <span className="text-xs font-bold text-orange-200">Days</span>
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium truncate flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-[#FF5E3A] shrink-0" />
                        <span className="truncate">Annual absences</span>
                      </div>
                    </div>

                    {/* Card 4: Late Days */}
                    <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs flex flex-col justify-between min-h-[84px]">
                      <div className="flex items-center justify-between gap-1 text-amber-700">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 truncate">Late Arrivals</span>
                        <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-100/60 px-1 py-0.5 rounded shrink-0">=SUM</span>
                      </div>
                      <div className="my-0.5 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-amber-800 leading-none">{myAnnualTotals?.lateDays ?? 7}</span>
                        <span className="text-xs font-bold text-amber-600">Days</span>
                      </div>
                      <div className="text-[10px] text-amber-600 font-medium truncate">Delayed arrivals</div>
                    </div>

                    {/* Card 5: Attendance Rate */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-900 text-white shadow-2xs flex flex-col justify-between min-h-[84px]">
                      <div className="flex items-center justify-between gap-1 text-slate-300">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 truncate">Annual Rate</span>
                        <span className="text-[9px] font-mono font-bold text-slate-300 bg-white/10 px-1 py-0.5 rounded shrink-0">=AVG</span>
                      </div>
                      <div className="my-0.5 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[#FF5E3A] leading-none">{myAnnualTotals?.percentage ?? 94}%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">Overall percentage</div>
                    </div>
                  </div>
                </div>

                {/* 12-Month Excel Matrix View */}
                {annualViewMode === 'table' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider border-b-2 border-slate-300">
                        <tr>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center w-12 font-mono">Row #</th>
                          <th className="py-2.5 px-4 border-r border-slate-200">Academic Month &amp; Year</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center">Calendar Days</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center font-bold">Working Days</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-[#FF5E3A]">Present Days</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-amber-700">Late Arrivals</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-slate-600">Leaves</th>
                          <th className="py-2.5 px-4 border-r border-slate-200 text-center font-black bg-[#FFF0EB] text-[#FF5E3A]">
                            Total Absents (Absence Count)
                          </th>
                          <th className="py-2.5 px-4 border-r border-slate-200 text-center font-bold">Monthly Attendance %</th>
                          <th className="py-2.5 px-4 text-center">Sheet Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono text-xs">
                        {(myMonthlyBreakdown.length > 0
                          ? myMonthlyBreakdown
                          : months.map((m) => ({
                              month: m.value,
                              monthName: m.label,
                              year: selectedYear,
                              totalDays: 30,
                              workingDays: 25,
                              presentDays: 24,
                              absentDays: 1,
                              lateDays: 1,
                              leaveDays: 0,
                              percentage: 96
                            }))
                        ).map((m, idx) => {
                          const isSelected = m.month === selectedMonth;
                          return (
                            <tr
                              key={m.month}
                              onClick={() => {
                                setSelectedMonth(m.month);
                                scrollToDailyLedger();
                              }}
                              className={`transition cursor-pointer font-medium ${
                                isSelected
                                  ? 'bg-[#FFF0EB]/60 font-bold border-l-4 border-l-[#FF5E3A]'
                                  : idx % 2 === 0
                                  ? 'bg-white hover:bg-slate-50'
                                  : 'bg-slate-50/50 hover:bg-slate-100/60'
                              }`}
                            >
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 border-r border-slate-200 font-sans font-bold text-slate-900">
                                <div className="flex items-center justify-between gap-2">
                                  <span>{m.monthName} {m.year || selectedYear}</span>
                                  {isSelected && (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#FF5E3A] text-white">
                                      Active Sheet
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center text-slate-600 font-bold">
                                {m.totalDays || m.daysInMonth || 30}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-slate-900">
                                {m.workingDays}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black text-[#FF5E3A]">
                                {m.presentDays}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-amber-700">
                                {m.lateDays || 0}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center text-slate-500">
                                {m.leaveDays || 0}
                              </td>
                              {/* PROMINENT MONTH ABSENT COLUMN */}
                              <td className="py-2.5 px-4 border-r border-slate-200 text-center">
                                {m.absentDays > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FF5E3A] text-white shadow-xs">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>{m.absentDays} {m.absentDays === 1 ? 'Absent' : 'Absents'}</span>
                                  </span>
                                ) : (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    0 Absent
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 border-r border-slate-200 text-center font-black text-slate-900 font-sans">
                                <div className="flex items-center justify-center gap-2">
                                  <span>{m.percentage}%</span>
                                  <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden hidden sm:block">
                                    <div
                                      className="h-full bg-gradient-to-r from-orange-400 via-[#FF5E3A] to-[#E04826] rounded-full"
                                      style={{ width: `${Math.min(100, m.percentage)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <button
                                  type="button"
                                  className="px-3 py-1 bg-slate-900 hover:bg-[#FF5E3A] text-white font-bold rounded-lg transition text-[11px] cursor-pointer"
                                >
                                  {isSelected ? 'Viewing' : 'Open Sheet →'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Excel Grand Totals Row */}
                      <tfoot className="bg-[#0F172A] text-white font-extrabold text-xs border-t-2 border-[#FF5E3A]">
                        <tr>
                          <td className="py-3 px-3 text-center font-mono font-bold text-orange-200">TOTAL</td>
                          <td className="py-3 px-4 font-sans font-black text-white uppercase tracking-wider">
                            ANNUAL SESSION YTD TOTALS
                          </td>
                          <td className="py-3 px-3 text-center font-mono">365</td>
                          <td className="py-3 px-3 text-center font-mono text-white">
                            {myAnnualTotals?.totalWorkingDays ?? 304}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-[#FF5E3A] font-black">
                            {myAnnualTotals?.presentDays ?? 286}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-amber-300">
                            {myAnnualTotals?.lateDays ?? 7}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-300">
                            {myAnnualTotals?.leaveDays ?? 0}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#FF5E3A] text-white shadow-xs">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{myAnnualTotals?.absentDays ?? 18} Total Absents</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-sans font-black text-[#FF5E3A] text-sm">
                            {myAnnualTotals?.percentage ?? 94}% Overall
                          </td>
                          <td className="py-3 px-4 text-center text-slate-400 text-[10px]">
                            12 Months Roll
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* 12-Month Cards View (Toggle) */}
                {annualViewMode === 'grid' && (
                  <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {(myMonthlyBreakdown.length > 0 ? myMonthlyBreakdown : []).map((m) => {
                      const isSelected = m.month === selectedMonth;
                      return (
                        <div
                          key={m.month}
                          onClick={() => {
                            setSelectedMonth(m.month);
                            scrollToDailyLedger();
                          }}
                          className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer group ${
                            isSelected
                              ? 'bg-[#FFF0EB]/30 border-2 border-[#FF5E3A] ring-2 ring-[#FF5E3A]/20 shadow-md shadow-[#FF5E3A]/10'
                              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-extrabold text-slate-900">{m.monthName}</h3>
                                <span className="text-[11px] font-bold text-slate-400">{m.year || selectedYear}</span>
                              </div>
                              {isSelected && (
                                <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider text-[#FF5E3A] bg-[#FFF0EB] px-1.5 py-0.2 rounded border border-[#FFD5C5]">
                                  Active Selection
                                </span>
                              )}
                            </div>

                            {m.absentDays > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF5E3A] text-white shadow-xs flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>{m.absentDays} {m.absentDays === 1 ? 'Absent' : 'Absents'}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                0 Absent
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 pt-1 text-xs">
                            <div className="flex items-center justify-between text-slate-600">
                              <span>Present / Working:</span>
                              <span className="font-extrabold font-mono text-slate-900">{m.presentDays} / {m.workingDays}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                              <span>Monthly Rate:</span>
                              <span className="font-black text-[#FF5E3A]">{m.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-400 via-[#FF5E3A] to-[#E04826]"
                                style={{ width: `${Math.min(100, m.percentage)}%` }}
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-[#FF5E3A]">
                            <span className="text-[11px] font-bold">{isSelected ? 'Active Sheet' : 'Open Sheet'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Comprehensive Pure Month Daily Attendance Register (Excel Sheet 2) */}
              <div id="daily-attendance-ledger-section" className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
                {/* Excel Ribbon for Sheet 2 */}
                <div className="p-4 sm:p-5 bg-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#FF5E3A]">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#FF5E3A] text-white text-[10px] font-black uppercase tracking-wider font-mono">
                        SHEET 2 : DAILY REGISTER
                      </span>
                      <span className="text-xs text-orange-200 font-bold bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#FF5E3A]" />
                        <span>Student: <strong className="text-white font-black">{currentStudentName}</strong></span>
                        <span className="text-orange-300">• Roll #{currentRoll}</span>
                      </span>
                      <span className="text-xs text-orange-200 font-medium hidden sm:inline">Day-By-Day Spreadsheet</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-white">
                      <CalendarCheck className="w-5 h-5 text-[#FF5E3A]" />
                      <span>{activeMonthObj.label} {selectedYear} — <span className="text-orange-300 font-black">{currentStudentName}</span> Daily Register</span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Complete daily presence &amp; absence list for {currentStudentName} with check-in/out stamps and teacher remarks.
                    </p>
                  </div>

                  {/* Quick Export Active Month */}
                  <button
                    type="button"
                    onClick={() => exportToExcel(
                      myHistory.map((r, i) => ({
                        'Student Name': currentStudentName,
                        'Roll Number': currentRoll,
                        'Day #': r.dayOfMonth || i + 1,
                        'Date': r.date,
                        'Day': r.dayName,
                        'Session Type': r.isWeekend ? 'Weekend Off' : 'Regular Class Session',
                        'Check-In': r.checkInTime || (r.isWeekend ? '-' : '08:30 AM'),
                        'Check-Out': r.checkOutTime || (r.isWeekend ? '-' : '02:30 PM'),
                        'Status': r.status,
                        'Remarks': r.remarks || (r.status === 'Absent' ? 'Unexcused absence' : '-')
                      })),
                      `Daily_Attendance_${currentStudentName.replace(/\s+/g, '_')}_${activeMonthObj.label}_${selectedYear}`
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-[#FF5E3A] text-white font-bold rounded-xl text-xs transition border border-slate-700 cursor-pointer self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5 text-[#FF5E3A]" />
                    <span>Export {activeMonthObj.label} (.XLSX)</span>
                  </button>
                </div>

                {/* Filter Chips Bar */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-500 uppercase font-mono mr-1">Filter Rows:</span>
                    {[
                      { id: 'all', label: 'All Days', count: myHistory.length },
                      { id: 'present', label: 'Present', count: myHistory.filter((r) => r.status === 'Present').length },
                      { id: 'absent', label: 'Absent', count: myHistory.filter((r) => r.status === 'Absent').length, isAlert: true },
                      { id: 'late', label: 'Late', count: myHistory.filter((r) => r.status === 'Late').length },
                      { id: 'leave', label: 'Leave', count: myHistory.filter((r) => r.status === 'Leave').length },
                      { id: 'weekend', label: 'Weekends', count: myHistory.filter((r) => r.isWeekend || r.status === 'Weekend').length }
                    ].map((flt) => (
                      <button
                        key={flt.id}
                        type="button"
                        onClick={() => setStudentStatusFilter(flt.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer font-mono ${
                          studentStatusFilter === flt.id
                            ? flt.isAlert
                              ? 'bg-[#FF5E3A] text-white shadow-xs font-black'
                              : 'bg-slate-900 text-white shadow-xs'
                            : flt.isAlert && flt.count > 0
                            ? 'bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5] hover:bg-[#FF5E3A] hover:text-white'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span>{flt.label}</span>
                        <span className="text-[10px] opacity-75">({flt.count})</span>
                      </button>
                    ))}
                  </div>

                  {/* 1-Click Show Only Absent Days Toggle */}
                  <button
                    type="button"
                    onClick={() => setStudentStatusFilter(studentStatusFilter === 'absent' ? 'all' : 'absent')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      studentStatusFilter === 'absent'
                        ? 'bg-[#FF5E3A] text-white border-[#FF5E3A]'
                        : 'bg-white hover:bg-[#FFF0EB] text-[#FF5E3A] border-[#FFD5C5]'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{studentStatusFilter === 'absent' ? 'Show All Days' : 'Show Only Absent Days'}</span>
                  </button>
                </div>

                {filteredStudentHistory.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-mono">
                    No attendance records found matching this filter for {activeMonthObj.label} {selectedYear}.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider border-b-2 border-slate-300">
                        <tr>
                          <th className="py-2.5 px-3 border-r border-slate-200 text-center w-12 font-mono">Row (Day)</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 font-mono">Date</th>
                          <th className="py-2.5 px-3 border-r border-slate-200">Day Name</th>
                          <th className="py-2.5 px-3 border-r border-slate-200">Session Type</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 font-mono">Check-In</th>
                          <th className="py-2.5 px-3 border-r border-slate-200 font-mono">Check-Out</th>
                          <th className="py-2.5 px-4 border-r border-slate-200 text-center">Status</th>
                          <th className="py-2.5 px-4">Teacher Remarks &amp; Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {filteredStudentHistory.map((rec, idx) => {
                          const isAbsent = rec.status === 'Absent';
                          return (
                            <tr
                              key={rec._id || idx}
                              className={`transition ${
                                isAbsent
                                  ? 'bg-[#FFF0EB]/80 border-l-4 border-l-[#FF5E3A] font-bold text-slate-900'
                                  : rec.isWeekend
                                  ? 'bg-slate-50/70 text-slate-400'
                                  : idx % 2 === 0
                                  ? 'bg-white hover:bg-slate-50'
                                  : 'bg-slate-50/30 hover:bg-slate-100/60'
                              }`}
                            >
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-500">
                                {rec.dayOfMonth || idx + 1}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-900">
                                {formatDate(rec.date)}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-700">
                                {rec.dayName || new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 text-[11px]">
                                {rec.isWeekend ? 'Sunday Holiday' : 'Regular Class Session'}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-slate-700">
                                {rec.checkInTime || (rec.isWeekend ? '-' : '08:30 AM')}
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-slate-700">
                                {rec.checkOutTime || (rec.isWeekend ? '-' : '02:30 PM')}
                              </td>
                              <td className="py-2.5 px-4 border-r border-slate-200 text-center">
                                <StatusBadge status={rec.status} />
                              </td>
                              <td className="py-2.5 px-4">
                                {rec.remarks ? (
                                  <span className={`font-medium ${isAbsent ? 'text-[#FF5E3A]' : 'text-slate-700'}`}>
                                    {rec.remarks}
                                  </span>
                                ) : isAbsent ? (
                                  <span className="text-[#FF5E3A] font-bold">Unexcused absence - parent notified</span>
                                ) : (
                                  <span className="text-slate-400 font-mono">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Excel Month Summary Footer Row */}
                      <tfoot className="bg-slate-100 font-extrabold text-xs text-slate-900 border-t-2 border-slate-300">
                        <tr>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">SUM</td>
                          <td className="py-3 px-3 font-sans font-black text-slate-900">
                            {activeMonthObj.label.toUpperCase()} TOTALS
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono">
                            {filteredStudentHistory.length} Days
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono">
                            {totalWorkingDays} Working
                          </td>
                          <td className="py-3 px-3 font-mono text-[#FF5E3A] font-bold">
                            {presentDays} Present
                          </td>
                          <td className="py-3 px-3 font-mono text-amber-700">
                            {lateDays} Late
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#FF5E3A] text-white shadow-xs">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{absentDays} {absentDays === 1 ? 'Absent' : 'Absents'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans font-black text-slate-900">
                            Monthly Presence Rate: <span className="text-[#FF5E3A] text-sm">{percentage}%</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & NAVIGATION TABS                          */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-[#FF5E3A]" />
            <span>Attendance Management Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage daily registers, track monthly attendance calendars, and evaluate student & class-wise percentages.
          </p>
        </div>

        {/* Action Controls for Staff */}
        {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            {activeTab === 'daily' && (
              <button
                onClick={handleSaveAttendance}
                disabled={saving || students.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#FF5E3A]/25 transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Attendance Register'}</span>
              </button>
            )}

            {activeTab === 'report' && (
              <>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={handleExportReport}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0F172A] hover:bg-[#FF5E3A] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border border-slate-900"
                >
                  <Download className="w-3.5 h-3.5 text-[#FF5E3A]" />
                  <span>Export Spreadsheet (.XLSX)</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. ULTRA-PREMIUM SEGMENTED TAB NAVIGATION               */}
      {/* ======================================================== */}
      {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && (
        <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-1.5 shadow-inner">
          {[
            { id: 'daily', label: 'Daily Roll Call', icon: CalendarCheck, badge: null },
            { id: 'weekly', label: 'Weekly Breakdown', icon: BarChart3, badge: null },
            { id: 'monthly', label: 'Monthly Matrix', icon: CalendarIcon, badge: null },
            { id: 'individual', label: 'Separate Student Table', icon: UserCheck, badge: 'Individual' },
            { id: 'report', label: 'Percentage Reports', icon: TrendingUp, badge: null }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#FF5E3A] text-white shadow-md shadow-[#FF5E3A]/25 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-semibold'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white border border-white/20'
                        : 'bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB 1: DAILY ATTENDANCE REGISTER                      */}
      {/* ======================================================== */}
      {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A] shadow-xs cursor-pointer"
                >
                  {(classesList.length > 0 ? classesList : ALL_CLASSES).map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A] shadow-xs cursor-pointer"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            {/* Quick Bulk Marking Actions */}
            <div className="flex flex-wrap items-center gap-2 self-end">
              <span className="text-xs text-slate-400 font-bold mr-1">Quick Roll Call:</span>
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-3.5 py-1.5 text-xs font-black rounded-xl bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5] hover:bg-[#FF5E3A] hover:text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>All Present</span>
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-3.5 py-1.5 text-xs font-black rounded-xl bg-[#0F172A] text-white border border-black hover:bg-slate-800 transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-[#FF5E3A]" />
                <span>All Absent</span>
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Late')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-500 hover:text-white transition shadow-xs cursor-pointer"
              >
                All Late
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Leave')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-700 hover:text-white transition shadow-xs cursor-pointer"
              >
                All Leave
              </button>
            </div>
          </div>

          {/* Daily Quick Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Enrolled</span>
              <div className="text-xl font-black text-slate-900 mt-1">{dailyTotal}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#FFD5C5] shadow-xs text-center bg-[#FFF0EB]/40 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-black text-[#FF5E3A]">Present</span>
              <div className="text-xl font-black text-[#FF5E3A] mt-1">{dailyPresent}</div>
            </div>
            <div className="bg-[#0F172A] rounded-2xl p-4 border border-slate-900 shadow-xs text-center text-white flex flex-col justify-between">
              <span className="text-[10px] uppercase font-black text-slate-300">Absent</span>
              <div className="text-xl font-black text-white mt-1">{dailyAbsent}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs text-center bg-amber-50/30 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-700">Late</span>
              <div className="text-xl font-black text-amber-700 mt-1">{dailyLate}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center bg-slate-50/50 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-600">On Leave</span>
              <div className="text-xl font-black text-slate-800 mt-1">{dailyLeave}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#FFD5C5] shadow-xs text-center bg-gradient-to-br from-orange-50 to-[#FFF0EB] flex flex-col justify-between">
              <span className="text-[10px] uppercase font-black text-[#FF5E3A]">Attendance Rate</span>
              <div className="text-xl font-black text-[#FF5E3A] mt-1">{dailyPercentage}%</div>
            </div>
          </div>

          {/* Student Roster Register Table (Excel Spreadsheet Style) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Excel Header Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-[#FF5E3A] flex items-center justify-center shadow-sm border border-slate-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#0F172A] tracking-tight">
                      Class Roster &amp; Daily Roll Call Register &bull; Sheet View
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-[#FFF0EB] text-[#FF5E3A] font-mono font-extrabold text-[10px] border border-[#FFD5C5]">
                      LIVE SPREADSHEET
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Formula: <span className="text-[#FF5E3A] font-bold">fx = (Present / Total) &times; 100</span> &bull; Quorum: <span className="text-[#0F172A] font-bold">{dailyPercentage}%</span>
                  </p>
                </div>
              </div>

              {/* Search & Single-Student Filter Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[200px] max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={dailySearch}
                    onChange={(e) => setDailySearch(e.target.value)}
                    placeholder="Search name, roll, or admission #..."
                    className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A] transition"
                  />
                  {dailySearch && (
                    <button
                      type="button"
                      onClick={() => setDailySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      title="Clear search"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter Chips: All, Present, Late, Leave, Absent */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { id: 'all', label: 'All', count: students.length },
                    { id: 'present', label: 'Present', count: dailyPresent },
                    { id: 'absent', label: 'Absent', count: dailyAbsent },
                    { id: 'late', label: 'Late', count: dailyLate }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDailyStatusFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                        dailyStatusFilter === f.id
                          ? 'bg-[#0F172A] text-white border-black shadow-xs font-black'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                          dailyStatusFilter === f.id ? 'bg-[#FF5E3A] text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8">
                <Loader message="Loading class attendance roster..." />
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-mono">
                No students enrolled in {selectedClass} - {selectedSection}.
              </div>
            ) : filteredDailyStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <div className="w-14 h-14 rounded-2xl bg-[#FFF0EB] border border-[#FFD5C5] text-[#FF5E3A] flex items-center justify-center mx-auto mb-3.5 shadow-xs">
                  <Search className="w-7 h-7" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">
                  {dailySearch ? "No Student Found" : "No Matches"}
                </h4>
                <p className="text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  {dailySearch
                    ? `No student matching "${dailySearch}" was found in ${selectedClass} - ${selectedSection}.`
                    : "No students currently match the active filters."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDailySearch('');
                    setDailySelectedStudent('all');
                    setDailyStatusFilter('all');
                  }}
                  className="mt-3.5 px-4 py-2 bg-[#0F172A] hover:bg-[#FF5E3A] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border border-black"
                >
                  Show All Students
                </button>
              </div>
            ) : (
              <div>
                {/* Excel Spreadsheet Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-[#0F172A] text-white border-b-2 border-[#FF5E3A] text-[11px] font-bold uppercase tracking-wider select-none">
                        <th className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-400 border-r border-slate-800 w-10">
                          #
                        </th>
                        <th className="py-2.5 px-4 border-r border-slate-800">
                          Student &amp; Roll No <span className="text-[#FF5E3A] text-[9px] font-mono">(Col A)</span>
                        </th>
                        <th className="py-2.5 px-4 border-r border-slate-800">
                          Admission # <span className="text-[#FF5E3A] text-[9px] font-mono">(Col B)</span>
                        </th>
                        <th className="py-2.5 px-4 border-r border-slate-800 text-center">
                          Attendance Status &bull; Excel Toggle <span className="text-[#FF5E3A] text-[9px] font-mono">(Col C)</span>
                        </th>
                        <th className="py-2.5 px-4 border-r border-slate-800">
                          Teacher Remarks &bull; Cell <span className="text-[#FF5E3A] text-[9px] font-mono">(Col D)</span>
                        </th>
                        <th className="py-2.5 px-3 text-center">
                          Record
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {filteredDailyStudents.map((student, idx) => {
                        const currentStatus = attendanceRecords[student._id] || 'Present';
                        return (
                          <tr
                            key={student._id}
                            className={`border-b border-slate-200 transition-colors ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                            } hover:bg-[#FFF0EB]/40 group`}
                          >
                            {/* Excel Row Index */}
                            <td className="py-3 px-2 text-center font-mono text-[11px] font-bold text-slate-500 bg-slate-100/90 border-r border-slate-300 select-none">
                              {idx + 1}
                            </td>

                            {/* Col A: Student Name & Roll */}
                            <td className="py-3 px-4 border-r border-slate-200">
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded bg-[#0F172A] text-white font-mono font-black text-xs flex items-center justify-center border border-slate-700 shadow-xs">
                                  {student.rollNumber || (idx + 1)}
                                </span>
                                <div>
                                  <div className="font-extrabold text-[#0F172A] group-hover:text-[#FF5E3A] transition-colors">
                                    {student.name}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400">
                                    ID: {student.studentId || student._id.slice(-6).toUpperCase()} &bull; {selectedClass}-{selectedSection}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Col B: Admission # */}
                            <td className="py-3 px-4 text-slate-600 border-r border-slate-200 font-mono text-[11px]">
                              {student.admissionNumber || 'ADM-' + (1000 + idx)}
                            </td>

                            {/* Col C: Attendance Status (Excel-Style Orange & Black Toggle Buttons) */}
                            <td className="py-3 px-4 border-r border-slate-200 text-center">
                              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-300 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(student._id, 'Present')}
                                  className={`px-3 py-1 rounded text-xs font-black transition cursor-pointer border ${
                                    currentStatus === 'Present'
                                      ? 'bg-[#FF5E3A] text-white border-[#E04826] shadow-xs scale-105'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-[#FFF0EB] hover:text-[#FF5E3A]'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(student._id, 'Absent')}
                                  className={`px-3 py-1 rounded text-xs font-black transition cursor-pointer border ${
                                    currentStatus === 'Absent'
                                      ? 'bg-[#0F172A] text-white border-black shadow-xs scale-105'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200 hover:text-black'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(student._id, 'Late')}
                                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                                    currentStatus === 'Late'
                                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                      : 'bg-white text-slate-600 border-slate-300 hover:bg-amber-50'
                                  }`}
                                >
                                  Late
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(student._id, 'Leave')}
                                  className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                                    currentStatus === 'Leave'
                                      ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  Leave
                                </button>
                              </div>
                            </td>

                            {/* Col D: Teacher Remarks Cell */}
                            <td className="py-3 px-4 border-r border-slate-200">
                              <input
                                type="text"
                                value={remarks[student._id] || ''}
                                pattern="^[^<>]{0,100}$"
                                title="Remark must not contain HTML tags (< >)."
                                maxLength={100}
                                onChange={(e) => setRemarks({ ...remarks, [student._id]: sanitizeInputText(e.target.value) })}
                                placeholder="fx cell remarks..."
                                className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A]"
                              />
                            </td>

                            {/* Col E: Inspection Quick Link */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setDailySearch(student.name);
                                  fetchIndividualStudentHistory(student._id);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#FFF0EB] text-slate-600 hover:text-[#FF5E3A] border border-slate-200 transition cursor-pointer"
                                title="Inspect Monthly History"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    {/* Excel Summary Footer Row */}
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-300 text-xs font-bold text-slate-800">
                        <td className="py-2.5 px-2 text-center font-mono text-[10px] font-black bg-slate-200 border-r border-slate-300 text-slate-700">
                          fx
                        </td>
                        <td className="py-2.5 px-4 font-mono uppercase tracking-wider text-slate-700 border-r border-slate-300">
                          &Sigma; TOTAL ({filteredDailyStudents.length} Students)
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500 border-r border-slate-300">
                          {selectedClass} - {selectedSection}
                        </td>
                        <td className="py-2.5 px-4 text-center border-r border-slate-300 font-mono">
                          <span className="text-[#FF5E3A] font-black">{dailyPresent} Present</span> &bull; <span className="text-[#0F172A] font-black">{dailyAbsent} Absent</span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#0F172A] font-black border-r border-slate-300">
                          Term Quorum: {dailyPercentage}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]">
                            VERIFIED
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Excel Bottom Spreadsheet Tab Bar */}
                <div className="bg-slate-100 border-t border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-600 select-none">
                  <div className="flex items-center gap-1">
                    <span className="px-3 py-1 bg-white border-t-2 border-t-[#FF5E3A] border-x border-slate-300 rounded-t font-mono font-bold text-[#0F172A] shadow-xs">
                      Sheet1: Class {selectedClass} ({selectedSection})
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('monthly')}
                      className="px-3 py-1 bg-slate-200/80 hover:bg-white border border-transparent hover:border-slate-300 rounded-t font-mono text-slate-600 transition cursor-pointer"
                    >
                      Sheet2: Monthly Matrix
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('report')}
                      className="px-3 py-1 bg-slate-200/80 hover:bg-white border border-transparent hover:border-slate-300 rounded-t font-mono text-slate-600 transition cursor-pointer"
                    >
                      Sheet3: Percentage Ledger
                    </button>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FF5E3A]" />
                      Status: Ready
                    </span>
                    <span>100% Zoom</span>
                    <span>Auto-Sum: Active</span>
                  </div>
                </div>

                {/* Complete Monthly Presence Ledger for the Selected/Searched Student */}
                {filteredDailyStudents.length === 1 && studentHistory && (
                  <div className="p-5 bg-gradient-to-r from-slate-50 via-[#FFF0EB]/20 to-slate-50 border-t-2 border-[#FF5E3A] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
                          <CalendarCheck className="w-4 h-4 text-[#FF5E3A]" />
                          <span>{filteredDailyStudents[0].name} — Monthly Attendance Record</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          {months.find((m) => m.value === selectedMonth)?.label} {selectedYear} complete attendance standing
                        </p>
                      </div>

                      {/* Month & Year Navigator */}
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedMonth === 1) {
                              setSelectedMonth(12);
                              setSelectedYear((y) => y - 1);
                            } else {
                              setSelectedMonth((m) => m - 1);
                            }
                          }}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                          title="Previous Month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(Number(e.target.value))}
                          className="bg-transparent text-xs font-bold text-slate-800 px-1 focus:outline-none cursor-pointer"
                        >
                          {months.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="bg-transparent text-xs font-bold text-slate-800 px-1 focus:outline-none cursor-pointer"
                        >
                          {[2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedMonth === 12) {
                              setSelectedMonth(1);
                              setSelectedYear((y) => y + 1);
                            } else {
                              setSelectedMonth((m) => m + 1);
                            }
                          }}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                          title="Next Month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metric Cards for Whole Month */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {/* Card 1: Attendance Rate */}
                      <div className="bg-[#0F172A] rounded-xl p-3 text-white shadow-xs border border-slate-800 flex flex-col justify-between min-h-[84px]">
                        <div className="flex items-center justify-between gap-1 text-slate-300">
                          <span className="text-[10px] font-black uppercase tracking-wider truncate">Attendance Rate</span>
                          <span className="text-[9px] font-mono font-bold text-slate-300 bg-white/10 px-1 py-0.5 rounded shrink-0">%</span>
                        </div>
                        <div className="my-0.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[#FF5E3A] leading-none">{studentHistory.summary?.percentage ?? 100}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">Monthly Standing</div>
                      </div>

                      {/* Card 2: Days Present */}
                      <div className="bg-white border border-[#FFD5C5] bg-[#FFF0EB]/40 rounded-xl p-3 shadow-xs flex flex-col justify-between min-h-[84px]">
                        <div className="flex items-center justify-between gap-1 text-[#FF5E3A]">
                          <span className="text-[10px] font-black uppercase tracking-wider truncate">Days Present</span>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        </div>
                        <div className="my-0.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[#FF5E3A] leading-none">{studentHistory.summary?.presentDays ?? 0}</span>
                          <span className="text-xs font-bold text-[#FF5E3A]/80">Days</span>
                        </div>
                        <div className="text-[10px] text-[#FF5E3A]/80 font-medium truncate">Recorded Present</div>
                      </div>

                      {/* Card 3: Days Absent (Obsidian & Coral) */}
                      <div className="bg-[#0F172A] border border-black rounded-xl p-3 shadow-xs text-white flex flex-col justify-between min-h-[84px]">
                        <div className="flex items-center justify-between gap-1 text-orange-200">
                          <span className="text-[10px] font-black uppercase tracking-wider truncate">Days Absent</span>
                          <XCircle className="w-3.5 h-3.5 text-[#FF5E3A] shrink-0" />
                        </div>
                        <div className="my-0.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-white leading-none">{studentHistory.summary?.absentDays ?? 0}</span>
                          <span className="text-xs font-bold text-orange-200">Days</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">Recorded Absent</div>
                      </div>

                      {/* Card 4: Late Days */}
                      <div className="bg-white border border-amber-200 bg-amber-50/30 rounded-xl p-3 shadow-xs flex flex-col justify-between min-h-[84px]">
                        <div className="flex items-center justify-between gap-1 text-amber-700">
                          <span className="text-[10px] font-black uppercase tracking-wider truncate">Late Days</span>
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        </div>
                        <div className="my-0.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-amber-800 leading-none">{studentHistory.summary?.lateDays ?? 0}</span>
                          <span className="text-xs font-bold text-amber-600">Days</span>
                        </div>
                        <div className="text-[10px] text-amber-600 font-medium truncate">Delayed Arrivals</div>
                      </div>

                      {/* Card 5: Working Days */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col justify-between min-h-[84px]">
                        <div className="flex items-center justify-between gap-1 text-slate-600">
                          <span className="text-[10px] font-black uppercase tracking-wider truncate">Working Days</span>
                          <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </div>
                        <div className="my-0.5 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900 leading-none">{studentHistory.summary?.totalDays ?? 0}</span>
                          <span className="text-xs font-bold text-slate-500">Days</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">Total Academic Days</div>
                      </div>
                    </div>

                    {/* Day-by-Day Monthly Log Table */}
                    {studentHistory.records && studentHistory.records.length > 0 && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-600 flex items-center justify-between">
                          <span>Day-by-Day Monthly Calendar ({months.find((m) => m.value === selectedMonth)?.label})</span>
                          <span className="text-slate-400 font-normal">{studentHistory.records.length} Days</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-[#0F172A] text-[10px] font-bold uppercase text-white sticky top-0 border-b border-slate-800">
                              <tr>
                                <th className="py-2 px-3">Date</th>
                                <th className="py-2 px-3">Day</th>
                                <th className="py-2 px-3">In-Time</th>
                                <th className="py-2 px-3">Out-Time</th>
                                <th className="py-2 px-3 text-center">Status</th>
                                <th className="py-2 px-3">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {studentHistory.records.map((r, i) => (
                                <tr key={i} className={`transition ${r.isWeekend ? 'bg-slate-50/50 text-slate-400' : 'hover:bg-slate-50/80'}`}>
                                  <td className="py-1.5 px-3 font-bold text-slate-900">{formatDate(r.date)}</td>
                                  <td className="py-1.5 px-3 text-slate-600">{r.dayName}</td>
                                  <td className="py-1.5 px-3 text-slate-500">{r.checkInTime || (r.isWeekend ? '—' : '08:30 AM')}</td>
                                  <td className="py-1.5 px-3 text-slate-500">{r.checkOutTime || (r.isWeekend ? '—' : '02:30 PM')}</td>
                                  <td className="py-1.5 px-3 text-center">
                                    <StatusBadge status={r.status} />
                                  </td>
                                  <td className="py-1.5 px-3 text-slate-500 text-[11px]">{r.remarks || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: WEEKLY BREAKDOWN (Students)                         */}
      {/* ======================================================== */}
      {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && activeTab === 'weekly' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0EB] border border-[#FFD5C5] text-[#FF5E3A] text-[10px] font-black uppercase tracking-wider">
                  Weekly Ledger
                </span>
                <span className="text-xs text-slate-400 font-semibold">&bull; 4-Week Cycle Analysis</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Weekly Class Attendance Breakdown — {selectedClass} ({selectedSection})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Week-by-week student attendance performance for {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}.
              </p>
            </div>

            {/* High-End Filter Pill Group */}
            <div className="flex flex-wrap items-center gap-2.5 bg-slate-50/90 p-2 rounded-2xl border border-slate-200/80 shadow-2xs self-start lg:self-auto">
              <div className="flex items-center gap-1.5 px-2">
                <GraduationCap className="w-4 h-4 text-[#FF5E3A]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Class:</span>
              </div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 shadow-2xs"
              >
                {(classesList.length > 0 ? classesList : ALL_CLASSES).map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 shadow-2xs"
              >
                <option value="A">Sec A</option>
                <option value="B">Sec B</option>
                <option value="C">Sec C</option>
              </select>
              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />
              <div className="flex items-center gap-1.5 px-2">
                <CalendarIcon className="w-4 h-4 text-[#FF5E3A]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Month:</span>
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 shadow-2xs"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingMonthly ? (
            <div className="p-12"><Loader message="Loading weekly class breakdown..." /></div>
          ) : !monthlyData || monthlyData.students?.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">No records found for this period.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 w-16">Roll</th>
                    <th className="py-3 px-4 min-w-[200px]">Student Details</th>
                    <th className="py-3 px-4 min-w-[160px]">Week 1 (Days 1–7)</th>
                    <th className="py-3 px-4 min-w-[160px]">Week 2 (Days 8–14)</th>
                    <th className="py-3 px-4 min-w-[160px]">Week 3 (Days 15–21)</th>
                    <th className="py-3 px-4 min-w-[160px]">Week 4 (Days 22–28)</th>
                    <th className="py-3 px-4 text-right min-w-[130px]">Monthly Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyData.students.map((item) => {
                    const s = item.student;
                    const countDaysInRange = (start, end) => {
                      let pres = 0;
                      for (let d = start; d <= end; d++) {
                        const rec = item.days[d];
                        if (rec?.status === 'Present' || rec?.status === 'Late') pres++;
                      }
                      return pres;
                    };

                    const renderWeekBadge = (start, end) => {
                      const count = countDaysInRange(start, end);
                      const maxDays = 6;
                      const pct = Math.round((count / maxDays) * 100);
                      const isHigh = count >= 5;
                      const isMid = count >= 3;
                      const isLow = count > 0;

                      return (
                        <div className="flex items-center gap-2.5 whitespace-nowrap">
                          <span
                            className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap border inline-flex items-center gap-1.5 shadow-2xs ${
                              isHigh
                                ? 'bg-[#FFF0EB] text-[#FF5E3A] border-[#FFD5C5]'
                                : isMid
                                ? 'bg-orange-50 text-orange-800 border-orange-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <span>{count} / {maxDays}</span>
                            <span className="text-[10px] font-semibold opacity-70">Days</span>
                          </span>
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden shrink-0 hidden md:block">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isHigh ? 'bg-[#FF5E3A]' : isMid ? 'bg-orange-400' : isLow ? 'bg-amber-400' : 'bg-slate-200'
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    };

                    return (
                      <tr key={s._id} className="hover:bg-[#FFF0EB]/30 transition group">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono">
                            {s.rollNumber || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-[#FF5E3A] font-black text-xs flex items-center justify-center shadow-xs shrink-0 border border-slate-800">
                              {s.name?.[0] || 'S'}
                            </div>
                            <div>
                              <div className="font-extrabold text-[#0F172A] group-hover:text-[#FF5E3A] transition-colors">
                                {s.name}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                ID: {s.studentId || 'STU-000'} &bull; {selectedClass}-{selectedSection}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">{renderWeekBadge(1, 7)}</td>
                        <td className="py-3.5 px-4">{renderWeekBadge(8, 14)}</td>
                        <td className="py-3.5 px-4">{renderWeekBadge(15, 21)}</td>
                        <td className="py-3.5 px-4">{renderWeekBadge(22, 28)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 shadow-2xs border ${
                              item.percentage >= 90
                                ? 'bg-[#FFF0EB] text-[#FF5E3A] border-[#FFD5C5]'
                                : item.percentage >= 75
                                ? 'bg-orange-50 text-orange-800 border-orange-200'
                                : 'bg-slate-900 text-white border-black'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.percentage >= 90 ? 'bg-[#FF5E3A]' : item.percentage >= 75 ? 'bg-orange-500' : 'bg-white'
                            }`} />
                            {item.percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TAB 2: MONTHLY ATTENDANCE GRID / MATRIX               */}
      {/* ======================================================== */}
      {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Controls Bar for Month & Class */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A]"
                >
                  {(classesList.length > 0 ? classesList : ALL_CLASSES).map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A]"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A]"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A]"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            {/* Class Average Badge */}
            {monthlyData && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Class Average</span>
                  <span className="text-lg font-black text-[#FF5E3A]">{monthlyData.classAverage}%</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#FFF0EB] border border-[#FFD5C5] flex items-center justify-center font-bold text-[#FF5E3A]">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            )}
          </div>

          {/* Monthly Attendance Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loadingMonthly ? (
              <div className="p-8">
                <Loader message="Compiling monthly attendance calendar matrix..." />
              </div>
            ) : !monthlyData || monthlyData.students?.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No monthly attendance records found for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 w-12 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Roll</th>
                      <th className="py-3 px-3 min-w-[140px] sticky left-12 bg-slate-50 z-10 border-r border-slate-200">Student Name</th>
                      {Array.from({ length: monthlyData.daysInMonth }, (_, i) => i + 1).map((day) => (
                        <th key={day} className="py-2.5 px-1.5 text-center min-w-[26px] font-mono">
                          {day}
                        </th>
                      ))}
                      <th className="py-3 px-2 text-center font-bold text-[#FF5E3A] bg-[#FFF0EB]">P</th>
                      <th className="py-3 px-2 text-center font-bold text-amber-700 bg-amber-50/50">L</th>
                      <th className="py-3 px-2 text-center font-bold text-slate-700 bg-slate-100">LV</th>
                      <th className="py-3 px-2 text-center font-bold text-white bg-[#0F172A]">A</th>
                      <th className="py-3 px-3 text-center font-extrabold text-slate-900 bg-slate-100">Student %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {monthlyData.students.map((item) => {
                      const s = item.student;
                      return (
                        <tr key={s._id} className="hover:bg-[#FFF0EB]/30 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200">
                            {s.rollNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 sticky left-12 bg-white z-10 border-r border-slate-200 truncate max-w-[140px]">
                            {s.name}
                          </td>
                          {Array.from({ length: monthlyData.daysInMonth }, (_, i) => i + 1).map((day) => {
                            const dayRecord = item.days[day];
                            const status = dayRecord?.status;
                            return (
                              <td key={day} className="py-2 px-1 text-center">
                                {status === 'Present' ? (
                                  <span className="inline-block w-5 h-5 leading-5 rounded text-[10px] font-black bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]">P</span>
                                ) : status === 'Late' ? (
                                  <span className="inline-block w-5 h-5 leading-5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">L</span>
                                ) : status === 'Leave' ? (
                                  <span className="inline-block w-5 h-5 leading-5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">LV</span>
                                ) : status === 'Absent' ? (
                                  <span className="inline-block w-5 h-5 leading-5 rounded text-[10px] font-black bg-[#0F172A] text-white">A</span>
                                ) : (
                                  <span className="text-slate-300">&bull;</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-2 text-center font-bold text-[#FF5E3A] bg-[#FFF0EB]/40">{item.presentCount}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-amber-700 bg-amber-50/30">{item.lateCount}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-700 bg-slate-100/50">{item.leaveCount}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-900 bg-slate-100/30">{item.absentCount}</td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900 bg-slate-50">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                item.percentage >= 90
                                  ? 'bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]'
                                  : item.percentage >= 75
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-[#0F172A] text-white'
                              }`}
                            >
                              {item.percentage}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: SEPARATE STUDENT ATTENDANCE TABLE                   */}
      {/* ======================================================== */}
      {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && activeTab === 'individual' && (
        <div className="space-y-6">
          {/* Executive Student Selector & Period Control Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Target Class & Section Group */}
              <div className="flex items-center gap-2 bg-slate-50/90 p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 px-1.5">
                  <GraduationCap className="w-4 h-4 text-[#FF5E3A]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Division:</span>
                </div>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 shadow-2xs"
                >
                  {(classesList.length > 0 ? classesList : ALL_CLASSES).map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 shadow-2xs"
                >
                  <option value="A">Sec A</option>
                  <option value="B">Sec B</option>
                  <option value="C">Sec C</option>
                </select>
              </div>

              {/* Student Focus Selector */}
              <div className="flex items-center gap-2 bg-slate-50/90 p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 px-1.5">
                  <UserCheck className="w-4 h-4 text-[#FF5E3A]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Student:</span>
                </div>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    fetchIndividualStudentHistory(e.target.value);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 shadow-2xs min-w-[210px]"
                >
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} (Roll: {s.rollNumber || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calendar Period Selector Group */}
            <div className="flex items-center gap-2 bg-slate-50/90 p-2 rounded-xl border border-slate-200/80 shadow-2xs self-start lg:self-auto">
              <div className="flex items-center gap-1.5 px-1.5">
                <CalendarIcon className="w-4 h-4 text-[#FF5E3A]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Period:</span>
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 shadow-2xs"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 shadow-2xs"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>

          {loadingStudentHistory || !studentHistory ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Loader message="Loading separate student attendance table & monthly calculations..." />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Identity & Automated Monthly Calculations Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#FF5E3A] text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
                    {studentHistory.student.name?.[0] || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5] text-[10px] font-black uppercase tracking-wider">
                        Enrolled Student
                      </span>
                      <span className="text-xs text-slate-300">&bull; Separate Attendance Ledger</span>
                    </div>
                    <h2 className="text-xl font-black text-white">{studentHistory.student.name}</h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Roll Number: <strong>{studentHistory.student.rollNumber || 'N/A'}</strong> &bull; Class: <strong>{studentHistory.student.classGrade} - {studentHistory.student.section}</strong> &bull; Student ID: <strong>{studentHistory.student.studentId}</strong>
                    </p>
                  </div>
                </div>

                {/* Automated Monthly Calculations Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 p-4 rounded-xl border border-white/10 text-center">
                  <div>
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Working Days</div>
                    <div className="text-xl font-black text-white mt-0.5">{studentHistory.summary.totalWorkingDays}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-orange-200 uppercase tracking-wider">Present Days</div>
                    <div className="text-xl font-black text-[#FF5E3A] mt-0.5">{studentHistory.summary.presentCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Absent Days</div>
                    <div className="text-xl font-black text-white mt-0.5">{studentHistory.summary.absentCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-orange-200 uppercase tracking-wider">Monthly Score</div>
                    <div className="text-xl font-black text-[#FF5E3A] mt-0.5">{studentHistory.summary.attendancePercentage}%</div>
                  </div>
                </div>
              </div>

              {/* Weekly Summary Cards for this Student */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(studentHistory.weeklySummary || []).map((w, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
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
                      <div className="h-full bg-gradient-to-r from-orange-400 via-[#FF5E3A] to-[#E04826] rounded-full" style={{ width: `${w.attendanceRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Separate Individual Attendance Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#FF5E3A]" />
                    <span>Daily Attendance Log Table for {studentHistory.student.name}</span>
                  </h3>
                  <span className="text-xs text-slate-600 font-semibold bg-[#FFF0EB] px-3 py-1 rounded-xl border border-[#FFD5C5]">
                    Monthly Calculation: <strong>{studentHistory.summary.presentCount}</strong> / {studentHistory.summary.totalWorkingDays} Working Days ({studentHistory.summary.attendancePercentage}%)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-[#FF5E3A] bg-[#0F172A] text-[11px] font-extrabold uppercase tracking-wider text-white">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Day</th>
                        <th className="py-3 px-4">Attendance Status</th>
                        <th className="py-3 px-4">Check-In Time</th>
                        <th className="py-3 px-4">Check-Out Time</th>
                        <th className="py-3 px-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(studentHistory.dailyRecords || []).map((r, idx) => (
                        <tr key={idx} className={r.isWeekend ? 'bg-slate-50/50 text-slate-400' : 'hover:bg-[#FFF0EB]/30 transition'}>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">{r.date}</td>
                          <td className="py-3 px-4 font-medium text-slate-600">{r.dayName}</td>
                          <td className="py-3 px-4">
                            {r.isWeekend ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                Weekend
                              </span>
                            ) : r.status === 'Present' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]">
                                Present
                              </span>
                            ) : r.status === 'Late' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Late
                              </span>
                            ) : r.status === 'Leave' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                Leave
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F172A] text-white border border-black">
                                Absent
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{r.checkInTime}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{r.checkOutTime}</td>
                          <td className="py-3 px-4 text-slate-500">{r.remarks || '-'}</td>
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

      {/* ======================================================== */}
      {/* 5. TAB 3: ATTENDANCE REPORT & PERCENTAGE ANALYTICS       */}
      {/* ======================================================== */}
      {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && activeTab === 'report' && (
        <div className="space-y-6">
          {/* Controls Bar for Report Scope */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class Filter</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A]"
                >
                  {(classesList.length > 0 ? classesList : ALL_CLASSES).map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A]"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Report Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A]"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input for Student Name */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={reportSearch}
                pattern={SECURITY_PATTERNS.search.pattern}
                title={SECURITY_PATTERNS.search.title}
                maxLength={100}
                onChange={(e) => setReportSearch(sanitizeInputText(e.target.value))}
                placeholder="Search student or roll..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF5E3A] focus:ring-1 focus:ring-[#FF5E3A] shadow-xs"
              />
            </div>
          </div>

          {/* Section A: Class-Wise Percentage Comparison */}
          {reportData && reportData.classWiseStats && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#FF5E3A]" />
                    <span>Class-Wise Attendance Percentage Comparison</span>
                  </h3>
                  <p className="text-xs text-slate-500">Benchmark attendance performance across all school divisions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {reportData.classWiseStats.map((cls) => (
                  <div
                    key={cls.classGrade}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#FFD5C5] transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">{cls.classGrade}</span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          cls.percentage >= 95
                            ? 'bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]'
                            : cls.percentage >= 85
                            ? 'bg-orange-50 text-orange-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {cls.percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 via-[#FF5E3A] to-[#E04826] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, cls.percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{cls.totalStudents} Enrolled</span>
                      <span>{cls.present} Present Days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section B: Student-Wise Attendance Percentage List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#FF5E3A]" />
                  <span>Student-Wise Attendance Percentage Ledger</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed individual attendance standings for {selectedClass} - {selectedSection}
                </p>
              </div>
            </div>

            {loadingReport ? (
              <div className="p-8">
                <Loader message="Compiling student-wise attendance analysis..." />
              </div>
            ) : !reportData || reportData.studentWiseList?.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No students found matching this criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white border-b-2 border-[#FF5E3A]">
                    <tr>
                      <th className="py-3 px-4 w-14">Roll</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Class &amp; Sec</th>
                      <th className="py-3 px-3 text-center">Sessions</th>
                      <th className="py-3 px-3 text-center font-bold text-[#FF5E3A]">Present</th>
                      <th className="py-3 px-3 text-center font-bold text-amber-400">Late</th>
                      <th className="py-3 px-3 text-center font-bold text-slate-300">Leave</th>
                      <th className="py-3 px-3 text-center font-bold text-white">Absent</th>
                      <th className="py-3 px-4 text-center">Attendance %</th>
                      <th className="py-3 px-4 text-center">Standing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.studentWiseList
                      .filter((s) => {
                        if (!reportSearch.trim()) return true;
                        const term = reportSearch.toLowerCase();
                        return (
                          s.name.toLowerCase().includes(term) ||
                          s.rollNumber?.toLowerCase().includes(term) ||
                          s.studentId?.toLowerCase().includes(term)
                        );
                      })
                      .map((st) => (
                        <tr key={st._id} className="hover:bg-[#FFF0EB]/30 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{st.rollNumber}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">{st.name}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">
                            {st.classGrade} - {st.section}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">{st.totalSessions}</td>
                          <td className="py-3 px-3 text-center font-black text-[#FF5E3A]">{st.present}</td>
                          <td className="py-3 px-3 text-center font-bold text-amber-700">{st.late}</td>
                          <td className="py-3 px-3 text-center font-bold text-slate-600">{st.leave}</td>
                          <td className="py-3 px-3 text-center font-black text-[#0F172A]">{st.absent}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    st.percentage >= 90
                                      ? 'bg-gradient-to-r from-orange-400 via-[#FF5E3A] to-[#E04826]'
                                      : st.percentage >= 75
                                      ? 'bg-amber-500'
                                      : 'bg-slate-900'
                                  }`}
                                  style={{ width: `${Math.min(100, st.percentage)}%` }}
                                />
                              </div>
                              <span className="font-black text-xs text-slate-900">{st.percentage}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                st.percentage >= 95
                                  ? 'bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]'
                                  : st.percentage >= 85
                                  ? 'bg-orange-50 text-orange-800'
                                  : st.percentage >= 75
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-[#0F172A] text-white'
                              }`}
                            >
                              {st.percentage >= 95
                                ? 'Exemplary'
                                : st.percentage >= 85
                                ? 'Good'
                                : st.percentage >= 75
                                ? 'Needs Attention'
                                : 'Critical'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
