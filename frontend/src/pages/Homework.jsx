import React, { useState, useEffect } from 'react';
import { homeworkAPI, studentAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Modal } from '../components/Modal.jsx';
import { Loader } from '../components/Loader.jsx';
import { formatDate } from '../utils/formatters.js';
import {
  BookOpen,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  Upload,
  Award,
  Trash2,
  Paperclip,
  ExternalLink,
  UserCheck,
  Calendar,
  AlertCircle,
  Filter,
  Search,
  CheckCircle,
  Hourglass,
  Layers,
  ChevronRight
} from 'lucide-react';

export const Homework = () => {
  const { user, role, activeChild } = useAuth();
  const { showToast } = useSchool();

  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmissionsDrawerOpen, setIsSubmissionsDrawerOpen] = useState(false);
  const [selectedHw, setSelectedHw] = useState(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    title: '',
    subject: 'Mathematics',
    classGrade: 'Class 8',
    section: 'All',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    description: '',
    attachments: ''
  });

  const [submitText, setSubmitText] = useState('');
  const [submitFile, setSubmitFile] = useState('');
  const [gradingState, setGradingState] = useState({}); // { [submissionId]: { marks, remarks } }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMeta();
    fetchHomework();
  }, [role, activeChild]);

  const fetchMeta = async () => {
    try {
      const res = await studentAPI.getClassesMeta();
      if (res.success && res.data.classes) {
        setClassesList(res.data.classes);
      }
    } catch (err) {
      console.warn('Meta fetch error:', err);
    }
  };

  const fetchHomework = async () => {
    setLoading(true);
    try {
      const params = {};
      if (role === 'parent' && activeChild) {
        params.classGrade = activeChild.classGrade;
      }
      const res = await homeworkAPI.getAll(params);
      if (res.success) {
        setHomeworkList(res.data?.homework || []);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading Homework');
    } finally {
      setLoading(false);
    }
  };

  // Create Homework Handler
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...createForm,
        attachments: createForm.attachments.trim() ? [createForm.attachments.trim()] : []
      };

      const res = await homeworkAPI.create(payload);
      if (res.success) {
        showToast('Homework assigned and published successfully', 'success', 'Created');
        setIsCreateModalOpen(false);
        setCreateForm({
          title: '',
          subject: 'Mathematics',
          classGrade: 'Class 8',
          section: 'All',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          description: '',
          attachments: ''
        });
        fetchHomework();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Creation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Student Turn In Handler
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!selectedHw) return;
    setSubmitting(true);
    try {
      const res = await homeworkAPI.submit(selectedHw._id, {
        textSubmission: submitText,
        fileUrl: submitFile
      });
      if (res.success) {
        showToast('Homework submitted successfully to instructor', 'success', 'Turned In');
        setIsSubmitModalOpen(false);
        setSubmitText('');
        setSubmitFile('');
        fetchHomework();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Teacher Grade Submission Handler
  const handleGradeSubmission = async (submissionId) => {
    if (!selectedHw) return;
    const gradeData = gradingState[submissionId] || {};
    try {
      const res = await homeworkAPI.grade(selectedHw._id, {
        submissionId,
        marks: Number(gradeData.marks || 0),
        teacherRemarks: gradeData.remarks || '',
        status: 'Reviewed'
      });
      if (res.success) {
        showToast('Submission graded and marks saved', 'success', 'Evaluated');
        fetchHomework();
        // Update local modal data
        setSelectedHw(res.data);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Grading Failed');
    }
  };

  // Delete Homework Handler
  const handleDeleteHomework = async (id) => {
    if (!window.confirm('Are you sure you want to delete this homework assignment?')) return;
    try {
      const res = await homeworkAPI.delete(id);
      if (res.success) {
        showToast('Homework assignment removed', 'success', 'Deleted');
        fetchHomework();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Delete Failed');
    }
  };

  // Target student for student or parent role
  const targetStudentId = role === 'parent' ? activeChild?._id : (role === 'student' ? user?._id : null);

  // Helper to find submission for student or parent's active child
  const getStudentSub = (hw) => {
    if (!targetStudentId) return null;
    return hw.submissions?.find((s) => {
      const sId = s.studentId?._id || s.studentId;
      return sId === targetStudentId || (activeChild?.studentId && s.studentId?.studentId === activeChild?.studentId);
    });
  };

  // Unique subjects list for filter
  const subjectsList = Array.from(new Set(homeworkList.map((h) => h.subject))).filter(Boolean);

  // Filtered homework list
  const filteredHomework = homeworkList.filter((hw) => {
    // 1. Status Filter (Pending / Completed)
    const isPastDue = new Date() > new Date(hw.dueDate);
    const hasSubmissions = (hw.submissions?.length || 0) > 0;
    const isCompleted = hasSubmissions && hw.submissions.every((s) => s.status === 'Reviewed');

    if (statusFilter === 'pending') {
      if (['student', 'parent'].includes(role)) {
        const studentSub = getStudentSub(hw);
        if (studentSub) return false; // Already submitted
      } else {
        if (isCompleted) return false;
      }
    } else if (statusFilter === 'completed') {
      if (['student', 'parent'].includes(role)) {
        const studentSub = getStudentSub(hw);
        if (!studentSub) return false;
      } else {
        if (!isCompleted && !isPastDue) return false;
      }
    }

    // 2. Class Filter
    if (selectedClass !== 'All' && hw.classGrade !== selectedClass) return false;

    // 3. Subject Filter
    if (selectedSubject !== 'All' && hw.subject !== selectedSubject) return false;

    // 4. Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = hw.title.toLowerCase().includes(term);
      const matchDesc = hw.description.toLowerCase().includes(term);
      const matchSubject = hw.subject.toLowerCase().includes(term);
      const matchTeacher = hw.teacherId?.name?.toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchSubject && !matchTeacher) return false;
    }

    return true;
  });

  // Calculate Summary Statistics
  const totalCount = homeworkList.length;
  const totalSubjectsCount = subjectsList.length;
  const childSubmittedCount = ['student', 'parent'].includes(role)
    ? homeworkList.filter((h) => getStudentSub(h) != null).length
    : 0;
  const childPendingCount = ['student', 'parent'].includes(role)
    ? homeworkList.filter((h) => getStudentSub(h) == null).length
    : homeworkList.filter((h) => new Date(h.dueDate) >= new Date()).length;

  const totalSubmissions = homeworkList.reduce((acc, h) => acc + (h.submissions?.length || 0), 0);
  const reviewedCount = homeworkList.reduce(
    (acc, h) => acc + (h.submissions?.filter((s) => s.status === 'Reviewed').length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & ASSIGN BUTTON                            */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[#FF5E3A]" />
            <span>Homework & Coursework Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {role === 'parent'
              ? `Viewing active curriculum assignments, subject counts, and submission progress for ${activeChild?.name || 'child'}.`
              : 'Issue assignments, specify curriculum deadlines, track student submissions, and evaluate answers.'}
          </p>
        </div>

        {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5E3A] to-[#E04826] hover:from-[#E04826] hover:to-[#C84222] text-white font-bold text-xs rounded-xl shadow-md shadow-[#FF5E3A]/25 transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Homework</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. KPI SUMMARY STRIP (PARENT & TEACHER ADAPTIVE)         */}
      {/* ======================================================== */}
      {['parent', 'student'].includes(role) ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Card 1: Total Subjects */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FFF0EB] border border-[#FFD5C5] text-[#FF5E3A] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Subjects</span>
              <span className="text-xl font-black text-slate-900">{totalSubjectsCount}</span>
            </div>
          </div>

          {/* Card 2: Total Homework Tasks */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Coursework</span>
              <span className="text-xl font-black text-slate-900">{totalCount}</span>
            </div>
          </div>

          {/* Card 3: Pending Submissions */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0F172A] border border-black text-[#FF5E3A] flex items-center justify-center font-bold">
              <Hourglass className="w-5 h-5 text-[#FF5E3A]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending to Submit</span>
              <span className="text-xl font-black text-[#FF5E3A]">{childPendingCount}</span>
            </div>
          </div>

          {/* Card 4: Turned In / Submitted */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FFF0EB] border border-[#FFD5C5] text-[#FF5E3A] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-[#FF5E3A]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Turned In / Done</span>
              <span className="text-xl font-black text-slate-900">{childSubmittedCount}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FFF0EB] border border-[#FFD5C5] text-[#FF5E3A] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Coursework</span>
              <span className="text-xl font-black text-slate-900">{totalCount}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0F172A] border border-black text-[#FF5E3A] flex items-center justify-center font-bold">
              <Hourglass className="w-5 h-5 text-[#FF5E3A]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active / Pending</span>
              <span className="text-xl font-black text-[#FF5E3A]">{childPendingCount}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Submissions Received</span>
              <span className="text-xl font-black text-slate-900">{totalSubmissions}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FFF0EB] border border-[#FFD5C5] text-[#FF5E3A] flex items-center justify-center font-bold">
              <Award className="w-5 h-5 text-[#FF5E3A]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Graded &amp; Reviewed</span>
              <span className="text-xl font-black text-[#FF5E3A]">{reviewedCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. FILTERS BAR (Pending / Completed, Class, Subject)     */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Pending / Completed Status Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Tasks
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-[#FF5E3A] text-white shadow-xs'
                : 'bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5] hover:bg-[#FFE5DC]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed / Turned In</span>
          </button>
        </div>

        {/* Dropdown Filters & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
          >
            <option value="All">All Classes</option>
            {(classesList.length > 0 ? classesList : ['Class 10', 'Class 8', 'Class 5', 'Class 2']).map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
          >
            <option value="All">All Subjects ({subjectsList.length})</option>
            {subjectsList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search homework..."
              pattern="^[^<>$]{1,100}$"
              title="Search query must not contain script tags or injection symbols (<, >, $)."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. HOMEWORK CARDS GRID                                   */}
      {/* ======================================================== */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader message="Loading coursework catalog..." />
        </div>
      ) : filteredHomework.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No homework found</h3>
          <p className="text-xs text-slate-500">No assignments match your selected status and class filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredHomework.map((hw) => {
            const isPastDue = new Date() > new Date(hw.dueDate);
            const totalSubs = hw.submissions?.length || 0;
            const reviewedSubs = hw.submissions?.filter((s) => s.status === 'Reviewed').length || 0;

            // Student / Parent submission state
            const studentSub = ['student', 'parent'].includes(role) ? getStudentSub(hw) : null;

            return (
              <div
                key={hw._id}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-[#FF5E3A] shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]">
                      {hw.subject} &bull; {hw.classGrade} ({hw.section})
                    </span>

                    {/* Due Date Indicator */}
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                        isPastDue
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isPastDue ? 'Overdue' : 'Due'}: {formatDate(hw.dueDate)}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-[#FF5E3A] transition mb-2">
                    {hw.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                    {hw.description}
                  </p>

                  {/* Assigned By Teacher Info */}
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-4">
                    <div className="w-7 h-7 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {hw.teacherId?.name?.[0] || 'T'}
                    </div>
                    <div className="truncate">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned By Teacher</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {hw.teacherId?.name || 'Academic Faculty'}
                      </span>
                    </div>
                  </div>

                  {/* Attachment Resource Links */}
                  {hw.attachments?.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      {hw.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.startsWith('http') ? att : `http://${att}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FFF0EB] hover:bg-[#FFE5DC] border border-[#FFD5C5] text-xs font-semibold text-[#FF5E3A] transition"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-[#FF5E3A]" />
                          <span className="truncate max-w-[260px]">{att}</span>
                          <ExternalLink className="w-3 h-3 text-[#FF5E3A] shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions & Status */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {/* Status Indicator */}
                  <div>
                    {['student', 'parent'].includes(role) ? (
                      studentSub ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5] text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5E3A]" />
                            <span>{role === 'parent' ? 'Child Submitted' : 'Submitted'}</span>
                          </span>
                          {studentSub.marks !== null && (
                            <span className="text-xs font-bold text-white bg-[#0F172A] px-2.5 py-0.5 rounded-full border border-black font-mono">
                              Score: {studentSub.marks}/100
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#0F172A] text-white border border-slate-800">
                          <Hourglass className="w-3 h-3 mr-1 text-[#FF5E3A]" />
                          <span>{role === 'parent' ? 'Child Pending — Not Yet Submitted' : 'Pending Submission'}</span>
                        </span>
                      )
                    ) : (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-800">{totalSubs} Submissions</span>
                        {totalSubs > 0 && (
                          <span className="text-[11px] text-slate-400">
                            ({reviewedSubs} Evaluated)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Student Turn In Button */}
                    {role === 'student' && (
                      <button
                        onClick={() => {
                          setSelectedHw(hw);
                          setSubmitText(studentSub?.textSubmission || '');
                          setSubmitFile(studentSub?.fileUrl || '');
                          setIsSubmitModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#FF5E3A] hover:bg-[#E04826] text-white font-bold text-xs shadow-md shadow-[#FF5E3A]/25 transition cursor-pointer"
                      >
                        {studentSub ? 'Update Work' : 'Turn In Work'}
                      </button>
                    )}

                    {/* Parent View Submission Button */}
                    {role === 'parent' && studentSub && (
                      <button
                        onClick={() => {
                          setSelectedHw(hw);
                          setSubmitText(studentSub?.textSubmission || '');
                          setSubmitFile(studentSub?.fileUrl || '');
                          setIsSubmitModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#FFF0EB] text-slate-800 hover:text-[#FF5E3A] font-bold text-xs border border-slate-200 transition cursor-pointer"
                      >
                        View Solution
                      </button>
                    )}

                    {/* Teacher/Admin Review Submissions Button */}
                    {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedHw(hw);
                            // Populate grading state from submissions
                            const state = {};
                            hw.submissions?.forEach((s) => {
                              state[s._id] = { marks: s.marks || '', remarks: s.teacherRemarks || '' };
                            });
                            setGradingState(state);
                            setIsSubmissionsDrawerOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          Review Submissions ({totalSubs})
                        </button>

                        <button
                          onClick={() => handleDeleteHomework(hw._id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                          title="Delete Homework"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. CREATE HOMEWORK MODAL                                 */}
      {/* ======================================================== */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Assign New Coursework">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Class *
              </label>
              <select
                value={createForm.classGrade}
                onChange={(e) => setCreateForm({ ...createForm, classGrade: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
              >
                {(classesList.length > 0 ? classesList : ['Class 10', 'Class 8', 'Class 5', 'Class 2']).map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Section
              </label>
              <select
                value={createForm.section}
                onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
              >
                <option value="All">All Sections (Entire Class)</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                required
                value={createForm.subject}
                pattern="^[a-zA-Z0-9\s.,'\-]{2,80}$"
                title="Subject must be 2 to 80 characters without script or HTML tags."
                maxLength={80}
                onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value.replace(/[<>$\0]/g, '') })}
                placeholder="e.g. Mathematics, Science, English"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Submission Due Date *
              </label>
              <input
                type="date"
                required
                value={createForm.dueDate}
                onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Homework Title *
            </label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="e.g. Linear Algebra & Matrix Eigenvalues Problem Set"
              pattern="^[^<>]{2,150}$"
              title="Title must be 2 to 150 characters without HTML brackets (< >)."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Instructions & Description *
            </label>
            <textarea
              required
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Provide detailed questions, required steps, reading references, and grading criteria..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Resource Attachment (Drive URL or Worksheet Link)
            </label>
            <div className="relative">
              <Paperclip className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={createForm.attachments}
                onChange={(e) => setCreateForm({ ...createForm, attachments: e.target.value })}
                placeholder="https://drive.google.com/... or resource file link"
                pattern="https?://.+"
                title="Attachment link must be a valid http:// or https:// URL."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#FF5E3A] hover:bg-[#E04826] text-white rounded-xl text-xs font-bold shadow-md shadow-[#FF5E3A]/25 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Assign Homework'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 6. STUDENT SUBMISSION MODAL                              */}
      {/* ======================================================== */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} title="Turn In Homework Assignment">
        <form onSubmit={handleSubmitWork} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-[10px] font-bold uppercase text-[#FF5E3A] tracking-wider">
              {selectedHw?.subject} &bull; {selectedHw?.classGrade}
            </span>
            <h4 className="font-extrabold text-sm text-slate-900 mt-1">{selectedHw?.title}</h4>
            <p className="text-slate-600 mt-1.5 leading-relaxed">{selectedHw?.description}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Your Written Solution / Working *
            </label>
            <textarea
              rows={4}
              required
              value={submitText}
              onChange={(e) => setSubmitText(e.target.value)}
              placeholder="Paste answers, mathematical working, essay draft, or notes..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Attachment Link (Google Drive / PDF / Image URL)
            </label>
            <input
              type="url"
              value={submitFile}
              onChange={(e) => setSubmitFile(e.target.value)}
              placeholder="https://drive.google.com/..."
              pattern="https?://.+"
              title="Submission link must be a valid http:// or https:// URL."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#FF5E3A] hover:bg-[#E04826] text-white rounded-xl text-xs font-bold shadow-md shadow-[#FF5E3A]/25 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Turn In Solution'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 7. TEACHER SUBMISSIONS REVIEW & GRADING MODAL            */}
      {/* ======================================================== */}
      <Modal
        isOpen={isSubmissionsDrawerOpen}
        onClose={() => setIsSubmissionsDrawerOpen(false)}
        title={`Submissions & Grading: ${selectedHw?.title || 'Homework'}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
            <div>
              <span className="font-extrabold text-slate-900">{selectedHw?.subject} ({selectedHw?.classGrade})</span>
              <span className="text-slate-400 mx-1.5">&bull;</span>
              <span className="text-slate-600">Due: {formatDate(selectedHw?.dueDate)}</span>
            </div>
            <span className="font-bold text-[#FF5E3A] bg-[#FFF0EB] px-2.5 py-0.5 rounded-full border border-[#FFD5C5]">
              {selectedHw?.submissions?.length || 0} Total Submissions Received
            </span>
          </div>

          {selectedHw?.submissions?.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No students have turned in this assignment yet.
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {selectedHw?.submissions?.map((sub) => {
                const sId = sub._id;
                const student = sub.studentId;
                const state = gradingState[sId] || { marks: sub.marks || '', remarks: sub.teacherRemarks || '' };

                return (
                  <div
                    key={sId}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#FF5E3A] shadow-xs transition space-y-3"
                  >
                    {/* Student Info & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-800">
                          {student?.profileImage ? (
                            <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            student?.name?.[0] || 'S'
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">
                            {student?.name || 'Enrolled Student'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Roll #{student?.rollNumber || 'N/A'} &bull; Submitted: {formatDate(sub.submittedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={sub.status} />
                        {sub.marks !== null && (
                          <span className="text-xs font-black text-white bg-[#0F172A] px-2.5 py-0.5 rounded-full border border-black font-mono">
                            Score: {sub.marks}/100
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Student Solution Text */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Student Answer</span>
                      <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {sub.textSubmission || 'No written solution provided.'}
                      </p>
                      {sub.fileUrl && (
                        <a
                          href={sub.fileUrl.startsWith('http') ? sub.fileUrl : `http://${sub.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5E3A] hover:text-[#E04826] underline"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Open Student Document Attachment &rarr;</span>
                        </a>
                      )}
                    </div>

                    {/* Teacher Grading Inputs */}
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Marks (0-100)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={state.marks}
                          onChange={(e) =>
                            setGradingState({
                              ...gradingState,
                              [sId]: { ...state, marks: e.target.value }
                            })
                          }
                          placeholder="e.g. 95"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF5E3A]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Feedback Remarks
                        </label>
                        <input
                          type="text"
                          value={state.remarks}
                          pattern="^[^<>]{0,120}$"
                          title="Remarks must not contain HTML tags (< >)."
                          maxLength={120}
                          onChange={(e) =>
                            setGradingState({
                              ...gradingState,
                              [sId]: { ...state, remarks: e.target.value.replace(/[<>$\0]/g, '') }
                            })
                          }
                          placeholder="Accurate mathematical working..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FF5E3A]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGradeSubmission(sId)}
                        className="w-full px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Save Evaluation
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubmissionsDrawerOpen(false)}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
