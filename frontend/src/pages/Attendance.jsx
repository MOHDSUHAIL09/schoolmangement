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
  AlertCircle
} from 'lucide-react';

export const Attendance = () => {
  const { role, activeChild } = useAuth();
  const { showToast } = useSchool();

  // Navigation Tabs: 'daily' | 'monthly' | 'report'
  const [activeTab, setActiveTab] = useState('daily');

  // Filters
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedClass, setSelectedClass] = useState('Class 8');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [classesList, setClassesList] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Monthly Matrix State
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // Report State
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportSearch, setReportSearch] = useState('');

  // Student/Parent specific history
  const [mySummary, setMySummary] = useState(null);
  const [myHistory, setMyHistory] = useState([]);

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
    if (['super_admin', 'principal', 'teacher'].includes(role)) {
      if (activeTab === 'daily') {
        fetchClassAttendance();
      } else if (activeTab === 'monthly') {
        fetchMonthlyRegister();
      } else if (activeTab === 'report') {
        fetchAttendanceReport();
      }
    } else if (role === 'parent' && activeChild) {
      fetchStudentHistory(activeChild._id);
    } else if (role === 'student') {
      fetchStudentHistory('me');
    }
  }, [selectedClass, selectedSection, date, selectedMonth, selectedYear, activeTab, role, activeChild]);

  const fetchMeta = async () => {
    try {
      const res = await studentAPI.getClassesMeta();
      if (res.success && res.data.classes) {
        setClassesList(res.data.classes);
        if (res.data.classes.length > 0 && !res.data.classes.includes(selectedClass)) {
          setSelectedClass(res.data.classes[0]);
        }
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

  const fetchStudentHistory = async (studentId) => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getStudentSummary(studentId, {
        month: selectedMonth,
        year: selectedYear
      });
      if (res.success) {
        setMySummary(res.data.summary);
        setMyHistory(res.data.records || []);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading History');
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

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & NAVIGATION TABS                          */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-cyan-600" />
            <span>Attendance Management Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage daily registers, track monthly attendance calendars, and evaluate student & class-wise percentages.
          </p>
        </div>

        {/* Action Controls for Staff */}
        {['super_admin', 'principal', 'teacher'].includes(role) && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            {activeTab === 'daily' && (
              <button
                onClick={handleSaveAttendance}
                disabled={saving || students.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/25 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Attendance Register'}</span>
              </button>
            )}

            {activeTab === 'report' && (
              <>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={handleExportReport}
                  className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Spreadsheet (.XLSX)</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. TAB SWITCHER (Daily | Monthly | Report)               */}
      {/* ======================================================== */}
      {['super_admin', 'principal', 'teacher'].includes(role) && (
        <div className="flex items-center border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-3 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'daily'
                ? 'border-cyan-600 text-cyan-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Daily Attendance Register</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`pb-3 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'monthly'
                ? 'border-cyan-600 text-cyan-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Monthly Attendance Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`pb-3 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'report'
                ? 'border-cyan-600 text-cyan-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Class & Student Percentage Reports</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB 1: DAILY ATTENDANCE REGISTER                      */}
      {/* ======================================================== */}
      {['super_admin', 'principal', 'teacher'].includes(role) && activeTab === 'daily' && (
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
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 shadow-xs"
                >
                  {(classesList.length > 0 ? classesList : ['Class 10', 'Class 8', 'Class 5', 'Class 2']).map((cls) => (
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
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 shadow-xs"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            {/* Quick Bulk Marking Actions */}
            <div className="flex flex-wrap items-center gap-2 self-end">
              <span className="text-xs text-slate-400 font-medium mr-1">Quick Set:</span>
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-xs"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Late')}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition shadow-xs"
              >
                All Late
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Leave')}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 transition shadow-xs"
              >
                All Leave
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition shadow-xs"
              >
                All Absent
              </button>
            </div>
          </div>

          {/* Daily Quick Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Enrolled</span>
              <div className="text-lg font-black text-slate-900 mt-0.5">{dailyTotal}</div>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-xs text-center bg-emerald-50/20">
              <span className="text-[10px] uppercase font-bold text-emerald-700">Present</span>
              <div className="text-lg font-black text-emerald-700 mt-0.5">{dailyPresent}</div>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-xs text-center bg-amber-50/20">
              <span className="text-[10px] uppercase font-bold text-amber-700">Late</span>
              <div className="text-lg font-black text-amber-700 mt-0.5">{dailyLate}</div>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-cyan-200 shadow-xs text-center bg-cyan-50/20">
              <span className="text-[10px] uppercase font-bold text-cyan-700">On Leave</span>
              <div className="text-lg font-black text-cyan-700 mt-0.5">{dailyLeave}</div>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-red-200 shadow-xs text-center bg-red-50/20">
              <span className="text-[10px] uppercase font-bold text-red-700">Absent</span>
              <div className="text-lg font-black text-red-700 mt-0.5">{dailyAbsent}</div>
            </div>
            <div className="bg-white rounded-xl p-3.5 border border-cyan-200 shadow-xs text-center bg-gradient-to-r from-cyan-50 to-teal-50">
              <span className="text-[10px] uppercase font-bold text-cyan-800">Attendance Rate</span>
              <div className="text-lg font-black text-cyan-900 mt-0.5">{dailyPercentage}%</div>
            </div>
          </div>

          {/* Student Roster Register Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8">
                <Loader message="Loading class attendance roster..." />
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No students enrolled in {selectedClass} - {selectedSection}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 w-16">Roll</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Admission #</th>
                      <th className="py-3.5 px-4 text-center">Attendance Status</th>
                      <th className="py-3.5 px-4">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => {
                      const currentStatus = attendanceRecords[student._id] || 'Present';
                      return (
                        <tr key={student._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{student.rollNumber}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-700">
                                {student.profileImage ? (
                                  <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                  student.name?.[0]
                                )}
                              </div>
                              <span className="font-bold text-slate-900">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{student.admissionNumber}</td>
                          <td className="py-3.5 px-4">
                            {/* 4 Status Buttons: Present, Late, Absent, Leave */}
                            <div className="flex items-center justify-center gap-1.5">
                              {[
                                { key: 'Present', label: 'Present', activeColor: 'bg-emerald-600 text-white' },
                                { key: 'Late', label: 'Late', activeColor: 'bg-amber-600 text-white' },
                                { key: 'Leave', label: 'Leave', activeColor: 'bg-cyan-600 text-white' },
                                { key: 'Absent', label: 'Absent', activeColor: 'bg-red-600 text-white' }
                              ].map((st) => (
                                <button
                                  key={st.key}
                                  type="button"
                                  onClick={() => handleStatusChange(student._id, st.key)}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                    currentStatus === st.key
                                      ? `${st.activeColor} shadow-xs`
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              value={remarks[student._id] || ''}
                              pattern="^[^<>]{0,100}$"
                              title="Remark must not contain HTML tags (< >)."
                              maxLength={100}
                              onChange={(e) => setRemarks({ ...remarks, [student._id]: sanitizeInputText(e.target.value) })}
                              placeholder="Add remark..."
                              className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                            />
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
      {/* 4. TAB 2: MONTHLY ATTENDANCE GRID / MATRIX               */}
      {/* ======================================================== */}
      {['super_admin', 'principal', 'teacher'].includes(role) && activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Controls Bar for Month & Class */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-600"
                >
                  {(classesList.length > 0 ? classesList : ['Class 10', 'Class 8', 'Class 5', 'Class 2']).map((cls) => (
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
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-600"
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
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-600"
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
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-600"
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
                  <span className="text-lg font-black text-cyan-800">{monthlyData.classAverage}%</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center font-bold text-cyan-700">
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
                      <th className="py-3 px-2 text-center font-bold text-emerald-700 bg-emerald-50/50">P</th>
                      <th className="py-3 px-2 text-center font-bold text-amber-700 bg-amber-50/50">L</th>
                      <th className="py-3 px-2 text-center font-bold text-cyan-700 bg-cyan-50/50">LV</th>
                      <th className="py-3 px-2 text-center font-bold text-red-700 bg-red-50/50">A</th>
                      <th className="py-3 px-3 text-center font-extrabold text-slate-900 bg-slate-100">Student %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {monthlyData.students.map((item) => {
                      const s = item.student;
                      return (
                        <tr key={s._id} className="hover:bg-slate-50/80 transition">
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
                                  <span className="inline-block w-5 h-5 leading-5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">P</span>
                                ) : status === 'Late' ? (
                                  <span className="inline-block w-5 h-5 leading-5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">L</span>
                                ) : status === 'Leave' ? (
                                  <span className="inline-block w-5 h-5 leading-5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">LV</span>
                                ) : status === 'Absent' ? (
                                  <span className="inline-block w-5 h-5 leading-5 rounded text-[10px] font-bold bg-red-100 text-red-800">A</span>
                                ) : (
                                  <span className="text-slate-300">&bull;</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-2 text-center font-bold text-emerald-700 bg-emerald-50/30">{item.presentCount}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-amber-700 bg-amber-50/30">{item.lateCount}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-cyan-700 bg-cyan-50/30">{item.leaveCount}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-red-700 bg-red-50/30">{item.absentCount}</td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900 bg-slate-50">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                item.percentage >= 90
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.percentage >= 75
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
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
      {/* 5. TAB 3: ATTENDANCE REPORT & PERCENTAGE ANALYTICS       */}
      {/* ======================================================== */}
      {['super_admin', 'principal', 'teacher'].includes(role) && activeTab === 'report' && (
        <div className="space-y-6">
          {/* Controls Bar for Report Scope */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Class Filter</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-600"
                >
                  {(classesList.length > 0 ? classesList : ['Class 10', 'Class 8', 'Class 5', 'Class 2']).map((cls) => (
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
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-600"
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
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-cyan-600"
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
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-cyan-600 shadow-xs"
              />
            </div>
          </div>

          {/* Section A: Class-Wise Percentage Comparison */}
          {reportData && reportData.classWiseStats && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-600" />
                    <span>Class-Wise Attendance Percentage Comparison</span>
                  </h3>
                  <p className="text-xs text-slate-500">Benchmark attendance performance across all school divisions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {reportData.classWiseStats.map((cls) => (
                  <div
                    key={cls.classGrade}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-300 transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">{cls.classGrade}</span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          cls.percentage >= 95
                            ? 'bg-emerald-100 text-emerald-800'
                            : cls.percentage >= 85
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {cls.percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500"
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
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-600" />
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
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 w-14">Roll</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Class & Sec</th>
                      <th className="py-3 px-3 text-center">Sessions</th>
                      <th className="py-3 px-3 text-center font-bold text-emerald-700">Present</th>
                      <th className="py-3 px-3 text-center font-bold text-amber-700">Late</th>
                      <th className="py-3 px-3 text-center font-bold text-cyan-700">Leave</th>
                      <th className="py-3 px-3 text-center font-bold text-red-700">Absent</th>
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
                        <tr key={st._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{st.rollNumber}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">{st.name}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">
                            {st.classGrade} - {st.section}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">{st.totalSessions}</td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-700">{st.present}</td>
                          <td className="py-3 px-3 text-center font-bold text-amber-700">{st.late}</td>
                          <td className="py-3 px-3 text-center font-bold text-cyan-700">{st.leave}</td>
                          <td className="py-3 px-3 text-center font-bold text-red-700">{st.absent}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    st.percentage >= 90
                                      ? 'bg-emerald-500'
                                      : st.percentage >= 75
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
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
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : st.percentage >= 85
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : st.percentage >= 75
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
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

      {/* ======================================================== */}
      {/* 6. PARENT / STUDENT VIEW                                 */}
      {/* ======================================================== */}
      {(role === 'parent' || role === 'student') && (
        <div className="space-y-6">
          {mySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">Recorded Days</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{mySummary.totalDays}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs">
                <span className="text-xs text-emerald-700 font-medium">Days Present</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">{mySummary.presentDays}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs">
                <span className="text-xs text-amber-700 font-medium">Days Late</span>
                <div className="text-2xl font-black text-amber-700 mt-1">{mySummary.lateDays}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-cyan-200 bg-cyan-50/20 shadow-xs">
                <span className="text-xs text-cyan-700 font-medium">Authorized Leaves</span>
                <div className="text-2xl font-black text-cyan-700 mt-1">{mySummary.leaveDays || 0}</div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-cyan-300 bg-cyan-50 shadow-xs">
                <span className="text-xs text-cyan-800 font-bold">Attendance Rate</span>
                <div className="text-2xl font-black text-cyan-900 mt-1">{mySummary.percentage}%</div>
              </div>
            </div>
          )}

          {/* History Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>Chronological Attendance History</span>
              <span className="text-xs text-slate-500 font-medium">{myHistory.length} Days Recorded</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {myHistory.map((rec) => (
                <div key={rec._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <span className="font-bold text-slate-900">{formatDate(rec.date)}</span>
                    {rec.remarks && <p className="text-slate-500 text-[11px] mt-0.5">{rec.remarks}</p>}
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
