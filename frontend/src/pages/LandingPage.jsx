import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SECURITY_PATTERNS, sanitizeInputText } from '../utils/securityPatterns.js';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  BookOpen,
  FileSpreadsheet,
  Bus,
  BadgeDollarSign,
  MessageSquare,
  Bell,
  BarChart3,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Send,
  Award,
  Clock,
  ChevronRight,
  Star,
  Layers,
  Lock,
  Check,
  Zap,
  Activity,
  Building2,
  Calendar,
  Globe,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Laptop
} from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState('attendance');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    schoolName: '',
    email: '',
    phone: '',
    modules: 'Full Suite',
    message: ''
  });

  // 12 Required Features with Visual Assets & Linked Routes
  const featuresList = [
    {
      id: 'students',
      route: '/students',
      icon: GraduationCap,
      title: 'Student Management',
      desc: 'Centralized digital student dossier tracking admissions, personal health records, sibling linkage, and academic progression.',
      badge: 'Core Registry',
      image: '/features/students.jpg'
    },
    {
      id: 'teachers',
      route: '/teachers',
      icon: Users,
      title: 'Teacher Management',
      desc: 'Faculty profiles, subject specialization mapping, assigned classes, workload allocation, and performance appraisal.',
      badge: 'Faculty',
      image: '/features/teachers.jpg'
    },
    {
      id: 'attendance',
      route: '/attendance',
      icon: CalendarCheck,
      title: 'Attendance Tracking',
      desc: 'Sub-30 second morning roll call registers, student-wise percentage analytics, and automated SMS/email absence triggers.',
      badge: 'Daily Ops',
      image: '/features/attendance.jpg'
    },
    {
      id: 'fees',
      route: '/fees',
      icon: CreditCard,
      title: 'Fee Management',
      desc: 'Automated fee invoices for Tuition, Transport, and Labs with online payment settlement and smart balance alerts.',
      badge: 'Finance',
      image: '/features/fees.jpg'
    },
    {
      id: 'exams',
      route: '/exams',
      icon: FileSpreadsheet,
      title: 'Examination Management',
      desc: 'Term assessment timetable scheduling, room allocation, marks roster entry, rank calculations, and official printable report cards.',
      badge: 'Assessments',
      image: '/features/exams.jpg'
    },
    {
      id: 'homework',
      route: '/homework',
      icon: BookOpen,
      title: 'Homework & Coursework',
      desc: 'Digital assignment distribution with PDF worksheets, student online submission queue, and teacher grading remarks.',
      badge: 'Curriculum',
      image: '/features/homework.jpg'
    },
    {
      id: 'transport',
      route: '/transport',
      icon: Bus,
      title: 'Transport Management',
      desc: 'Fleet vehicle route mapping, bus driver logs, pickup point assignments, and real-time transit delay advisories.',
      badge: 'Logistics',
      image: '/features/transport.jpg'
    },
    {
      id: 'payroll',
      route: '/payroll',
      icon: BadgeDollarSign,
      title: 'Staff Payroll',
      desc: 'Monthly teacher salary disbursements, allowances, tax deductions, and auditable institutional payslips.',
      badge: 'HR & Accounts',
      image: '/features/payroll.jpg'
    },
    {
      id: 'notices',
      route: '/notices',
      icon: Bell,
      title: 'Notices & Circulars',
      desc: 'Official institutional bulletin boards, academic calendars, event announcements, and emergency campus circulars.',
      badge: 'Community',
      image: '/features/notices.jpg'
    },
    {
      id: 'chat',
      route: '/chat',
      icon: MessageSquare,
      title: 'Chat & Communication',
      desc: 'Secure real-time 1-on-1 messaging between parents and class teachers with instant unread badges and delivery receipts.',
      badge: 'Real-time',
      image: '/features/chat.jpg'
    },
    {
      id: 'reports',
      route: '/reports',
      icon: BarChart3,
      title: 'Executive Reports',
      desc: 'Statistical institutional analytics covering cohort attendance trajectories, revenue realization, and academic merits.',
      badge: 'Analytics',
      image: '/features/reports.jpg'
    },
    {
      id: 'ai-exam',
      route: '/ai-exam',
      icon: Sparkles,
      title: 'AI Exam Assistance',
      desc: 'Google Gemini AI engine synthesizes curriculum question papers, auto-grades MCQs, and identifies weak subject cohorts.',
      badge: 'Gemini AI',
      image: '/features/ai-exam.jpg'
    }
  ];

  // 10 Major Interactive Modules with Linked Routes
  const modulesList = [
    {
      id: 'students',
      route: '/students',
      label: 'Students',
      icon: GraduationCap,
      summary: 'Biographical registry, admission onboarding, medical profiles, and academic journey tracking.',
      stats: '154 Active Scholars &bull; 100% Enrollment Verified'
    },
    {
      id: 'attendance',
      route: '/attendance',
      label: 'Attendance',
      icon: CalendarCheck,
      summary: 'Digital roll call register with real-time analytics and parent absence broadcast dispatches.',
      stats: '98.2% Daily Presence &bull; &lt; 30s Class Registers'
    },
    {
      id: 'fees',
      route: '/fees',
      label: 'Fees',
      icon: CreditCard,
      summary: 'Multi-category fee structures (Tuition, Transport, Lab, Uniforms) with instant digital receipts.',
      stats: '$48,600 Collected &bull; 86.8% Collection Efficiency'
    },
    {
      id: 'homework',
      route: '/homework',
      label: 'Homework',
      icon: BookOpen,
      summary: 'Structured assignment distribution with digital worksheet attachments and teacher review marks.',
      stats: '24 Weekly Submissions &bull; 92% On-Time Completion'
    },
    {
      id: 'exams',
      route: '/exams',
      label: 'Exams',
      icon: FileSpreadsheet,
      summary: 'Examination schedules, mark sheets, grade point calculations, and printable formal report cards.',
      stats: 'Term II Finals Scheduled &bull; Instant Report Cards'
    },
    {
      id: 'transport',
      route: '/transport',
      label: 'Transport',
      icon: Bus,
      summary: 'Bus route allocation, driver records, stop locations, and real-time dispatch updates.',
      stats: '6 Active Campus Routes &bull; 100% Driver Vetting'
    },
    {
      id: 'payroll',
      route: '/payroll',
      label: 'Payroll',
      icon: BadgeDollarSign,
      summary: 'Faculty salary calculations, tax breakdowns, direct bank disbursements, and PDF payslips.',
      stats: '24 Faculty Disbursed &bull; Zero Pending Audit Items'
    },
    {
      id: 'chat',
      route: '/chat',
      label: 'Chat',
      icon: MessageSquare,
      summary: 'Encrypted real-time messaging between authorized parents and department subject teachers.',
      stats: 'Real-time WebSocket Sync &bull; Read Receipts Active'
    },
    {
      id: 'notices',
      route: '/notices',
      label: 'Notices',
      icon: Bell,
      summary: 'Targeted institutional bulletins for faculty, parents, and secondary scholars.',
      stats: '12 Active Broadcasts &bull; Instant Multi-Channel Alerts'
    },
    {
      id: 'reports',
      route: '/reports',
      label: 'Reports',
      icon: BarChart3,
      summary: 'Executive dashboards tracking campus KPI metrics, academic growth, and revenue trends.',
      stats: 'Interactive Charts &bull; Instant Excel/PDF Exports'
    }
  ];

  // 8 Specific Benefits for Why Choose Us
  const benefitsList = [
    {
      title: 'Centralized School Management',
      desc: 'All institutional operations—admissions, academics, finance, and logistics—live in one synchronized system.'
    },
    {
      title: 'Faster Administration',
      desc: 'Reduce administrative overhead by up to 75% with automated daily roll calls, fee receipts, and report card generation.'
    },
    {
      title: 'Better Parent Communication',
      desc: 'Keep families continuously engaged with automated WhatsApp notifications, email alerts, and real-time chat.'
    },
    {
      title: 'Real-Time Attendance Telemetry',
      desc: 'Instant visibility into daily presence rates with automated absence dispatch to parents within seconds of morning roll call.'
    },
    {
      title: 'Transparent Fee Tracking',
      desc: 'Clear, itemized invoices with real-time remaining balance calculations and secure digital receipts.'
    },
    {
      title: 'Digital Examination Management',
      desc: 'Schedule exams, input marks with automatic rank calculations, and generate institutional report cards with window printing.'
    },
    {
      title: 'Secure Role-Based Access Control',
      desc: 'Strict isolation separating Super Admin, Principal, Teacher, Parent, and Student portals to protect sensitive data.'
    },
    {
      title: 'Scalable Enterprise Architecture',
      desc: 'Engineered on Node.js, Express, MongoDB, and React with zero-latency cloud responsiveness for thousands of students.'
    }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({
        name: '',
        schoolName: '',
        email: '',
        phone: '',
        modules: 'Full Suite',
        message: ''
      });
    }, 6000);
  };

  const activeModuleData = modulesList.find((m) => m.id === selectedModule) || modulesList[1];
  const ActiveIcon = activeModuleData.icon;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-cyan-500 selection:text-white font-sans overflow-x-hidden relative scroll-smooth">
      {/* Clean Premium Academic Background Layer (Removed watermark image for crisp readability) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft white radiant tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#e0f7fa]/70 via-[#ecfeff]/60 to-[#f8fafc]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-100/40 via-transparent to-teal-100/30 pointer-events-none" />
      </div>

      {/* Background Soft Glowing Ambient Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-200/40 blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] rounded-full bg-teal-200/30 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-10 w-[550px] h-[550px] rounded-full bg-sky-200/35 blur-[140px] pointer-events-none z-0" />

      {/* Subtle Micro-Dot Tech Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none z-0" />

      {/* ======================================================== */}
      {/* 1. NAVBAR                                                */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition transform">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                SchoolSphere
              </span>
              <span className="block text-[9px] font-bold tracking-widest uppercase text-cyan-700">
                Management System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <a href="#home" className="hover:text-cyan-600 transition">Home</a>
            <a href="#about" className="hover:text-cyan-600 transition">About</a>
            <a href="#features" className="hover:text-cyan-600 transition">Features</a>
            <a href="#modules" className="hover:text-cyan-600 transition">Modules</a>
            <a href="#why-us" className="hover:text-cyan-600 transition">Why Choose Us</a>
            <a href="#contact" className="hover:text-cyan-600 transition">Contact</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-300/80 transition"
            >
              Login
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-300 hover:from-cyan-300 hover:to-teal-200 rounded-xl shadow-md shadow-cyan-500/20 transition transform hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-3 pb-6 bg-white border-b border-slate-200 space-y-3 animate-in fade-in shadow-xl">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800 hover:text-cyan-600"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800 hover:text-cyan-600"
            >
              About
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800 hover:text-cyan-600"
            >
              Features
            </a>
            <a
              href="#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800 hover:text-cyan-600"
            >
              Modules
            </a>
            <a
              href="#why-us"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800 hover:text-cyan-600"
            >
              Why Choose Us
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-800 hover:text-cyan-600"
            >
              Contact
            </a>

            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <Link
                to="/login"
                className="w-1/2 py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 rounded-xl border border-slate-300"
              >
                Login
              </Link>
              <Link
                to="/login"
                className="w-1/2 py-2.5 text-center text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 rounded-xl shadow-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ======================================================== */}
      {/* 2. HERO SECTION WITH BACKGROUND GRADUATE STUDENT IMAGE   */}
      {/* ======================================================== */}
      <section id="home" className="relative z-10 pt-16 pb-24 md:pt-28 md:pb-36 overflow-hidden">
        {/* Right-Side Academic Graduate Background Image */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[54%] xl:w-[50%] pointer-events-none select-none z-0 overflow-hidden">
          <img
            src="/graduate-student.jpg"
            alt="SchoolSphere Academic Honors Graduate"
            className="w-full h-full object-cover object-top lg:object-[center_15%] opacity-20 lg:opacity-95 transition-opacity duration-500"
          />
          {/* Smooth Fade to Left: Blends smoothly with light background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f8fafc] via-[#f8fafc]/80 lg:via-[#f8fafc]/35 to-transparent" />
          {/* Smooth Fade to Bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-transparent to-transparent" />
          {/* Smooth Fade to Top */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc]/80 via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-7 text-left animate-in fade-in slide-in-from-left duration-700">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50/90 border border-cyan-200/80 shadow-xs backdrop-blur-xs">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-800">
                Intelligent School Cloud
              </span>
            </div>

            {/* Exact Required Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-slate-950">
              Smart School Management.{' '}
              <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-600 bg-clip-text text-transparent">
                One Powerful Platform.
              </span>
            </h1>

            {/* Exact Required Supporting Text */}
            <p className="text-base sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl">
              Manage students, teachers, attendance, examinations, fees, communication, transport and school operations from one intelligent platform.
            </p>

            {/* Exact Required Buttons: Get Started & Login */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-base font-black rounded-2xl shadow-xl shadow-cyan-500/25 border border-cyan-300 transition transform hover:-translate-y-1 flex items-center gap-2.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/login"
                className="px-8 py-4 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-800 text-base font-bold rounded-2xl border border-slate-300 shadow-sm transition flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-cyan-600" />
                <span>Login</span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-slate-900 text-sm">4.9 / 5</span>
                <span className="text-slate-500">(250+ Schools)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">Role-Based Access Control</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-600" />
                <span className="font-semibold text-slate-800">Real-Time Telemetry</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. ABOUT SECTION (ALL 8 REQUIRED OPERATIONAL AREAS)      */}
      {/* ======================================================== */}
      <section id="about" className="py-24 bg-white/80 backdrop-blur-sm border-y border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: About Text & Mission */}
            <div className="lg:col-span-6 space-y-6">
              <span className="px-3.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-extrabold uppercase tracking-widest border border-cyan-200">
                About SchoolSphere
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
                Modernizing Academic Institutions from the Ground Up
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                SchoolSphere is a unified institutional operating system designed to digitize daily school operations. It bridges the gap between administrators, teachers, parents, and students by turning cumbersome manual paperwork into automated, secure cloud workflows.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200/80">
                  <h4 className="text-2xl font-black text-cyan-700">100%</h4>
                  <p className="text-xs text-slate-600 mt-1 font-medium">Digital Paperless Campus</p>
                </div>
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80">
                  <h4 className="text-2xl font-black text-teal-700">&lt; 30s</h4>
                  <p className="text-xs text-slate-600 mt-1 font-medium">Morning Attendance Roll Call</p>
                </div>
              </div>

              {/* Authentic Campus Preview Card */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md group">
                <img
                  src="/classroom-students.jpg"
                  alt="Students and Faculty in Session"
                  className="w-full h-44 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Interactive Smart Classroom Experience
                  </span>
                  <span className="text-[10px] uppercase font-bold text-cyan-300 bg-cyan-900/80 backdrop-blur-md px-2 py-0.5 rounded border border-cyan-400/30">
                    Active Faculty
                  </span>
                </div>
              </div>
            </div>

            {/* Right: 8 Core Operational Pillars Listed explicitly */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { title: 'Student Management', desc: 'Centralized bio data, admission records, and sibling linkage.' },
                { title: 'Teacher Management', desc: 'Staff qualifications, class allocations, and department rosters.' },
                { title: 'Attendance', desc: 'Daily class registers, percentage rates, and absence parent alerts.' },
                { title: 'Fees & Invoices', desc: 'Tuition invoicing, payment receipts, and balance reminders.' },
                { title: 'Examinations', desc: 'Exam scheduling, marks rosters, and automated rank report cards.' },
                { title: 'Communication', desc: 'Multi-channel WhatsApp alerts, email circulars, and teacher chat.' },
                { title: 'Transport', desc: 'Bus route tracking, driver schedules, and arrival advisories.' },
                { title: 'Reports & Audit', desc: 'Institutional analytics, finance summaries, and compliance logs.' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-cyan-50/60 border border-slate-200 hover:border-cyan-400 transition group shadow-xs"
                >
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>{item.title}</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 pl-6 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. FEATURES SECTION (ALL 12 REQUIRED FEATURES)           */}
      {/* ======================================================== */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="px-3.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-extrabold uppercase tracking-widest border border-cyan-200">
              Comprehensive Features
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              12 Enterprise Pillars for Complete School Excellence
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Explore the dedicated tools designed to optimize every facet of primary and secondary educational management.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuresList.map((f) => {
              const IconComp = f.icon;
              return (
                <Link
                  key={f.id}
                  to={f.route}
                  className="rounded-3xl bg-white border-2 border-slate-200/80 hover:border-cyan-400 shadow-sm hover:shadow-2xl hover:shadow-cyan-400/25 transition-all duration-300 ease-out group flex flex-col justify-between overflow-hidden transform hover:-translate-y-2.5 cursor-pointer block no-underline text-inherit"
                >
                  {/* Clean Visual Image Banner without Obstructions */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <img
                      src={f.image}
                      alt={f.title}
                      className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Card Content with Icon & Clean Typography */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center shrink-0 group-hover:bg-cyan-500 group-hover:text-white transition-colors shadow-xs">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-black text-slate-900 group-hover:text-cyan-700 transition-colors tracking-tight">
                          {f.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {f.desc}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-cyan-700 group-hover:text-cyan-800 transition">
                      <span className="flex items-center gap-1.5">
                        <span>Explore Capability</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. MODULES SECTION (INTERACTIVE EXPLORER)                */}
      {/* ======================================================== */}
      <section id="modules" className="py-24 bg-slate-100/70 backdrop-blur-sm border-y border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <span className="px-3.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-extrabold uppercase tracking-widest border border-cyan-200">
              Interactive Modules Explorer
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Major Modules in One Connected Ecosystem
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Click any module below to inspect its operational scope. Public visitors explore structural previews while protected data remains strictly secured.
            </p>
          </div>

          {/* Module Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {modulesList.map((m) => {
              const active = selectedModule === m.id;
              const IconItem = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModule(m.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <IconItem className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Module Highlight Display */}
          <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-white border-2 border-cyan-200 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center">
                  <ActiveIcon className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-700">
                    Official Module Specification
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    {activeModuleData.label} Management
                  </h3>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold">
                Protected Enterprise Component
              </div>
            </div>

            <div className="py-6 space-y-4">
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {activeModuleData.summary}
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs sm:text-sm text-slate-700">
                <Activity className="w-4 h-4 text-cyan-600 shrink-0" />
                <span className="font-semibold text-slate-900">Live Benchmark:</span>
                <span dangerouslySetInnerHTML={{ __html: activeModuleData.stats }} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-slate-500">Access this module directly in the institutional workspace:</span>
              <Link
                to={activeModuleData.route}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <span>Launch {activeModuleData.label} Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. WHY CHOOSE US (ALL 8 BENEFITS SPECIFIED)              */}
      {/* ======================================================== */}
      <section id="why-us" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="px-3.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-extrabold uppercase tracking-widest border border-cyan-200">
              Why Choose SchoolSphere
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Engineered for Reliability, Speed & Institutional Peace of Mind
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Compare why leading academies choose SchoolSphere to run their mission-critical operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefitsList.map((b, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white hover:bg-gradient-to-b hover:from-white hover:to-cyan-50/50 border-2 border-slate-200/80 hover:border-cyan-400 shadow-sm hover:shadow-2xl hover:shadow-cyan-400/25 transition-all duration-300 ease-out flex flex-col justify-between group transform hover:-translate-y-2.5 cursor-pointer"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-black text-xs mb-3.5 border border-cyan-200 group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-teal-400 group-hover:text-slate-950 group-hover:border-cyan-300 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-cyan-500/30 transition-all duration-300">
                    0{idx + 1}
                  </div>
                  <h4 className="text-base font-black text-slate-900 group-hover:text-cyan-700 transition-colors mb-2">
                    {b.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {b.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-cyan-700 group-hover:text-cyan-800 font-bold transition-colors">
                  <Check className="w-3.5 h-3.5 text-cyan-600 group-hover:scale-110 transition-transform" />
                  <span>Verified Standard</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. CONTACT / CTA SECTION                                 */}
      {/* ======================================================== */}
      <section id="contact" className="py-24 bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0]/60 border-t border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Exact Required Final CTA Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700 shadow-md">
                <Building2 className="w-7 h-7" />
              </div>

              {/* Exact CTA Heading */}
              <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                Transform Your School Into a Smarter Digital Campus
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Join forward-thinking academic institutions streamlining attendance, digital examinations, fee ledgers, and communications with SchoolSphere.
              </p>

              {/* Exact Required CTA Button: Get Started */}
              <div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-base font-black rounded-2xl shadow-xl shadow-cyan-500/25 border border-cyan-300 transition transform hover:-translate-y-1"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Quick Institutional Support Details */}
              <div className="pt-6 border-t border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-600" />
                  <span>admissions@schoolsphere.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-cyan-600" />
                  <span>+1 (800) 555-SPHERE &bull; Mon - Fri 8:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  <span>Silicon Valley Academy Campus, CA</span>
                </div>
              </div>
            </div>

            {/* Right: Contact / Demo Request Form */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Schedule an Institutional Briefing</h3>
              <p className="text-xs text-slate-500 mb-6">Our campus deployment engineers will configure your demo portal within 2 hours.</p>

              {contactSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-2 animate-in fade-in">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-slate-900">Inquiry Received Successfully</h4>
                  <p className="text-xs text-emerald-700">
                    Thank you. A SchoolSphere specialist will reach out with your school onboarding package shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        pattern={SECURITY_PATTERNS.name.pattern}
                        title={SECURITY_PATTERNS.name.title}
                        maxLength={80}
                        onChange={(e) => setContactForm({ ...contactForm, name: sanitizeInputText(e.target.value) })}
                        placeholder="Dr. Evelyn Sterling"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">School / Academy Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.schoolName}
                        pattern={SECURITY_PATTERNS.name.pattern}
                        title={SECURITY_PATTERNS.name.title}
                        maxLength={100}
                        onChange={(e) => setContactForm({ ...contactForm, schoolName: sanitizeInputText(e.target.value) })}
                        placeholder="Greenwood International"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Official Work Email</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        pattern={SECURITY_PATTERNS.email.pattern}
                        title={SECURITY_PATTERNS.email.title}
                        maxLength={100}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value.trim() })}
                        placeholder="principal@school.edu"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        pattern={SECURITY_PATTERNS.phone.pattern}
                        title={SECURITY_PATTERNS.phone.title}
                        maxLength={25}
                        onChange={(e) => setContactForm({ ...contactForm, phone: sanitizeInputText(e.target.value) })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Special Requirements / Message</label>
                    <textarea
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Tell us about student count, required modules (e.g., Gemini AI exam papers, WhatsApp alerts)..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white resize-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition"
                  >
                    Submit Deployment Inquiry
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. FOOTER                                                */}
      {/* ======================================================== */}
      <footer className="py-14 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-white text-base">SchoolSphere</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The unified, intelligent school management platform empowering educational excellence across global campuses.
              </p>
              <div className="text-[11px] text-cyan-400 font-semibold">
                Grade A+ Accredited &bull; IB World Compatible
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-2.5">
              <h5 className="font-extrabold text-white uppercase tracking-wider text-xs">Quick Links</h5>
              <ul className="space-y-2">
                <li><a href="#home" className="hover:text-cyan-400 transition">Home</a></li>
                <li><a href="#about" className="hover:text-cyan-400 transition">About System</a></li>
                <li><a href="#features" className="hover:text-cyan-400 transition">All 12 Features</a></li>
                <li><a href="#modules" className="hover:text-cyan-400 transition">Modules Explorer</a></li>
                <li><a href="#why-us" className="hover:text-cyan-400 transition">Why Choose Us</a></li>
              </ul>
            </div>

            {/* Col 3: Modules */}
            <div className="space-y-2.5">
              <h5 className="font-extrabold text-white uppercase tracking-wider text-xs">Major Modules</h5>
              <ul className="space-y-2">
                <li><Link to="/login" className="hover:text-cyan-400 transition">Student Admissions</Link></li>
                <li><Link to="/login" className="hover:text-cyan-400 transition">Attendance Telemetry</Link></li>
                <li><Link to="/login" className="hover:text-cyan-400 transition">Fee Billing & Invoices</Link></li>
                <li><Link to="/login" className="hover:text-cyan-400 transition">Examinations & Merit</Link></li>
                <li><Link to="/login" className="hover:text-cyan-400 transition">Google Gemini AI Studio</Link></li>
              </ul>
            </div>

            {/* Col 4: Contact & Access */}
            <div className="space-y-2.5">
              <h5 className="font-extrabold text-white uppercase tracking-wider text-xs">Institutional Access</h5>
              <p className="text-slate-400 text-xs">
                Already registered with SchoolSphere? Enter your institution portal credentials.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Portal Login</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} SchoolSphere Management System. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-cyan-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-cyan-400 cursor-pointer">Terms of Service</span>
              <span className="hover:text-cyan-400 cursor-pointer">Security Compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
