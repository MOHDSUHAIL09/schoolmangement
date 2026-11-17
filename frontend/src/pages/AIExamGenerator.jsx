import React, { useState, useEffect } from 'react';
import { examAPI, studentAPI } from '../services/api.js';
import { useSchool } from '../context/SchoolContext.jsx';
import { useNavigate } from 'react-router-dom';
import { SECURITY_PATTERNS, sanitizeInputText } from '../utils/securityPatterns.js';
import {
  Sparkles,
  Bot,
  CheckCircle2,
  Trash2,
  Save,
  HelpCircle,
  RefreshCw,
  BookOpen,
  FileText,
  Printer,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Users,
  Award,
  Brain,
  Clock,
  ShieldCheck,
  ChevronRight,
  PieChart,
  Lightbulb,
  Check,
  Layers
} from 'lucide-react';

export const AIExamGenerator = () => {
  const { showToast } = useSchool();
  const navigate = useNavigate();

  // Active Tab: 'generator' | 'paper' | 'difficulty' | 'performance' | 'weakness'
  const [activeTab, setActiveTab] = useState('generator');

  // Shared state
  const [classesList, setClassesList] = useState([]);
  const [examsList, setExamsList] = useState([]);

  // ==========================================================
  // TAB 1: AI QUESTION GENERATOR STATE
  // ==========================================================
  const [classGrade, setClassGrade] = useState('Class 8');
  const [subject, setSubject] = useState('Science');
  const [topic, setTopic] = useState('Force and Pressure');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);

  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [aiSource, setAiSource] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [savingExam, setSavingExam] = useState(false);

  // ==========================================================
  // TAB 2: QUESTION PAPER GENERATOR STATE
  // ==========================================================
  const [paperGrade, setPaperGrade] = useState('Class 8');
  const [paperSubject, setPaperSubject] = useState('Science');
  const [paperTerm, setPaperTerm] = useState('Mid-Term Examination');
  const [paperTopics, setPaperTopics] = useState('Mechanics, Hydrostatic Pressure, Energy and Work');
  const [paperTotalMarks, setPaperTotalMarks] = useState(80);
  const [paperDuration, setPaperDuration] = useState(90);
  const [generatingPaper, setGeneratingPaper] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState(null);

  // ==========================================================
  // TAB 3: DIFFICULTY ANALYSIS STATE
  // ==========================================================
  const [analyzingDifficulty, setAnalyzingDifficulty] = useState(false);
  const [difficultyAnalysis, setDifficultyAnalysis] = useState(null);

  // ==========================================================
  // TAB 4: STUDENT PERFORMANCE & RESULT ANALYSIS STATE
  // ==========================================================
  const [selectedExamForAnalysis, setSelectedExamForAnalysis] = useState('');
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);

  // ==========================================================
  // TAB 5: WEAK SUBJECTS & LEARNING GAPS STATE
  // ==========================================================
  const [loadingWeakness, setLoadingWeakness] = useState(false);
  const [weaknessData, setWeaknessData] = useState(null);
  const [weaknessClassFilter, setWeaknessClassFilter] = useState('All');

  useEffect(() => {
    fetchMeta();
    fetchExams();
  }, []);

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
    try {
      const res = await examAPI.getAll();
      if (res.success && res.data.exams) {
        setExamsList(res.data.exams);
        if (res.data.exams.length > 0 && !selectedExamForAnalysis) {
          setSelectedExamForAnalysis(res.data.exams[0]._id);
        }
      }
    } catch (err) {
      console.warn('Exams fetch error:', err);
    }
  };

  // 1. AI Question Generation Handler
  const handleGenerateQuestions = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      showToast('Please enter an academic curriculum topic.', 'error');
      return;
    }

    setGenerating(true);
    setQuestions([]);
    try {
      const res = await examAPI.aiGenerate({
        classGrade,
        subject,
        topic,
        difficulty,
        numberOfQuestions
      });

      if (res.success && res.data?.questions) {
        setQuestions(res.data.questions);
        setAiSource(res.data.source || 'Gemini 1.5 Flash');
        setExamTitle(`${subject}: ${topic} Evaluation`);
        showToast(`Synthesized ${res.data.questions.length} curriculum questions!`, 'success', 'AI Generation Complete');
      }
    } catch (err) {
      showToast(err.message, 'error', 'Generation Error');
    } finally {
      setGenerating(false);
    }
  };

  // Save AI Exam to Active Exams
  const handleSaveToExams = async () => {
    if (questions.length === 0) return;
    setSavingExam(true);
    try {
      const res = await examAPI.create({
        title: examTitle || `${subject} - ${topic}`,
        classGrade,
        subject,
        durationMinutes: Number(durationMinutes) || 30,
        createdByType: 'ai_generated',
        questions,
        status: 'Published'
      });

      if (res.success) {
        showToast('AI Exam published to active examination schedule!', 'success', 'Exam Published');
        navigate('/exams');
      }
    } catch (err) {
      showToast(err.message, 'error', 'Failed to publish');
    } finally {
      setSavingExam(false);
    }
  };

  // 2. Question Paper Generation Handler
  const handleGeneratePaper = async (e) => {
    e.preventDefault();
    setGeneratingPaper(true);
    try {
      const res = await examAPI.generatePaper({
        classGrade: paperGrade,
        subject: paperSubject,
        term: paperTerm,
        academicYear: '2026-2027',
        totalMarks: Number(paperTotalMarks) || 80,
        durationMinutes: Number(paperDuration) || 90,
        topics: paperTopics
      });

      if (res.success && res.paper) {
        setGeneratedPaper(res.paper);
        showToast('Formal Question Paper generated successfully!', 'success', 'Paper Ready');
      }
    } catch (err) {
      showToast(err.message, 'error', 'Paper Generation Error');
    } finally {
      setGeneratingPaper(false);
    }
  };

  // 3. Difficulty Analysis Handler
  const handleAnalyzeDifficulty = async () => {
    setAnalyzingDifficulty(true);
    try {
      const targetQuestions = questions.length > 0 ? questions : [
        { question: 'What is the SI unit of pressure?', marks: 2 },
        { question: 'Calculate buoyant force on a submerged sphere in water.', marks: 5 },
        { question: 'Derive Archimedes Principle and analyze why steel ships float.', marks: 10 },
        { question: 'Compare absolute pressure with differential gauge pressure.', marks: 5 }
      ];

      const res = await examAPI.analyzeDifficulty({
        questions: targetQuestions,
        examTitle: examTitle || `${subject} Assessment`,
        classGrade
      });

      if (res.success) {
        setDifficultyAnalysis(res);
        showToast('Cognitive Bloom\'s Taxonomy & difficulty analyzed!', 'success', 'Analysis Complete');
      }
    } catch (err) {
      showToast(err.message, 'error', 'Analysis Failed');
    } finally {
      setAnalyzingDifficulty(false);
    }
  };

  // 4. Performance Analysis Handler
  useEffect(() => {
    if (activeTab === 'performance' && selectedExamForAnalysis) {
      loadPerformanceData(selectedExamForAnalysis);
    }
  }, [activeTab, selectedExamForAnalysis]);

  const loadPerformanceData = async (examId) => {
    setLoadingPerformance(true);
    try {
      const res = await examAPI.getPerformanceAnalysis(examId);
      if (res.success) {
        setPerformanceData(res);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Performance Analysis Error');
    } finally {
      setLoadingPerformance(false);
    }
  };

  // 5. Weak Subjects Analysis Handler
  useEffect(() => {
    if (activeTab === 'weakness') {
      loadWeaknessData();
    }
  }, [activeTab, weaknessClassFilter]);

  const loadWeaknessData = async () => {
    setLoadingWeakness(true);
    try {
      const res = await examAPI.getWeakSubjects({ classGrade: weaknessClassFilter });
      if (res.success) {
        setWeaknessData(res);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Learning Gap Error');
    } finally {
      setLoadingWeakness(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & STUDIO TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-cyan-600" />
            <span>Gemini AI Examination Studio & Cognitive Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Empower your faculty with AI question synthesis, institutional question paper generation, Bloom's difficulty analysis, and cohort learning gap identification.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold shadow-xs">
            <Bot className="w-4 h-4 text-cyan-600" />
            <span>Gemini 1.5 Pro/Flash Engine</span>
          </span>
        </div>
      </div>

      {/* 2. STUDIO NAVIGATION TABS */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'generator'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Question Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('paper')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'paper'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Question Paper Generator</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('difficulty');
            if (!difficultyAnalysis) handleAnalyzeDifficulty();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'difficulty'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Difficulty & Bloom's Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'performance'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Student Result Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('weakness')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'weakness'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Weak Subjects & Interventions</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: AI QUESTION GENERATOR                             */}
      {/* ======================================================== */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          {/* Generation Configuration Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <form onSubmit={handleGenerateQuestions} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Class Grade
                  </label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
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
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    pattern={SECURITY_PATTERNS.name.pattern}
                    title={SECURITY_PATTERNS.name.title}
                    maxLength={80}
                    onChange={(e) => setSubject(sanitizeInputText(e.target.value))}
                    placeholder="e.g. Science, Mathematics"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                  >
                    <option value="Easy">Easy (Foundational)</option>
                    <option value="Medium">Medium (Standard Curriculum)</option>
                    <option value="Hard">Hard (Analytical & Deep)</option>
                    <option value="Olympiad">Olympiad / Distinction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Question Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={numberOfQuestions}
                    onChange={(e) => setNumberOfQuestions(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Topic or Curriculum Unit
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  pattern={SECURITY_PATTERNS.titleText.pattern}
                  title={SECURITY_PATTERNS.titleText.title}
                  maxLength={120}
                  onChange={(e) => setTopic(sanitizeInputText(e.target.value))}
                  placeholder="e.g. Fluid Mechanics, Archimedes Principle & Hydrostatic Pressure"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  <span>{generating ? 'Synthesizing with Gemini AI...' : 'Generate Exam Questions'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Generated Questions Output */}
          {questions.length > 0 && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                      Engine: {aiSource}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {questions.length} Questions Generated
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">{examTitle}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('difficulty');
                      handleAnalyzeDifficulty();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    <Brain className="w-4 h-4 text-cyan-600" />
                    <span>Analyze Difficulty</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToExams}
                    disabled={savingExam}
                    className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingExam ? 'Publishing...' : 'Publish to Exam Schedule'}</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-bold text-slate-900 text-xs">
                        Q{qIdx + 1}. {q.question}
                      </span>
                      <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200 shrink-0">
                        {q.marks || 2} Marks
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-lg border flex items-center justify-between ${
                            optIdx === q.correctAnswer
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          {optIdx === q.correctAnswer && (
                            <span className="text-[10px] text-emerald-700 font-black">CORRECT</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                        <strong className="text-slate-700 not-italic">Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: FORMAL QUESTION PAPER GENERATOR                   */}
      {/* ======================================================== */}
      {activeTab === 'paper' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">
              Official Multi-Section Examination Paper Generator
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Synthesizes a standardized, board-compliant printed exam paper with General Instructions, Section A (Objective), Section B (Conceptual), and Section C (Application/Case Study).
            </p>

            <form onSubmit={handleGeneratePaper} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Class Grade
                  </label>
                  <select
                    value={paperGrade}
                    onChange={(e) => setPaperGrade(e.target.value)}
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
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={paperSubject}
                    pattern={SECURITY_PATTERNS.name.pattern}
                    title={SECURITY_PATTERNS.name.title}
                    maxLength={80}
                    onChange={(e) => setPaperSubject(sanitizeInputText(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Examination Type
                  </label>
                  <select
                    value={paperTerm}
                    onChange={(e) => setPaperTerm(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                  >
                    <option value="Mid-Term Examination">Mid-Term Examination</option>
                    <option value="Final Board Examination">Final Board Examination</option>
                    <option value="Semester Final Examination">Semester Final Examination</option>
                    <option value="Diagnostic Periodic Evaluation">Diagnostic Periodic Evaluation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={paperTotalMarks}
                    onChange={(e) => setPaperTotalMarks(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="360"
                    value={paperDuration}
                    onChange={(e) => setPaperDuration(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Syllabus Units & Topics Covered
                </label>
                <textarea
                  rows={2}
                  value={paperTopics}
                  onChange={(e) => setPaperTopics(e.target.value)}
                  placeholder="e.g. Newton Laws of Motion, Pressure in Fluids, Archimedes Buoyant Force"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={generatingPaper}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  <FileText className={`w-4 h-4 ${generatingPaper ? 'animate-spin' : ''}`} />
                  <span>{generatingPaper ? 'Synthesizing Question Paper...' : 'Generate Official Exam Paper'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Rendered Question Paper */}
          {generatedPaper && (
            <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6 print:m-0 print:p-0">
              {/* Paper Header */}
              <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  {generatedPaper.schoolName}
                </h2>
                <h3 className="text-base font-bold text-cyan-800">
                  {generatedPaper.term} &bull; Academic Session {generatedPaper.academicYear}
                </h3>
                <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-600 pt-2">
                  <span>Class: {generatedPaper.classGrade}</span>
                  <span>&bull;</span>
                  <span>Subject: {generatedPaper.subject}</span>
                  <span>&bull;</span>
                  <span>Total Marks: {generatedPaper.totalMarks}</span>
                  <span>&bull;</span>
                  <span>Time Allowed: {generatedPaper.durationMinutes} Minutes</span>
                </div>
              </div>

              {/* General Instructions */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  General Instructions:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  {generatedPaper.generalInstructions?.map((ins, iIdx) => (
                    <li key={iIdx}>{ins}</li>
                  ))}
                </ul>
              </div>

              {/* Sections & Questions */}
              <div className="space-y-6">
                {generatedPaper.sections?.map((sec, secIdx) => (
                  <div key={secIdx} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                        {sec.name}
                      </h4>
                      <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                        {sec.totalSectionMarks} Marks
                      </span>
                    </div>

                    <div className="space-y-4">
                      {sec.questions?.map((q, qIdx) => (
                        <div key={qIdx} className="text-xs space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-semibold text-slate-900">
                              <strong className="font-bold text-slate-950">Q{q.number || qIdx + 1}.</strong> {q.question}
                            </span>
                            <span className="font-mono font-bold text-slate-500 shrink-0">[{q.marks}M]</span>
                          </div>

                          {q.options && (
                            <div className="grid grid-cols-2 gap-2 pl-4 text-slate-600">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800">
                                    {String.fromCharCode(65 + oIdx)}.
                                  </span>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {q.guidelines && (
                            <p className="text-[11px] text-slate-400 pl-4 italic">
                              Evaluation Key: {q.guidelines}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Print Action */}
              <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>Print Official Examination Paper</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: DIFFICULTY & BLOOM'S TAXONOMY ANALYSIS            */}
      {/* ======================================================== */}
      {activeTab === 'difficulty' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Pedagogical Difficulty & Bloom's Cognitive Taxonomy
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluates question complexity, cognitive distribution, and curriculum alignment scores.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeDifficulty}
                disabled={analyzingDifficulty}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 font-bold text-xs rounded-xl transition self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyzingDifficulty ? 'animate-spin' : ''}`} />
                <span>Re-Analyze Assessment</span>
              </button>
            </div>

            {difficultyAnalysis && (
              <div className="space-y-6">
                {/* Metrics Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Difficulty</span>
                    <span className="text-base font-black text-cyan-700">
                      {difficultyAnalysis.overallDifficulty}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Alignment Score</span>
                    <span className="text-xl font-black text-emerald-700">
                      {difficultyAnalysis.curriculumAlignmentScore}%
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Time</span>
                    <span className="text-xl font-black text-slate-900">
                      {difficultyAnalysis.estimatedCompletionTimeMinutes} Mins
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Questions Evaluated</span>
                    <span className="text-xl font-black text-slate-900">
                      {difficultyAnalysis.totalQuestions} Items
                    </span>
                  </div>
                </div>

                {/* Bloom's Taxonomy Distribution */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Cognitive Skill Distribution (Bloom's Revised Taxonomy)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>1. Knowledge & Recall</span>
                        <span className="text-cyan-700">{difficultyAnalysis.bloomsTaxonomy.knowledgeRecall}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full rounded-full"
                          style={{ width: `${difficultyAnalysis.bloomsTaxonomy.knowledgeRecall}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>2. Conceptual Comprehension</span>
                        <span className="text-teal-700">{difficultyAnalysis.bloomsTaxonomy.comprehension}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-500 h-full rounded-full"
                          style={{ width: `${difficultyAnalysis.bloomsTaxonomy.comprehension}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>3. Quantitative Application</span>
                        <span className="text-emerald-700">{difficultyAnalysis.bloomsTaxonomy.application}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${difficultyAnalysis.bloomsTaxonomy.application}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>4. Critical Analysis & Evaluation</span>
                        <span className="text-amber-700">{difficultyAnalysis.bloomsTaxonomy.analysisEvaluation}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${difficultyAnalysis.bloomsTaxonomy.analysisEvaluation}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Pedagogical Recommendations */}
                <div className="p-5 rounded-xl bg-cyan-50/60 border border-cyan-200 text-xs space-y-2">
                  <span className="font-bold text-cyan-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Lightbulb className="w-4 h-4 text-cyan-700" />
                    AI Pedagogical Recommendations
                  </span>
                  <ul className="space-y-1.5 text-slate-700 list-disc pl-5">
                    {difficultyAnalysis.recommendations?.map((rec, rIdx) => (
                      <li key={rIdx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: STUDENT PERFORMANCE & RESULT ANALYSIS             */}
      {/* ======================================================== */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Assessment Performance & Cohort Analytics
                </h3>
                <p className="text-xs text-slate-500">
                  Statistical evaluation of cohort distribution, pass rate benchmarks, and high-achiever recognition.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Select Exam to Inspect
                </label>
                <select
                  value={selectedExamForAnalysis}
                  onChange={(e) => setSelectedExamForAnalysis(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                >
                  {examsList.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.title} ({ex.classGrade} - {ex.subject})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {performanceData?.stats && (
              <div className="space-y-6">
                {/* Statistical Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Average</span>
                    <span className="text-2xl font-black text-cyan-700">
                      {performanceData.stats.averagePercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {performanceData.stats.averageScore} raw score
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pass Rate</span>
                    <span className="text-2xl font-black text-emerald-700">
                      {performanceData.stats.passRate}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {performanceData.stats.totalSubmissions} submissions
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Score Range</span>
                    <span className="text-2xl font-black text-slate-900">
                      {performanceData.stats.lowestScore} &ndash; {performanceData.stats.highestScore}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Min to Max</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Standard Dev</span>
                    <span className="text-2xl font-black text-slate-700">
                      &sigma; {performanceData.stats.standardDeviation}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Cohort Variance</span>
                  </div>
                </div>

                {/* Grade Distribution Bar */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Grade Distribution Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center text-xs">
                    {Object.entries(performanceData.stats.gradeDistribution || {}).map(([grade, cnt]) => (
                      <div key={grade} className="p-3 rounded-xl border border-slate-200 bg-white">
                        <span className="text-xs font-black block text-slate-700">{grade}</span>
                        <span className="text-xl font-black text-cyan-700 block mt-1">{cnt}</span>
                        <span className="text-[10px] text-slate-400">Pupils</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Performers Leaderboard */}
                {performanceData.stats.topPerformers?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Top Academic Achievers
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {performanceData.stats.topPerformers.map((top, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-xs flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-300 text-amber-800 flex items-center justify-center font-black text-xs">
                              #{top.rank}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">{top.studentName}</span>
                              <span className="text-[10px] text-slate-400">Roll: {top.rollNumber}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-cyan-700 text-sm block">{top.percentage}%</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Grade {top.grade}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: WEAK SUBJECTS & LEARNING GAP IDENTIFICATION       */}
      {/* ======================================================== */}
      {activeTab === 'weakness' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Subject Proficiency & Learning Gap Diagnostics
                </h3>
                <p className="text-xs text-slate-500">
                  Detects curriculum subjects needing reinforcement, highlights struggling students, and recommends structured remedial plans.
                </p>
              </div>

              <div>
                <select
                  value={weaknessClassFilter}
                  onChange={(e) => setWeaknessClassFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                >
                  <option value="All">All Grades (Academy Wide)</option>
                  {(classesList.length > 0 ? classesList : ['Class 10', 'Class 8', 'Class 5', 'Class 2']).map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {weaknessData?.subjects && (
              <div className="space-y-4">
                {weaknessData.subjects.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-cyan-300 transition shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-slate-900">{item.subject}</span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            item.urgency === 'High'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : item.urgency === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.proficiencyStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="text-slate-500">
                          {item.totalAssessments} Exam(s) &bull; {item.submissionsCount} Papers
                        </span>
                        <span className="text-cyan-700 text-sm font-black">
                          {item.averagePercentage}% Avg
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.averagePercentage < 65
                            ? 'bg-red-500'
                            : item.averagePercentage < 78
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(item.averagePercentage, 100)}%` }}
                      />
                    </div>

                    {/* Struggling Students Alert */}
                    {item.strugglingStudents?.length > 0 && (
                      <div className="text-xs text-slate-600 flex items-center gap-2 pt-1">
                        <span className="text-red-600 font-bold">Students Flagged for Support:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.strugglingStudents.map((st, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]"
                            >
                              {st}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Remedial Plan */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <strong className="text-slate-700 block text-[11px] uppercase tracking-wider mb-0.5">
                        Recommended Academic Intervention:
                      </strong>
                      <p className="text-slate-600 italic">{item.remedialPlan}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
