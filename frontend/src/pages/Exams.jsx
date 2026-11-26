import React, { useState, useEffect } from 'react';
import { examAPI, studentAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Modal } from '../components/Modal.jsx';
import { Loader } from '../components/Loader.jsx';
import { formatDate } from '../utils/formatters.js';
import { SECURITY_PATTERNS, sanitizeInputText } from '../utils/securityPatterns.js';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Clock,
  Award,
  Play,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Users,
  Calendar,
  Plus,
  Search,
  Filter,
  Printer,
  FileText,
  TrendingUp,
  AlertCircle,
  BarChart3,
  BookOpen,
  MapPin,
  Check,
  Save,
  Trash2,
  Trophy
} from 'lucide-react';

export const Exams = () => {
  const { user, role, activeChild } = useAuth();
  const { showToast } = useSchool();

  // Tab State: 'schedule' | 'marks' | 'results'
  const [activeTab, setActiveTab] = useState('schedule');

  // Exam Data
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [reportCardData, setReportCardData] = useState(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);

  // Create Exam Form
  const [createForm, setCreateForm] = useState({
    title: '',
    examType: 'Mid-Term',
    classGrade: 'Class 8',
    section: 'All',
    subject: 'Science',
    roomNo: 'Exam Hall 1',
    timeSlot: '09:00 AM - 11:30 AM',
    durationMinutes: 90,
    totalMarks: 100,
    passingMarks: 40,
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });
  const [creatingExam, setCreatingExam] = useState(false);

  // Marks Entry State
  const [selectedExamIdForMarks, setSelectedExamIdForMarks] = useState('');
  const [rosterStudents, setRosterStudents] = useState([]);
  const [marksEntries, setMarksEntries] = useState({}); // { [studentId]: { marksObtained, teacherRemarks } }
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  // Online Exam Taking Mode (Students)
  const [activeExam, setActiveExam] = useState(null);
  const [examDetail, setExamDetail] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examResult, setExamResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMeta();
    fetchExams();
  }, [role, activeChild]);

  // Exam Countdown Timer
  useEffect(() => {
    let timer;
    if (activeExam && timeLeft > 0 && !examResult) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeExam, timeLeft, examResult]);

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

  const fetchExams = async () => {
    setLoading(true);
    try {
      const params = {};
      if (role === 'parent' && activeChild) {
        params.classGrade = activeChild.classGrade;
      }
      const res = await examAPI.getAll(params);
      if (res.success) {
        const fetchedExams = res.data?.exams || [];
        setExams(fetchedExams);
        if (fetchedExams.length > 0 && !selectedExamIdForMarks) {
          setSelectedExamIdForMarks(fetchedExams[0]._id);
        }
      }
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading Exams');
    } finally {
      setLoading(false);
    }
  };

  // When selected exam changes in Marks Entry, load students and populate existing marks
  useEffect(() => {
    if (selectedExamIdForMarks) {
      loadStudentsForExamMarks(selectedExamIdForMarks);
    }
  }, [selectedExamIdForMarks]);

  const loadStudentsForExamMarks = async (examId) => {
    const targetExam = exams.find((e) => e._id === examId);
    if (!targetExam) return;

    setLoadingRoster(true);
    try {
      const res = await studentAPI.getAll({
        classGrade: targetExam.classGrade,
        limit: 100
      });

      if (res.success) {
        const students = res.data?.students || [];
        setRosterStudents(students);

        // Prepopulate existing marks from exam.submissions
        const initialMarks = {};
        students.forEach((st) => {
          const sub = targetExam.submissions?.find(
            (s) => s.studentId?._id === st._id || s.studentId === st._id
          );
          if (sub) {
            initialMarks[st._id] = {
              marksObtained: sub.score !== undefined ? sub.score : '',
              teacherRemarks: sub.teacherRemarks || ''
            };
          } else {
            initialMarks[st._id] = {
              marksObtained: '',
              teacherRemarks: ''
            };
          }
        });
        setMarksEntries(initialMarks);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Failed to load class roster');
    } finally {
      setLoadingRoster(false);
    }
  };

  // Save Marks Entry Handler
  const handleSaveMarks = async () => {
    if (!selectedExamIdForMarks) return;
    setSavingMarks(true);
    try {
      const entries = Object.entries(marksEntries)
        .filter(([_, val]) => val.marksObtained !== '' && val.marksObtained !== null)
        .map(([studentId, val]) => ({
          studentId,
          marksObtained: Number(val.marksObtained) || 0,
          teacherRemarks: val.teacherRemarks || ''
        }));

      if (entries.length === 0) {
        showToast('Please enter at least one student marks value.', 'warning');
        setSavingMarks(false);
        return;
      }

      const res = await examAPI.recordMarks(selectedExamIdForMarks, { marksEntries: entries });
      if (res.success) {
        showToast('Marks successfully recorded and student ranks updated!', 'success', 'Saved');
        fetchExams();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Failed to save marks');
    } finally {
      setSavingMarks(false);
    }
  };

  // Create Exam Handler
  const handleCreateExam = async (e) => {
    e.preventDefault();
    setCreatingExam(true);
    try {
      const res = await examAPI.create({
        ...createForm,
        durationMinutes: Number(createForm.durationMinutes) || 60,
        totalMarks: Number(createForm.totalMarks) || 100,
        passingMarks: Number(createForm.passingMarks) || 40,
        createdByType: 'manual'
      });

      if (res.success) {
        showToast('Examination scheduled and published successfully', 'success', 'Created');
        setIsCreateModalOpen(false);
        setCreateForm({
          title: '',
          examType: 'Mid-Term',
          classGrade: 'Class 8',
          section: 'All',
          subject: 'Science',
          roomNo: 'Exam Hall 1',
          timeSlot: '09:00 AM - 11:30 AM',
          durationMinutes: 90,
          totalMarks: 100,
          passingMarks: 40,
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        });
        fetchExams();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Creation Failed');
    } finally {
      setCreatingExam(false);
    }
  };

  // Open Official Report Card Modal
  const handleOpenReportCard = async (studentId) => {
    setLoadingReportCard(true);
    setIsReportCardOpen(true);
    setReportCardData(null);
    try {
      const res = await examAPI.getReportCard(studentId);
      if (res.success) {
        setReportCardData(res.data);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Report Card Error');
    } finally {
      setLoadingReportCard(false);
    }
  };

  // Delete Exam
  const handleDeleteExam = async (id) => {
    if (!window.confirm('Are you sure you want to delete this examination?')) return;
    try {
      const res = await examAPI.delete(id);
      if (res.success) {
        showToast('Examination deleted successfully', 'success');
        fetchExams();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Failed to delete');
    }
  };

  // Online Exam Taking Handlers
  const startExam = async (exam) => {
    try {
      const res = await examAPI.getById(exam._id);
      if (res.success && res.data) {
        setActiveExam(res.data);
        setExamDetail(res.data);
        setCurrentQIndex(0);
        setSelectedAnswers({});
        setTimeLeft((res.data.durationMinutes || 30) * 60);
        setExamResult(null);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Failed to start exam');
    }
  };

  const handleSelectOption = (questionIdx, optIdx) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: optIdx
    }));
  };

  const handleAutoSubmit = () => {
    showToast('Time expired! Submitting answers automatically...', 'info', 'Time Up');
    handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    if (!activeExam) return;
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(selectedAnswers).map(([qIdx, optIdx]) => ({
        questionIndex: Number(qIdx),
        selectedOption: optIdx
      }));

      const res = await examAPI.submit(activeExam._id, {
        answers: formattedAnswers
      });

      if (res.success) {
        setExamResult(res.data);
        showToast('Assessment submitted and graded instantly!', 'success', 'Evaluated');
        fetchExams();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Subjects List for filters
  const subjectsList = Array.from(new Set(exams.map((e) => e.subject))).filter(Boolean);

  // Filtered Exams
  const filteredExams = exams.filter((exam) => {
    if (selectedClass !== 'All' && exam.classGrade !== selectedClass) return false;
    if (selectedSubject !== 'All' && exam.subject !== selectedSubject) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = exam.title.toLowerCase().includes(term);
      const matchSub = exam.subject.toLowerCase().includes(term);
      const matchType = (exam.examType || '').toLowerCase().includes(term);
      if (!matchTitle && !matchSub && !matchType) return false;
    }
    return true;
  });

  // Calculate Aggregates for Results Tab
  const allSubmissionsLedger = [];
  exams.forEach((exam) => {
    exam.submissions?.forEach((sub) => {
      const st = sub.studentId;
      if (st) {
        allSubmissionsLedger.push({
          submissionId: sub._id,
          examId: exam._id,
          examTitle: exam.title,
          examType: exam.examType || 'Term Exam',
          subject: exam.subject,
          classGrade: exam.classGrade,
          studentId: st._id,
          studentName: st.name || `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Enrolled Pupil',
          rollNumber: st.rollNumber || '—',
          admissionNumber: st.admissionNumber || '—',
          score: sub.score,
          totalMarks: exam.totalMarks,
          percentage: sub.percentage || Math.round(((sub.score || 0) / exam.totalMarks) * 100),
          grade: sub.grade || (sub.percentage >= 90 ? 'A+' : sub.percentage >= 80 ? 'A' : sub.percentage >= 70 ? 'B' : 'C'),
          rank: sub.rank || 1,
          isPassed: sub.isPassed,
          teacherRemarks: sub.teacherRemarks || ''
        });
      }
    });
  });

  // Filter Results Ledger
  const filteredResults = allSubmissionsLedger.filter((item) => {
    if (selectedClass !== 'All' && item.classGrade !== selectedClass) return false;
    if (selectedSubject !== 'All' && item.subject !== selectedSubject) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = item.studentName.toLowerCase().includes(term);
      const matchRoll = item.rollNumber.toLowerCase().includes(term);
      const matchExam = item.examTitle.toLowerCase().includes(term);
      if (!matchName && !matchRoll && !matchExam) return false;
    }
    return true;
  });

  // Helper for letter grade colors
  const getGradeBadge = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold';
      case 'B':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200 font-bold';
      case 'C':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
      case 'D':
        return 'bg-orange-50 text-orange-800 border-orange-200 font-bold';
      default:
        return 'bg-red-50 text-red-800 border-red-200 font-bold';
    }
  };

  // Helper for Rank Icon/Badge
  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
          <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Rank 1</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
          <Award className="w-3.5 h-3.5 text-slate-400" />
          <span>Rank 2</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
          <Award className="w-3.5 h-3.5 text-amber-700" />
          <span>Rank 3</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
        #{rank}
      </span>
    );
  };

  // ==========================================================
  // ONLINE EXAM TAKING VIEW (For Students)
  // ==========================================================
  if (activeExam) {
    const questions = activeExam.questions || [];
    const currentQuestion = questions[currentQIndex];

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
        {/* Exam Taking Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
              {activeExam.subject} &bull; {activeExam.classGrade}
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 mt-2">{activeExam.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Passing: {activeExam.passingMarks} marks &bull; Total: {activeExam.totalMarks} marks
            </p>
          </div>

          {!examResult && (
            <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-mono text-sm font-bold shadow-xs">
              <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Results Screen */}
        {examResult ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Assessment Completed</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your responses have been evaluated and recorded into the academy ledger.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
                <span className="text-2xl font-black text-slate-900">
                  {examResult.score} / {examResult.totalMarks}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Percentage</span>
                <span className="text-2xl font-black text-cyan-700">{examResult.percentage}%</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Grade</span>
                <span className="text-2xl font-black text-emerald-700">{examResult.grade || 'A'}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Rank</span>
                <span className="text-2xl font-black text-amber-600">#{examResult.rank || 1}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveExam(null);
                setExamResult(null);
              }}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Return to Examination Hub
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <p className="text-sm text-slate-500">This is an offline/invigilated exam. Marks are entered by your teacher.</p>
            <button
              onClick={() => setActiveExam(null)}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Back
            </button>
          </div>
        ) : (
          /* Live Question Flow */
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Question {currentQIndex + 1} of {questions.length}</span>
              <span>{currentQuestion.marks || 2} Marks</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{currentQuestion.question}</h3>

            <div className="space-y-3">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentQIndex] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQIndex, optIdx)}
                    className={`w-full text-left p-4 rounded-xl text-xs font-semibold transition border flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-1 ring-cyan-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {currentQIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQIndex((prev) => prev + 1)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitExam}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-md transition"
                >
                  {submitting ? 'Evaluating...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================
  // MAIN EXAMINATION HUB
  // ==========================================================
  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-cyan-600" />
            <span>Examinations & Academic Assessments</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Conduct institutional examinations, manage schedules, record marks, and generate official student report cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/ai-exam-generator"
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span>AI Exam Studio</span>
          </Link>

          {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Exam</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI METRICS RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Exams Scheduled</span>
            <span className="text-xl font-black text-slate-900">{exams.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Evaluated Papers</span>
            <span className="text-xl font-black text-emerald-700">{allSubmissionsLedger.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Cohort Average</span>
            <span className="text-xl font-black text-teal-700">
              {allSubmissionsLedger.length > 0
                ? Math.round(allSubmissionsLedger.reduce((a, b) => a + b.percentage, 0) / allSubmissionsLedger.length)
                : 82}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">High Distinction (A+)</span>
            <span className="text-xl font-black text-amber-700">
              {allSubmissionsLedger.filter((s) => s.grade === 'A+').length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION & GLOBAL FILTERS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Module Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'schedule'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Exam Schedule</span>
          </button>

          {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && (
            <button
              onClick={() => setActiveTab('marks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'marks'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Marks Entry</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'results'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Student Results & Merit</span>
          </button>
        </div>

        {/* Global Filters & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
          >
            <option value="All">All Classes</option>
            {(classesList.length > 0 ? classesList : ['Class 10', 'Class 8', 'Class 5', 'Class 2']).map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
          >
            <option value="All">All Subjects</option>
            {subjectsList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              pattern={SECURITY_PATTERNS.search.pattern}
              title={SECURITY_PATTERNS.search.title}
              maxLength={100}
              onChange={(e) => setSearchTerm(sanitizeInputText(e.target.value))}
              placeholder="Search exam or student..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-600 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: EXAM SCHEDULE & TIMETABLE                         */}
      {/* ======================================================== */}
      {activeTab === 'schedule' && (
        <div>
          {loading ? (
            <div className="p-12 text-center">
              <Loader message="Loading examination schedule..." />
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">No examinations found</h3>
              <p className="text-xs text-slate-500">No scheduled exams match your selected filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => {
                const totalSubs = exam.submissions?.length || 0;
                const isOnlineExam = exam.questions && exam.questions.length > 0;

                // Student submission check
                let studentSub = null;
                if (role === 'student') {
                  studentSub = exam.submissions?.find(
                    (s) => s.studentId?._id === user?._id || s.studentId === user?._id
                  );
                }

                return (
                  <div
                    key={exam._id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-cyan-300 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                          {exam.subject} &bull; {exam.classGrade}
                        </span>

                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {exam.examType || 'Term Exam'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-cyan-900 transition mb-2">
                        {exam.title}
                      </h3>

                      {/* Schedule Details */}
                      <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                            Date:
                          </span>
                          <span className="font-bold text-slate-800">{formatDate(exam.startDate)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-cyan-600" />
                            Time Slot:
                          </span>
                          <span className="font-semibold text-slate-800">{exam.timeSlot || '09:00 AM - 11:30 AM'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                            Venue / Room:
                          </span>
                          <span className="font-semibold text-slate-800">{exam.roomNo || 'Main Examination Hall'}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-slate-400">Duration & Marks:</span>
                          <span className="font-bold text-slate-800">
                            {exam.durationMinutes} mins &bull; {exam.totalMarks} Marks (Pass: {exam.passingMarks})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        <span className="font-bold text-slate-800">{totalSubs}</span> Submissions
                      </div>

                      <div className="flex items-center gap-2">
                        {role === 'student' && isOnlineExam && (
                          <button
                            onClick={() => startExam(exam)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-xs hover:from-cyan-500 hover:to-teal-500 transition"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>{studentSub ? 'Retake Exam' : 'Take Exam'}</span>
                          </button>
                        )}

                        {['super_admin', 'admin', 'principal', 'teacher'].includes(role) && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedExamIdForMarks(exam._id);
                                setActiveTab('marks');
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
                            >
                              Enter Marks
                            </button>

                            <button
                              onClick={() => handleDeleteExam(exam._id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Exam"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MARKS ENTRY REGISTER (Teachers / Admins)          */}
      {/* ======================================================== */}
      {activeTab === 'marks' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          {/* Top Exam Selector Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Select Examination to Grade
              </label>
              <select
                value={selectedExamIdForMarks}
                onChange={(e) => setSelectedExamIdForMarks(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs min-w-[280px]"
              >
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.title} — {ex.classGrade} ({ex.subject}) [{ex.totalMarks} Marks]
                  </option>
                ))}
              </select>
            </div>

            {selectedExamIdForMarks && (
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="text-slate-400 block font-medium">Max Marks</span>
                  <span className="font-black text-slate-900">
                    {exams.find((e) => e._id === selectedExamIdForMarks)?.totalMarks || 100}
                  </span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block font-medium">Passing Marks</span>
                  <span className="font-black text-emerald-700">
                    {exams.find((e) => e._id === selectedExamIdForMarks)?.passingMarks || 40}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveMarks}
                  disabled={savingMarks}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition ml-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingMarks ? 'Saving...' : 'Save & Publish Marks'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Student Roster Marks Table */}
          {loadingRoster ? (
            <div className="p-8 text-center">
              <Loader message="Loading class roster..." />
            </div>
          ) : rosterStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No students enrolled in this examination's class.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rosterStudents.map((st) => {
                    const currentMarks = marksEntries[st._id]?.marksObtained ?? '';
                    const remarks = marksEntries[st._id]?.teacherRemarks || '';
                    const examObj = exams.find((e) => e._id === selectedExamIdForMarks);
                    const totalMax = examObj?.totalMarks || 100;
                    const passMark = examObj?.passingMarks || 40;

                    const numMarks = Number(currentMarks);
                    const hasMarks = currentMarks !== '' && !isNaN(numMarks);
                    const percentage = hasMarks ? Math.round((numMarks / totalMax) * 100) : null;
                    const isPassed = hasMarks ? numMarks >= passMark : null;

                    let grade = '—';
                    if (hasMarks) {
                      if (percentage >= 90) grade = 'A+';
                      else if (percentage >= 80) grade = 'A';
                      else if (percentage >= 70) grade = 'B';
                      else if (percentage >= 60) grade = 'C';
                      else if (percentage >= 40) grade = 'D';
                      else grade = 'F';
                    }

                    return (
                      <tr key={st._id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {st.rollNumber || '—'}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {st.profileImage ? (
                              <img
                                src={st.profileImage}
                                alt={st.name}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">
                                {st.name?.[0] || 'S'}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-900 block">{st.name}</span>
                              <span className="text-[10px] text-slate-400">Class {st.classGrade} ({st.section})</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500">
                          {st.admissionNumber || '—'}
                        </td>

                        {/* Marks Input */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max={totalMax}
                              value={currentMarks}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMarksEntries((prev) => ({
                                  ...prev,
                                  [st._id]: {
                                    ...prev[st._id],
                                    marksObtained: val
                                  }
                                }));
                              }}
                              placeholder="0"
                              className="w-16 px-2.5 py-1.5 border border-slate-200 rounded-lg text-center font-bold text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 shadow-xs"
                            />
                            <span className="text-slate-400 font-semibold text-[11px]">/ {totalMax}</span>
                          </div>
                        </td>

                        {/* Auto Percentage */}
                        <td className="py-3 px-4 font-bold">
                          {percentage !== null ? (
                            <span className={percentage >= 75 ? 'text-emerald-700' : percentage >= 40 ? 'text-cyan-700' : 'text-red-600'}>
                              {percentage}%
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Auto Grade */}
                        <td className="py-3 px-4">
                          {hasMarks ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${getGradeBadge(grade)}`}>
                              {grade}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Result Status */}
                        <td className="py-3 px-4">
                          {hasMarks ? (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                isPassed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {isPassed ? 'Passed' : 'Failed'}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[11px]">Pending</span>
                          )}
                        </td>

                        {/* Remarks Input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={remarks}
                            pattern="^[^<>]{0,120}$"
                            title="Remarks must not contain HTML tags (< >)."
                            maxLength={120}
                            onChange={(e) => {
                              const val = sanitizeInputText(e.target.value);
                              setMarksEntries((prev) => ({
                                ...prev,
                                [st._id]: {
                                  ...prev[st._id],
                                  teacherRemarks: val
                                }
                              }));
                            }}
                            placeholder="e.g. Excellent analytical performance"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-600 shadow-xs"
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
      )}

      {/* ======================================================== */}
      {/* TAB 3: STUDENT RESULTS & MERIT LEDGER                    */}
      {/* ======================================================== */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Academic Merit & Results Ledger</h3>
              <p className="text-xs text-slate-500">
                Official evaluated examination scores with automated grade calculation, rank indexing, and report card generator.
              </p>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No evaluated student results match your current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Class Rank</th>
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Examination</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Official Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((res, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">{getRankBadge(res.rank)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{res.rollNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{res.studentName}</span>
                        <span className="text-[10px] text-slate-400">Class {res.classGrade}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold max-w-[200px] truncate">
                        {res.examTitle}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                          {res.subject}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        {res.score} <span className="text-slate-400 font-normal">/ {res.totalMarks}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-cyan-600 h-full rounded-full"
                              style={{ width: `${Math.min(res.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800">{res.percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getGradeBadge(res.grade)}`}>
                          {res.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            res.isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {res.isPassed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenReportCard(res.studentId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Report Card</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. OFFICIAL INSTITUTIONAL REPORT CARD MODAL              */}
      {/* ======================================================== */}
      <Modal
        isOpen={isReportCardOpen}
        onClose={() => setIsReportCardOpen(false)}
        title="Official Academic Report Card"
      >
        {loadingReportCard ? (
          <div className="p-12 text-center">
            <Loader message="Synthesizing academic report card..." />
          </div>
        ) : !reportCardData ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No report card records available for this student.
          </div>
        ) : (
          <div className="space-y-6 print:m-0 print:p-0">
            {/* Printable Report Card Sheet */}
            <div
              id="report-card-printable"
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6"
            >
              {/* Header Letterhead */}
              <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                    S
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      SchoolSphere International Academy
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Affiliated International Board of Secondary Education &bull; Code: AGY-8841
                    </p>
                    <p className="text-[10px] text-slate-400">
                      42 Academic Boulevard, Silicon Valley, CA 94025 &bull; info@schoolsphere.com
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 font-extrabold text-xs border border-cyan-200 block sm:inline-block">
                    Session 2026–2027
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                    Official Term Transcript
                  </span>
                </div>
              </div>

              {/* Student Identification Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Name</span>
                  <span className="font-bold text-slate-900 text-sm">{reportCardData.student.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Class & Section</span>
                  <span className="font-bold text-slate-800">
                    {reportCardData.student.classGrade} ({reportCardData.student.section})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Admission Number</span>
                  <span className="font-mono font-bold text-slate-800">
                    {reportCardData.student.admissionNumber || 'ADM-2024-001'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Roll Number</span>
                  <span className="font-mono font-bold text-slate-800">
                    {reportCardData.student.rollNumber || '101'}
                  </span>
                </div>
              </div>

              {/* Subjects Evaluation Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Academic Performance by Subject
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Assessment Title</th>
                        <th className="py-2.5 px-3 text-center">Max</th>
                        <th className="py-2.5 px-3 text-center">Obtained</th>
                        <th className="py-2.5 px-3 text-center">Percent</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-center">Rank</th>
                        <th className="py-2.5 px-3">Faculty Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportCardData.reportCard.subjects?.map((sub, sIdx) => (
                        <tr key={sIdx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{sub.subject}</td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">{sub.examTitle}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{sub.maxMarks}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                            {sub.obtainedMarks}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-cyan-700">{sub.percentage}%</td>
                          <td className="py-2.5 px-3 text-center font-black">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] border ${getGradeBadge(sub.grade)}`}>
                              {sub.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700">#{sub.rank}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] italic">{sub.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cumulative Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900 text-white text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Marks</span>
                  <span className="text-xl font-black">
                    {reportCardData.reportCard.summary.cumulativeObtained} / {reportCardData.reportCard.summary.cumulativeMax}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Overall Percentage</span>
                  <span className="text-xl font-black text-cyan-400">
                    {reportCardData.reportCard.summary.overallPercentage}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Cumulative Grade</span>
                  <span className="text-xl font-black text-emerald-400">
                    {reportCardData.reportCard.summary.overallGrade}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Class Merit Rank</span>
                  <span className="text-xl font-black text-amber-400">
                    Rank {reportCardData.reportCard.summary.classRank}
                  </span>
                </div>
              </div>

              {/* Faculty Conduct Remarks */}
              <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-100 text-xs">
                <span className="font-bold text-cyan-900 block mb-1">Institutional Assessment & Conduct:</span>
                <p className="text-slate-700 leading-relaxed italic">
                  &ldquo;{reportCardData.reportCard.summary.conductRemarks}&rdquo;
                </p>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="h-10 border-b border-slate-400 mx-auto w-32 mb-1" />
                  <span className="font-bold text-slate-800 block">Class Teacher</span>
                  <span className="text-[10px] text-slate-400">Academic Faculty</span>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-600 mx-auto flex items-center justify-center text-[9px] font-black uppercase text-cyan-700 -mt-2 mb-1">
                    SEAL
                  </div>
                  <span className="font-bold text-slate-800 block">SchoolSphere Academy</span>
                  <span className="text-[10px] text-slate-400">Official Seal</span>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 mx-auto w-32 mb-1" />
                  <span className="font-bold text-slate-800 block">Controller of Exams</span>
                  <span className="text-[10px] text-slate-400">Principal Signature</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReportCardOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Print Official Report Card</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* 5. CREATE EXAM MODAL                                     */}
      {/* ======================================================== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Institutional Examination"
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Examination Title *
            </label>
            <input
              type="text"
              required
              value={createForm.title}
              pattern={SECURITY_PATTERNS.titleText.pattern}
              title={SECURITY_PATTERNS.titleText.title}
              maxLength={120}
              onChange={(e) => setCreateForm({ ...createForm, title: sanitizeInputText(e.target.value) })}
              placeholder="e.g. Mid-Term Physics & Mechanics Assessment"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Exam Type
              </label>
              <select
                value={createForm.examType}
                onChange={(e) => setCreateForm({ ...createForm, examType: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
              >
                <option value="Mid-Term">Mid-Term</option>
                <option value="Final Exam">Final Exam</option>
                <option value="Term Examination">Term Examination</option>
                <option value="Unit Test">Unit Test</option>
                <option value="Practical Assessment">Practical Assessment</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={createForm.subject}
                pattern={SECURITY_PATTERNS.name.pattern}
                title={SECURITY_PATTERNS.name.title}
                maxLength={60}
                onChange={(e) => setCreateForm({ ...createForm, subject: sanitizeInputText(e.target.value) })}
                placeholder="e.g. Science, Mathematics, English"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Class Grade *
              </label>
              <select
                value={createForm.classGrade}
                onChange={(e) => setCreateForm({ ...createForm, classGrade: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
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
                Section
              </label>
              <select
                value={createForm.section}
                onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
              >
                <option value="All">All Sections (Entire Grade)</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Time Slot
              </label>
              <input
                type="text"
                value={createForm.timeSlot}
                pattern="^[a-zA-Z0-9\s:–\-\./]{2,50}$"
                title="Valid time slot (e.g. 09:00 AM - 11:30 AM)."
                maxLength={50}
                onChange={(e) => setCreateForm({ ...createForm, timeSlot: sanitizeInputText(e.target.value) })}
                placeholder="e.g. 09:00 AM - 11:30 AM"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Venue / Room Number
              </label>
              <input
                type="text"
                value={createForm.roomNo}
                pattern="^[a-zA-Z0-9\s,\-\./]{1,50}$"
                title="Valid room or examination hall identifier."
                maxLength={50}
                onChange={(e) => setCreateForm({ ...createForm, roomNo: sanitizeInputText(e.target.value) })}
                placeholder="e.g. Examination Hall 2, Lab 3"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                min="15"
                max="360"
                value={createForm.durationMinutes}
                onChange={(e) => setCreateForm({ ...createForm, durationMinutes: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Total Marks
              </label>
              <input
                type="number"
                min="10"
                value={createForm.totalMarks}
                onChange={(e) => setCreateForm({ ...createForm, totalMarks: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Passing Marks
              </label>
              <input
                type="number"
                min="5"
                value={createForm.passingMarks}
                onChange={(e) => setCreateForm({ ...createForm, passingMarks: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={createForm.endDate}
                onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingExam}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition"
            >
              {creatingExam ? 'Scheduling...' : 'Publish Examination'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
