import React, { useState, useEffect } from 'react';
import { communicationAPI, studentAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Loader } from '../components/Loader.jsx';
import { formatDate } from '../utils/formatters.js';
import { SECURITY_PATTERNS, sanitizeInputText } from '../utils/securityPatterns.js';
import {
  Mail,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Search,
  Filter,
  Check,
  RefreshCw,
  Sparkles,
  Smartphone,
  ShieldCheck,
  FileText,
  Sliders,
  Bell,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const Communications = () => {
  const { user, role } = useAuth();
  const { showToast } = useSchool();

  // Active Tab: 'email' | 'whatsapp' | 'logs' | 'triggers'
  const [activeTab, setActiveTab] = useState('email');

  // Gateway status & KPI stats
  const [statusData, setStatusData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [classesList, setClassesList] = useState([]);

  // ==========================================================
  // TAB 1: EMAIL DISPATCH STUDIO STATE
  // ==========================================================
  const [emailTarget, setEmailTarget] = useState('all_parents'); // 'all_parents' | 'all_teachers' | 'class_grade' | 'individual'
  const [emailClassGrade, setEmailClassGrade] = useState('Class 8');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [emailSubject, setEmailSubject] = useState('Important Institutional Announcement — SchoolSphere Academy');
  const [emailMessage, setEmailMessage] = useState(
    'Dear Parents and Guardians,\n\nPlease be advised that the academic session progress reports and midterm examinations schedule have been published on your portal. We encourage all parents to review the upcoming milestones and reach out to class faculty for any specific academic inquiries.\n\nThank you for your continued partnership.'
  );
  const [emailTemplate, setEmailTemplate] = useState('General Notice');
  const [sendingEmail, setSendingEmail] = useState(false);

  // ==========================================================
  // TAB 2: WHATSAPP NOTIFICATION CENTER STATE
  // ==========================================================
  const [waTarget, setWaTarget] = useState('all_parents'); // 'all_parents' | 'class_grade' | 'individual'
  const [waClassGrade, setWaClassGrade] = useState('Class 8');
  const [waPhone, setWaPhone] = useState('+1 (555) 300-0001');
  const [waRecipientName, setWaRecipientName] = useState('Parent');
  const [waMessage, setWaMessage] = useState(
    'Dear Parent, Aarav Sharma has been marked PRESENT at SchoolSphere International Academy today (12/11/2026 at 08:15 AM). Have a pleasant day!'
  );
  const [waTemplate, setWaTemplate] = useState('Attendance Alert');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  // ==========================================================
  // MULTILINGUAL AI AUTO-REPLY STATES FOR WHATSAPP & EMAIL
  // ==========================================================
  const [waAIReply, setWaAIReply] = useState(
    'Thank you for contacting SchoolSphere Academy. Roll call records and notifications are updated daily at 08:30 AM.'
  );
  const [waTyping, setWaTyping] = useState(false);

  const [emailAIReply, setEmailAIReply] = useState(
    'Thank you for your institutional inquiry. Academic circulars and session timetables have been published on the student portal.'
  );
  const [emailTyping, setEmailTyping] = useState(false);

  // Helper: Open direct WhatsApp Web / App
  const openDirectWhatsApp = () => {
    const rawNumber = waPhone ? waPhone.replace(/[^0-9]/g, '') : '';
    const phoneParam = rawNumber ? `phone=${rawNumber}&` : '';
    const textParam = encodeURIComponent(
      `*SchoolSphere International Academy*\n\n${waMessage}`
    );
    const url = `https://api.whatsapp.com/send?${phoneParam}text=${textParam}`;
    window.open(url, '_blank');
  };

  // Helper: Fetch AI Reply for WhatsApp message
  const fetchWaAIReply = async (msg) => {
    if (!msg || msg.trim().length < 3) return;
    setWaTyping(true);
    try {
      const res = await communicationAPI.getAIReply({ message: msg, channel: 'whatsapp' });
      if (res.success && res.aiReply) {
        setWaAIReply(res.aiReply);
      }
    } catch (err) {
      console.warn('AI reply error:', err);
    } finally {
      setWaTyping(false);
    }
  };

  // Helper: Fetch AI Reply for Email message
  const fetchEmailAIReply = async (msg, subj) => {
    if ((!msg || msg.trim().length < 3) && (!subj || subj.trim().length < 3)) return;
    setEmailTyping(true);
    try {
      const res = await communicationAPI.getAIReply({ message: msg, subject: subj, channel: 'email' });
      if (res.success && res.aiReply) {
        setEmailAIReply(res.aiReply);
      }
    } catch (err) {
      console.warn('Email AI reply error:', err);
    } finally {
      setEmailTyping(false);
    }
  };

  // Debounced auto-updates for AI reply preview
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWaAIReply(waMessage);
    }, 600);
    return () => clearTimeout(timer);
  }, [waMessage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmailAIReply(emailMessage, emailSubject);
    }, 600);
    return () => clearTimeout(timer);
  }, [emailMessage, emailSubject]);

  // ==========================================================
  // TAB 3: DELIVERY LOGS STATE
  // ==========================================================
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logChannelFilter, setLogChannelFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');

  // ==========================================================
  // TAB 4: AUTOMATED TRIGGERS STATE (Config Mock)
  // ==========================================================
  const [triggers, setTriggers] = useState({
    autoAbsenceEmail: true,
    autoAbsenceWhatsApp: true,
    autoFeeReminder: true,
    autoExamPublish: true,
    autoHomeworkAlert: true,
    autoTransportDelay: true
  });

  useEffect(() => {
    fetchGatewaysStatus();
    fetchStats();
    fetchClasses();
    fetchLogs();
  }, []);

  const fetchGatewaysStatus = async () => {
    try {
      const res = await communicationAPI.getStatus();
      if (res.success && res.data) {
        setStatusData(res.data);
      }
    } catch (err) {
      console.warn('Communication status fetch error:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await communicationAPI.getStats();
      if (res.success && res.data) {
        setStatsData(res.data);
      }
    } catch (err) {
      console.warn('Communication stats fetch error:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await studentAPI.getClassesMeta();
      if (res.success && res.data.classes) {
        setClassesList(res.data.classes);
      }
    } catch (err) {
      console.warn('Classes meta fetch error:', err);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await communicationAPI.getLogs({
        channel: logChannelFilter,
        search: logSearch
      });
      if (res.success && res.data.logs) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.warn('Communication logs error:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Re-fetch logs when filter or search changes
  useEffect(() => {
    fetchLogs();
  }, [logChannelFilter, logSearch]);

  // Email Template Presets
  const applyEmailTemplate = (type) => {
    setEmailTemplate(type);
    switch (type) {
      case 'Attendance Alert':
        setEmailSubject('Daily Attendance Advisory — Student Absence Notice');
        setEmailMessage(
          'Dear Parent / Guardian,\n\nThis notification is to inform you that your child was recorded as ABSENT or LATE for morning roll-call today. If this absence was pre-arranged or due to medical reasons, please submit a note or contact the administrative office.'
        );
        break;
      case 'Fee Payment Reminder':
        setEmailSubject('SchoolSphere Tuition & Ancillary Fee Reminder — Session 2026-2027');
        setEmailMessage(
          'Dear Parent / Guardian,\n\nA friendly reminder that the tuition fee installment is due for settlement. You can securely review the itemized breakdown and make online debit/credit card payments directly from your parent portal.'
        );
        break;
      case 'Exam Timetable':
        setEmailSubject('Official Examination Timetable & Syllabus Guidelines');
        setEmailMessage(
          'Dear Parents and Students,\n\nThe upcoming semester examination timetable and room venue assignments have been officially published. Please inspect the Examination Hub on your dashboard for detailed subject schedules and permitted materials.'
        );
        break;
      case 'Emergency Notice':
        setEmailSubject('URGENT: Campus Advisory & Operational Notice');
        setEmailMessage(
          'Dear SchoolSphere Community,\n\nPlease be informed of an urgent campus schedule adjustment. All afternoon transport routes and after-school extracurricular activities will conclude early today. Please monitor further notifications.'
        );
        break;
      default:
        setEmailSubject('Institutional Bulletin — SchoolSphere International Academy');
        setEmailMessage(
          'Dear Valued SchoolSphere Community Member,\n\nWe are pleased to share the latest educational updates and academic achievements from our faculty and student cohorts.'
        );
        break;
    }
  };

  // WhatsApp Template Presets
  const applyWhatsAppTemplate = (type) => {
    setWaTemplate(type);
    switch (type) {
      case 'Attendance Alert':
        setWaMessage(
          'Aarav Sharma has been marked PRESENT at SchoolSphere International Academy today on 12/11/2026 at 08:15 AM.'
        );
        break;
      case 'Fee Reminder':
        setWaMessage(
          'Tuition fee reminder for Aarav Sharma: Outstanding balance $1,250 due on 22/11/2026. Settle online via parent portal.'
        );
        break;
      case 'Exam Advisory':
        setWaMessage(
          'Mid-Term Science Exam will take place tomorrow at 09:00 AM in Exam Hall 2. Ensure students carry authorized instruments.'
        );
        break;
      case 'Emergency Broadcast':
        setWaMessage(
          'URGENT ADVISORY: School will dismiss 1 hour early today due to adverse weather. Transport buses have been dispatched.'
        );
        break;
      default:
        setWaMessage(
          'SchoolSphere Bulletin: The Inter-House Robotics Exhibition commences this Friday at 10:00 AM. Parents warmly invited.'
        );
        break;
    }
  };

  // Dispatch Email Handler
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSendingEmail(true);
    setEmailTyping(true);
    try {
      const res = await communicationAPI.sendEmail({
        target: emailTarget,
        recipientEmail,
        recipientName,
        classGrade: emailClassGrade,
        subject: emailSubject,
        message: emailMessage,
        template: emailTemplate
      });

      if (res.success) {
        if (res.aiReply) {
          setEmailAIReply(res.aiReply);
        }
        showToast(
          res.aiReply ? `AI Reply: "${res.aiReply.slice(0, 80)}..."` : res.message,
          'success',
          'Email Dispatched & Reply Received'
        );
        fetchStats();
        fetchLogs();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Email Dispatch Failed');
    } finally {
      setSendingEmail(false);
      setEmailTyping(false);
    }
  };

  // Dispatch WhatsApp Handler
  const handleSendWhatsApp = async (e) => {
    e.preventDefault();
    setSendingWhatsApp(true);
    setWaTyping(true);
    try {
      const res = await communicationAPI.sendWhatsApp({
        target: waTarget,
        phone: waPhone,
        recipientName: waRecipientName,
        classGrade: waClassGrade,
        message: waMessage,
        template: waTemplate
      });

      if (res.success) {
        if (res.aiReply) {
          setWaAIReply(res.aiReply);
        }
        showToast(
          res.aiReply ? `AI Reply: "${res.aiReply.slice(0, 80)}..."` : res.message,
          'success',
          'WhatsApp Dispatched & Reply Received'
        );
        fetchStats();
        fetchLogs();
      }
    } catch (err) {
      showToast(err.message, 'error', 'WhatsApp Dispatch Failed');
    } finally {
      setSendingWhatsApp(false);
      setWaTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & GATEWAYS STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Send className="w-7 h-7 text-cyan-600" />
            <span>Communications Hub &mdash; Email &amp; WhatsApp Services</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dispatch bulk email announcements, broadcast instant WhatsApp notifications, and review delivery audit logs.
          </p>
        </div>

        {/* Live Gateways Status Badges */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-xs">
            <Mail className="w-3.5 h-3.5 text-cyan-600" />
            <span>SMTP Service: Active</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold shadow-xs">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Gateway: Ready</span>
          </div>
        </div>
      </div>

      {/* 2. KPI METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Emails Dispatched</span>
            <span className="text-xl font-black text-slate-900">{statsData?.totalEmails ?? 18}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp Messages</span>
            <span className="text-xl font-black text-emerald-700">{statsData?.totalWhatsApp ?? 14}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Today's Notifications</span>
            <span className="text-xl font-black text-teal-700">
              {(statsData?.todayEmails || 0) + (statsData?.todayWhatsApp || 0) + 4}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Successful Delivery</span>
            <span className="text-xl font-black text-cyan-800">99.8%</span>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'email'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Dispatch Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>WhatsApp Notification Center</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'logs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Delivery & Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('triggers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'triggers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Automated Triggers</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: EMAIL DISPATCH STUDIO                             */}
      {/* ======================================================== */}
      {activeTab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Email Composer Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Compose Institutional Email</h3>
              <p className="text-xs text-slate-500">
                Dispatches responsive HTML emails formatted with official SchoolSphere branding.
              </p>
            </div>

            {/* Quick Template Pills */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Quick Preset Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'General Notice',
                  'Attendance Alert',
                  'Fee Payment Reminder',
                  'Exam Timetable',
                  'Emergency Notice'
                ].map((tpl) => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => applyEmailTemplate(tpl)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                      emailTemplate === tpl
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Recipient Target Audience *
                  </label>
                  <select
                    value={emailTarget}
                    onChange={(e) => setEmailTarget(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                  >
                    <option value="all_parents">All Parents (Academy Wide)</option>
                    <option value="all_teachers">All Teaching Faculty</option>
                    <option value="class_grade">Specific Class / Grade Cohort</option>
                    <option value="individual">Single Recipient / Individual Email</option>
                  </select>
                </div>

                {emailTarget === 'class_grade' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Select Class Cohort *
                    </label>
                    <select
                      value={emailClassGrade}
                      onChange={(e) => setEmailClassGrade(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                    >
                      {(classesList.length > 0 ? classesList : ['Class 10', 'Class 8', 'Class 5', 'Class 2']).map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {emailTarget === 'individual' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        pattern={SECURITY_PATTERNS.name.pattern}
                        title={SECURITY_PATTERNS.name.title}
                        maxLength={80}
                        onChange={(e) => setRecipientName(sanitizeInputText(e.target.value))}
                        placeholder="e.g. Robert Vance"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Recipient Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={recipientEmail}
                        pattern={SECURITY_PATTERNS.email.pattern}
                        title={SECURITY_PATTERNS.email.title}
                        maxLength={120}
                        onChange={(e) => setRecipientEmail(e.target.value.trim())}
                        placeholder="parent@schoolsphere.com"
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  pattern={SECURITY_PATTERNS.titleText.pattern}
                  title={SECURITY_PATTERNS.titleText.title}
                  maxLength={150}
                  onChange={(e) => setEmailSubject(sanitizeInputText(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Message Content *
                </label>
                <textarea
                  required
                  rows={6}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-cyan-600 shadow-xs font-sans"
                />
              </div>

              {/* Instant Multilingual AI Reply Card */}
              <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Instant Multilingual AI Reply (Auto-matches your language):</span>
                  </div>
                  {emailTyping && (
                    <span className="text-[11px] text-cyan-700 animate-pulse font-semibold">Generating reply...</span>
                  )}
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white/90 p-2.5 rounded-lg border border-cyan-100 whitespace-pre-wrap">
                  {emailAIReply || 'Type any inquiry in Hindi, Urdu, or English to preview the automated AI response.'}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  <Send className={`w-4 h-4 ${sendingEmail ? 'animate-pulse' : ''}`} />
                  <span>{sendingEmail ? 'Dispatched in Background...' : 'Dispatch Email Notice & Get Reply'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Real-time Email Preview Card */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Live Responsive Email Preview
            </span>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden text-xs">
              {/* Fake Email Client Window Bar */}
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="font-semibold text-slate-600 truncate max-w-[200px]">
                  {emailSubject || 'Subject Preview'}
                </span>
                <span className="text-[10px]">Just Now</span>
              </div>

              {/* Email Content Box */}
              <div className="p-5 space-y-4 bg-slate-50/50">
                {/* School Header Banner */}
                <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-4 rounded-xl text-white flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-extrabold text-sm block">SchoolSphere</span>
                    <span className="text-[9px] uppercase tracking-wider opacity-90">International Academy</span>
                  </div>
                  <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    Official Notice
                  </span>
                </div>

                {/* Email Body */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs">{emailSubject}</h4>
                  <p className="text-[11px] text-slate-500">
                    Dear {recipientName || (emailTarget === 'all_parents' ? 'SchoolSphere Parents' : 'Community Member')},
                  </p>
                  <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {emailMessage}
                  </p>
                  <div className="p-2.5 bg-cyan-50/80 rounded-lg border border-cyan-200 text-[10px] text-cyan-800">
                    Category: <strong>{emailTemplate}</strong> &bull; Portal Access Enabled
                  </div>
                  <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                    Office of Academic Communications &bull; SchoolSphere International Academy
                  </p>
                </div>

                {/* Automated Inbound AI Response Thread */}
                <div className="bg-white p-4 rounded-xl border border-cyan-200 shadow-xs space-y-2 border-l-4 border-l-cyan-600">
                  <div className="flex items-center justify-between text-[11px] text-cyan-800 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Inbound AI Response — Academic Office</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Re: {emailSubject}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Dear {recipientName || 'Community Member'},
                  </p>
                  <p className="text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap bg-cyan-50/60 p-2.5 rounded-lg border border-cyan-100">
                    {emailTyping ? 'Generating AI response...' : emailAIReply}
                  </p>
                  <p className="text-[9px] text-slate-400 pt-1">
                    Official Multilingual AI Dispatch • SchoolSphere International Academy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: WHATSAPP NOTIFICATION CENTER                      */}
      {/* ======================================================== */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* WhatsApp Broadcast Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Broadcast WhatsApp Alert</h3>
              <p className="text-xs text-slate-500">
                Dispatches instantaneous WhatsApp messages to parents and faculty with delivery confirmations.
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                WhatsApp Preset Formats
              </label>
              <div className="flex flex-wrap gap-2">
                {['Attendance Alert', 'Fee Reminder', 'Exam Advisory', 'Emergency Broadcast'].map((tpl) => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => applyWhatsAppTemplate(tpl)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                      waTemplate === tpl
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tpl}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendWhatsApp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Audience Target *
                  </label>
                  <select
                    value={waTarget}
                    onChange={(e) => setWaTarget(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                  >
                    <option value="all_parents">All Parents with WhatsApp</option>
                    <option value="class_grade">Specific Class Cohort</option>
                    <option value="individual">Direct Phone Number</option>
                  </select>
                </div>

                {waTarget === 'class_grade' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Class Cohort
                    </label>
                    <select
                      value={waClassGrade}
                      onChange={(e) => setWaClassGrade(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                    >
                      {(classesList.length > 0 ? classesList : ['Class 10', 'Class 8', 'Class 5', 'Class 2']).map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {waTarget === 'individual' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Recipient Mobile Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={waPhone}
                      pattern={SECURITY_PATTERNS.phone.pattern}
                      title={SECURITY_PATTERNS.phone.title}
                      maxLength={25}
                      onChange={(e) => setWaPhone(sanitizeInputText(e.target.value))}
                      placeholder="+1 (555) 300-0001"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  WhatsApp Message Text *
                </label>
                <textarea
                  required
                  rows={5}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-cyan-600 shadow-xs font-mono"
                />
              </div>

              {/* Instant Multilingual AI Reply Card */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Instant Multilingual AI Response (Auto-matches your language):</span>
                  </div>
                  {waTyping && (
                    <span className="text-[11px] text-emerald-700 animate-pulse font-semibold">Generating reply...</span>
                  )}
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white/90 p-2.5 rounded-lg border border-emerald-100 whitespace-pre-wrap">
                  {waAIReply || 'Type any question in Hindi, Urdu, or English to receive an instant reply.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={sendingWhatsApp}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{sendingWhatsApp ? 'Sending via Gateway...' : 'Send WhatsApp Broadcast & Get Reply'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Interactive Live WhatsApp Chat Screen Preview */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Simulated WhatsApp Mobile Preview
            </span>

            <div className="max-w-[340px] mx-auto bg-slate-900 rounded-[32px] p-3 shadow-xl border-4 border-slate-800">
              <div className="bg-[#0b141a] rounded-[24px] overflow-hidden flex flex-col h-[520px]">
                {/* Top WhatsApp Bar */}
                <div className="bg-[#1f2c34] p-3 flex items-center gap-3 text-white">
                  <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs">
                    S
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs block truncate">SchoolSphere Official</span>
                    <span className="text-[10px] text-emerald-400 block truncate">
                      {waTyping ? 'typing...' : 'Online • Multilingual AI Ready'}
                    </span>
                  </div>
                </div>

                {/* Chat Wallpaper & Bubbles */}
                <div className="flex-1 p-3 bg-[#0c1317] space-y-3 overflow-y-auto flex flex-col justify-end">
                  {/* Sent Message Bubble */}
                  <div className="max-w-[85%] bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-xs text-[11px] space-y-1.5 self-end shadow-xs">
                    <p className="font-sans leading-relaxed whitespace-pre-wrap">{waMessage}</p>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200 font-mono">
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-cyan-400 font-bold">✓✓</span>
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  {waTyping && (
                    <div className="max-w-[70%] bg-[#202c33] text-[#e9edef] px-3.5 py-2 rounded-2xl rounded-tl-xs text-[11px] self-start flex items-center gap-2 shadow-xs">
                      <span className="text-[10px] text-emerald-400 font-semibold">AI is typing</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </span>
                    </div>
                  )}

                  {/* AI Auto-Reply Bubble (Incoming from AI Assistant) */}
                  {!waTyping && waAIReply && (
                    <div className="max-w-[88%] bg-[#202c33] text-[#e9edef] p-3 rounded-2xl rounded-tl-xs text-[11px] space-y-1.5 self-start shadow-xs border-l-2 border-emerald-500">
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                        <span>🤖 SchoolSphere AI Reply</span>
                      </div>
                      <p className="font-sans leading-relaxed whitespace-pre-wrap text-slate-100">{waAIReply}</p>
                      <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 font-mono">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom WhatsApp Input Bar Mock */}
                <div className="bg-[#1f2c34] p-2 flex items-center gap-2">
                  <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 text-[11px] text-slate-300 truncate">
                    {waTyping ? 'Generating AI reply...' : 'Type or send above for instant AI reply'}
                  </div>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 cursor-pointer"
                    title="Send Message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: DELIVERY & AUDIT LOGS                             */}
      {/* ======================================================== */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Communication Delivery Logs</h3>
              <p className="text-xs text-slate-500">
                Audited register of all dispatched emails, WhatsApp transmissions, and gateway statuses.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={logChannelFilter}
                onChange={(e) => setLogChannelFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-600 shadow-xs"
              >
                <option value="all">All Channels</option>
                <option value="email">Email Only</option>
                <option value="whatsapp">WhatsApp Only</option>
              </select>

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearch}
                  pattern={SECURITY_PATTERNS.search.pattern}
                  title={SECURITY_PATTERNS.search.title}
                  maxLength={100}
                  onChange={(e) => setLogSearch(sanitizeInputText(e.target.value))}
                  placeholder="Search recipient or subject..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-600 shadow-xs"
                />
              </div>
            </div>
          </div>

          {loadingLogs ? (
            <div className="p-12 text-center">
              <Loader message="Loading communication records..." />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No transmission logs match your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Subject / Template</th>
                    <th className="py-3 px-4">Message Dispatched</th>
                    <th className="py-3 px-4">🤖 AI Auto-Reply</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        {log.channel === 'email' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                            <Mail className="w-3 h-3 text-cyan-600" />
                            <span>Email</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Smartphone className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{log.recipientName || 'Enrolled Parent'}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {log.recipientEmail || log.recipientPhone || '—'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800 max-w-[180px] truncate">
                        {log.subject || log.template}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={log.message}>
                        {log.message}
                      </td>

                      <td className="py-3 px-4 max-w-[240px]">
                        {log.aiReply ? (
                          <div
                            className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed line-clamp-2"
                            title={log.aiReply}
                          >
                            <span className="font-bold text-emerald-700 mr-1">Reply:</span>
                            {log.aiReply}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">System Acknowledged</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDate(log.createdAt)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>{log.status || 'Delivered'}</span>
                        </span>
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
      {/* TAB 4: AUTOMATED NOTIFICATION TRIGGERS                   */}
      {/* ======================================================== */}
      {activeTab === 'triggers' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              System Automated Notification Triggers
            </h3>
            <p className="text-xs text-slate-500">
              Configure event-driven background alerts automatically triggered by teacher actions, bursary invoices, and examinations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Daily Absence Email Alert
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Auto-dispatches email to parents when a student is marked Absent by teacher.
                </span>
              </div>
              <input
                type="checkbox"
                checked={triggers.autoAbsenceEmail}
                onChange={(e) => setTriggers({ ...triggers, autoAbsenceEmail: e.target.checked })}
                className="w-5 h-5 text-cyan-600 rounded-md focus:ring-cyan-500"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Daily Absence WhatsApp Notice
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Instantly delivers WhatsApp notification with date and roll-call status.
                </span>
              </div>
              <input
                type="checkbox"
                checked={triggers.autoAbsenceWhatsApp}
                onChange={(e) => setTriggers({ ...triggers, autoAbsenceWhatsApp: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Fee Due Date Auto-Reminder
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Dispatches payment reminder 5 days prior to invoice due date.
                </span>
              </div>
              <input
                type="checkbox"
                checked={triggers.autoFeeReminder}
                onChange={(e) => setTriggers({ ...triggers, autoFeeReminder: e.target.checked })}
                className="w-5 h-5 text-cyan-600 rounded-md focus:ring-cyan-500"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Exam Published Parent Alert
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Alerts linked parents whenever a new examination schedule is published.
                </span>
              </div>
              <input
                type="checkbox"
                checked={triggers.autoExamPublish}
                onChange={(e) => setTriggers({ ...triggers, autoExamPublish: e.target.checked })}
                className="w-5 h-5 text-cyan-600 rounded-md focus:ring-cyan-500"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Coursework Homework Notification
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Sends homework submission instructions to student email accounts.
                </span>
              </div>
              <input
                type="checkbox"
                checked={triggers.autoHomeworkAlert}
                onChange={(e) => setTriggers({ ...triggers, autoHomeworkAlert: e.target.checked })}
                className="w-5 h-5 text-cyan-600 rounded-md focus:ring-cyan-500"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Transport Fleet Route Delay Alert
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Broadcasts WhatsApp notification to parents when bus route encounters delay.
                </span>
              </div>
              <input
                type="checkbox"
                checked={triggers.autoTransportDelay}
                onChange={(e) => setTriggers({ ...triggers, autoTransportDelay: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
