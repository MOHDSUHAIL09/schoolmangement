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
  Laptop,
  CheckCheck,
  TrendingUp,
  Cpu,
  Shield,
  User,
  Play
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
      title: 'Chat Room & Communication',
      desc: 'Private 1-on-1 real-time messaging supporting Student ↔ Teacher and Parent ↔ Teacher with verified records assistant.',
      badge: 'Private Room',
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
      route: '/ai-exam-generator',
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
      label: 'Chat Room',
      icon: MessageSquare,
      summary: 'Strictly isolated 1-on-1 real-time messaging between Students, Parents, and Teachers.',
      stats: '100% Isolated Rooms &bull; Zero Cross-Leakage'
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
      title: 'Centralized School Operations',
      desc: 'All institutional operations—admissions, academics, finance, and logistics—live in one synchronized system.'
    },
    {
      title: 'Rapid Administration Workflows',
      desc: 'Reduce administrative overhead by up to 75% with automated daily roll calls, fee receipts, and report card generation.'
    },
    {
      title: 'Multilingual Parent Communication',
      desc: 'Keep families continuously engaged with automated notifications, email alerts, and instant multilingual AI chat in Hindi, English, and Urdu.'
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
    <div className="min-h-screen bg-[#FFF1EB] text-[#1E232F] selection:bg-[#FF5E3A] selection:text-white font-sans overflow-x-hidden relative scroll-smooth">
      {/* Background Radiant Atmosphere Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#FFF1EB]" />
        {/* Soft, luminous ambient peach and coral light orbs */}
        <div className="absolute -top-32 left-1/4 w-[650px] h-[650px] rounded-full bg-[#FF5E3A]/8 blur-[160px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-[550px] h-[550px] rounded-full bg-[#FF805B]/8 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-20 w-[600px] h-[600px] rounded-full bg-[#FF5E3A]/6 blur-[160px] pointer-events-none" />
      </div>

      {/* ======================================================== */}
      {/* 1. NAVBAR                                                */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FFF1EB]/95 border-b border-[#FEEAE1]/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo / Brand with Original SchoolSphere Text */}
          <Link to="/" className="flex items-center gap-3 group" title="SchoolSphere Management System">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5E3A] p-0.5 shadow-md shadow-[#FF5E3A]/25 group-hover:scale-105 transition-all duration-300 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-[#1E232F]">
                SchoolSphere<span className="text-[#FF5E3A]">.</span>
              </span>
              <span className="block text-[9px] font-extrabold tracking-widest uppercase text-[#FF5E3A]">
                MANAGEMENT SYSTEM
              </span>
            </div>
          </Link>

          {/* Centered Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-semibold text-[#5A6272]">
            <a href="#home" className="text-[#1E232F] font-bold flex items-center gap-1.5 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E3A]" />
              <span>Home</span>
            </a>
            <a href="#about" className="hover:text-[#FF5E3A] transition-colors">
              About
            </a>
            <a href="#features" className="hover:text-[#FF5E3A] transition-colors">
              Features
            </a>
            <a href="#modules" className="hover:text-[#FF5E3A] transition-colors">
              Modules
            </a>
            <a href="#why-us" className="hover:text-[#FF5E3A] transition-colors">
              Why Choose Us
            </a>
            <a href="#contact" className="hover:text-[#FF5E3A] transition-colors">
              Contact
            </a>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-6 py-2.5 text-xs font-extrabold text-white bg-[#FF5E3A] hover:bg-[#E04826] rounded-full shadow-md shadow-[#FF5E3A]/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-xs font-bold text-[#1E232F] bg-white hover:bg-[#FFF0EB] border border-[#FEEAE1] hover:border-[#FF5E3A] rounded-full shadow-xs transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#FF5E3A]" />
                  <span>Login</span>
                </Link>
                
                <Link
                  to="/login"
                  className="px-6 py-2.5 text-xs font-extrabold text-white bg-[#FF5E3A] hover:bg-[#E04826] rounded-full shadow-md shadow-[#FF5E3A]/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white text-[#1E232F] hover:bg-[#FFF0EB] border border-[#FEEAE1]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#FF5E3A]" /> : <Menu className="w-6 h-6 text-[#FF5E3A]" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-3 pb-6 bg-[#FFF1EB]/98 backdrop-blur-xl border-b border-[#FEEAE1] space-y-3 animate-in fade-in shadow-xl">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#FF5E3A]"
            >
              • Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#5A6272] hover:text-[#FF5E3A]"
            >
              About
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#5A6272] hover:text-[#FF5E3A]"
            >
              Features
            </a>
            <a
              href="#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#5A6272] hover:text-[#FF5E3A]"
            >
              Modules
            </a>
            <a
              href="#why-us"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#5A6272] hover:text-[#FF5E3A]"
            >
              Why Choose Us
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#5A6272] hover:text-[#FF5E3A]"
            >
              Contact
            </a>

            <div className="pt-3 border-t border-[#FEEAE1] flex gap-2">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="w-full py-2.5 text-center text-xs font-bold text-white bg-[#FF5E3A] rounded-full shadow-md"
                >
                  Go to Dashboard &rarr;
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-1/2 py-2.5 text-center text-xs font-bold text-[#1E232F] bg-white border border-[#FEEAE1] rounded-full shadow-xs"
                  >
                    Login
                  </Link>
                  <Link
                    to="/login"
                    className="w-1/2 py-2.5 text-center text-xs font-bold text-white bg-[#FF5E3A] rounded-full shadow-md"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ======================================================== */}
      {/* 2. HERO SECTION WITH ORIGINAL TEXT & BACKGROUND IMAGE    */}
      {/* ======================================================== */}
      <section id="home" className="relative min-h-[640px] lg:min-h-[760px] z-10 flex items-center overflow-hidden">
        
        {/* Right-Side Full-Bleed Integrated Graduation Photograph (Seamless Fade to Left) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
          <img
            src="/aman.avif"
            onError={(e) => { e.currentTarget.src = '/graduate-student.jpg'; }}
            alt="SchoolSphere Academic Honors Graduate"
            className="w-full h-full object-cover object-[right_top] lg:object-[82%_top] opacity-90 transition-opacity duration-500"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, transparent 25%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 65%, #000 85%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 25%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 65%, #000 85%)'
            }}
          />
          {/* Seamless Top & Bottom Fades (Blends with Radiant #FFF1EB Flow) */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FFF1EB] to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#FFF1EB] via-[#FFF1EB]/80 to-transparent pointer-events-none" />
        </div>

        {/* Hero Foreground Content - Aligned on the Left Side */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 py-16 lg:py-24 w-full">
          <div className="max-w-2xl lg:max-w-xl space-y-6 text-left animate-in fade-in slide-in-from-left duration-700">
            
            {/* Premium Badge in Warm DevSkill Palette */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#FEEAE1] shadow-xs backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5E3A] animate-pulse" />
              <span className="text-[11px] font-black tracking-widest uppercase text-[#FF5E3A]">
                INTELLIGENT SCHOOL CLOUD
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF0EB] text-[#FF5E3A] font-bold border border-[#FEEAE1]">
                v2.0
              </span>
            </div>

            {/* Exact Headline with Coral Accent */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.08] text-[#1E232F]">
              Smart School <br className="hidden sm:inline" />
              Management, <br />
              <span className="text-[#FF5E3A]">
                One Powerful Platform.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-sm sm:text-base text-[#5A6272] leading-relaxed max-w-xl font-normal">
              Manage students, teachers, attendance, examinations, fees, communication, transport and school operations from one unified, intelligent platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/login"
                className="group px-7 py-3.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white text-sm font-extrabold rounded-full shadow-lg shadow-[#FF5E3A]/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('dashboard-preview');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group px-6 py-3.5 bg-white/95 backdrop-blur-md hover:bg-[#FFF0EB] text-[#1E232F] text-sm font-bold rounded-full border border-[#FEEAE1] hover:border-[#FF5E3A] shadow-xs transition-all duration-300 flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#FFF0EB] border border-[#FEEAE1] flex items-center justify-center text-[#FF5E3A] group-hover:scale-110 transition-transform">
                  <Play className="w-2.5 h-2.5 fill-[#FF5E3A] ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Trust Indicators with User Avatars */}
            <div className="flex items-center gap-3 pt-4 text-xs text-[#5A6272]">
              <div className="flex -space-x-2 overflow-hidden">
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Principal"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Faculty Head"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  alt="Academic Coordinator"
                />
              </div>
              <span className="font-semibold text-[#5A6272]">
                Trusted by <strong className="text-[#1E232F]">1000+ Schools</strong>
              </span>
            </div>

            {/* Additional Badges */}
            <div className="pt-4 border-t border-[#FEEAE1] flex flex-wrap items-center gap-6 text-xs text-[#5A6272]">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-[#1E232F]">4.9 / 5</span>
                <span className="text-[#5A6272]">(250+ Schools)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF5E3A]" />
                <span className="font-semibold text-[#1E232F]">Role-Based Access Control</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF5E3A]" />
                <span className="font-semibold text-[#1E232F]">Real-Time Telemetry</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. INTERACTIVE DASHBOARD PREVIEW SECTION                 */}
      {/* ======================================================== */}
      <section id="dashboard-preview" className="py-20 bg-[#FFF1EB] border-y border-[#FEEAE1] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="px-3.5 py-1 rounded-full bg-white text-[#FF5E3A] text-xs font-extrabold uppercase tracking-widest border border-[#FEEAE1] shadow-xs">
              Live Workspace Preview
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1E232F] tracking-tight">
              A Complete Command Center for Every Campus Role
            </h2>
            <p className="text-sm sm:text-base text-[#5A6272] leading-relaxed font-normal">
              Experience the unified dashboard interface designed for Super Admins, Principals, Faculty, and Parents.
            </p>
          </div>

          {/* Interactive Mock Dashboard Shell */}
          <div className="max-w-5xl mx-auto rounded-3xl bg-white p-2 sm:p-4 shadow-2xl shadow-[#FF5E3A]/5 border-2 border-[#FEEAE1]">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#FEEAE1] text-xs text-[#5A6272] bg-[#FFF6F2] rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-orange-400" />
                <span className="ml-2 font-mono text-[11px] text-[#FF5E3A] hidden sm:inline">https://schoolsphere.internal/dashboard</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#FF5E3A] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#FF5E3A] animate-pulse" />
                <span>Live Session • 2026-2027</span>
              </div>
            </div>

            {/* Dashboard Inner Screen */}
            <div className="bg-[#FFF6F2] rounded-2xl p-4 sm:p-8 text-[#1E232F] mt-2 space-y-6 border border-[#FEEAE1]">
              
              {/* Stat Cards Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#FEEAE1] hover:border-[#FF5E3A] shadow-xs transition-all">
                  <div className="flex items-center justify-between text-xs text-[#5A6272] font-bold uppercase tracking-wider">
                    <span>Total Scholars</span>
                    <GraduationCap className="w-4 h-4 text-[#FF5E3A]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#1E232F] mt-2">154</div>
                  <div className="text-[11px] text-[#FF5E3A] font-bold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+12% Term Enrolled</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#FEEAE1] hover:border-[#FF5E3A] shadow-xs transition-all">
                  <div className="flex items-center justify-between text-xs text-[#5A6272] font-bold uppercase tracking-wider">
                    <span>Attendance Rate</span>
                    <CalendarCheck className="w-4 h-4 text-[#FF5E3A]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#1E232F] mt-2">98.2%</div>
                  <div className="text-[11px] text-[#FF5E3A] font-bold mt-1">
                    <span>Target Met • Regular</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#FEEAE1] hover:border-[#FF5E3A] shadow-xs transition-all">
                  <div className="flex items-center justify-between text-xs text-[#5A6272] font-bold uppercase tracking-wider">
                    <span>Faculty On Duty</span>
                    <Users className="w-4 h-4 text-[#FF5E3A]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#1E232F] mt-2">24 / 24</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">
                    <span>6 Academic Depts</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#FEEAE1] hover:border-[#FF5E3A] shadow-xs transition-all">
                  <div className="flex items-center justify-between text-xs text-[#5A6272] font-bold uppercase tracking-wider">
                    <span>Fee Realization</span>
                    <CreditCard className="w-4 h-4 text-[#FF5E3A]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#1E232F] mt-2">$48,600</div>
                  <div className="text-[11px] text-[#FF5E3A] font-bold mt-1">
                    <span>86.8% Settled</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Hub Preview */}
              <div className="p-5 rounded-2xl bg-white text-[#1E232F] flex flex-col md:flex-row items-center justify-between gap-4 border border-[#FEEAE1] shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] text-[#FF5E3A] flex items-center justify-center font-bold border border-[#FEEAE1] shadow-xs">
                    <Sparkles className="w-5 h-5 animate-pulse text-[#FF5E3A]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1E232F]">Multilingual AI Chat & Academic Hub</h4>
                    <p className="text-xs text-[#5A6272]">Real-time answers in Hindi, English, Urdu, and Arabic</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-5 py-2.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white font-bold text-xs rounded-full shadow-md shadow-[#FF5E3A]/25 hover:scale-105 transition"
                  >
                    Open Live Portal ↗
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. ABOUT SECTION (ALL 8 OPERATIONAL AREAS)               */}
      {/* ======================================================== */}
      <section id="about" className="py-24 bg-[#FFF6F2] border-b border-[#FEEAE1] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: About Text & Mission */}
            <div className="lg:col-span-6 space-y-6">
              <span className="px-3.5 py-1 rounded-full bg-white text-[#FF5E3A] text-xs font-extrabold uppercase tracking-widest border border-[#FEEAE1]">
                About SchoolSphere
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1E232F] tracking-tight">
                Modernizing Academic Institutions from the Ground Up
              </h2>
              <p className="text-sm sm:text-base text-[#5A6272] leading-relaxed font-normal">
                SchoolSphere is a unified institutional operating system designed to digitize daily school operations. It bridges the gap between administrators, teachers, parents, and students by turning cumbersome manual paperwork into automated, secure cloud workflows.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white border border-[#FEEAE1] shadow-xs">
                  <h4 className="text-2xl font-black text-[#FF5E3A]">100%</h4>
                  <p className="text-xs text-[#5A6272] mt-1 font-medium">Digital Paperless Campus</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#FEEAE1] shadow-xs">
                  <h4 className="text-2xl font-black text-[#FF5E3A]">&lt; 30s</h4>
                  <p className="text-xs text-[#5A6272] mt-1 font-medium">Morning Attendance Roll Call</p>
                </div>
              </div>

              {/* Campus Preview Card */}
              <div className="relative rounded-2xl overflow-hidden border border-[#FEEAE1] shadow-lg group">
                <img
                  src="/classroom-students.jpg"
                  alt="Students and Faculty in Session"
                  className="w-full h-44 object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF5E3A] animate-pulse" />
                    Interactive Smart Classroom Experience
                  </span>
                  <span className="text-[10px] uppercase font-bold text-white bg-[#FF5E3A]/90 backdrop-blur-md px-2.5 py-0.5 rounded border border-white/30">
                    Active Faculty
                  </span>
                </div>
              </div>
            </div>

            {/* Right: 8 Core Operational Pillars */}
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
                  className="p-4 rounded-xl bg-white hover:bg-[#FFF0EB]/60 border border-[#FEEAE1] hover:border-[#FF5E3A] transition-all duration-200 group shadow-xs transform hover:-translate-y-0.5"
                >
                  <h4 className="text-xs font-bold text-[#1E232F] group-hover:text-[#FF5E3A] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FF5E3A] shrink-0 group-hover:scale-110 transition-transform" />
                    <span>{item.title}</span>
                  </h4>
                  <p className="text-[11px] text-[#5A6272] mt-1 pl-6 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. FEATURES SECTION (ALL 12 REQUIRED FEATURES)           */}
      {/* ======================================================== */}
      <section id="features" className="py-24 bg-[#FFF1EB] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="px-3.5 py-1 rounded-full bg-white text-[#FF5E3A] text-xs font-extrabold uppercase tracking-widest border border-[#FEEAE1] shadow-xs">
              Comprehensive Features
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1E232F] tracking-tight">
              12 Enterprise Pillars for Complete School Excellence
            </h2>
            <p className="text-sm sm:text-base text-[#5A6272] leading-relaxed font-normal">
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
                  className="rounded-3xl bg-white border border-[#FEEAE1] hover:border-[#FF5E3A] shadow-xs hover:shadow-xl hover:shadow-[#FF5E3A]/10 transition-all duration-300 ease-out group flex flex-col justify-between overflow-hidden transform hover:-translate-y-2 cursor-pointer block no-underline text-inherit"
                >
                  {/* Visual Image Banner */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <img
                      src={f.image}
                      alt={f.title}
                      className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none" />
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[#FF5E3A] border border-[#FEEAE1] shadow-xs">
                      {f.badge}
                    </span>
                  </div>

                  {/* Card Content with Animated Icon & Clean Typography */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#FFF0EB] border border-[#FEEAE1] text-[#FF5E3A] flex items-center justify-center shrink-0 group-hover:bg-[#FF5E3A] group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-extrabold text-[#1E232F] group-hover:text-[#FF5E3A] transition-colors tracking-tight">
                          {f.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[#5A6272] leading-relaxed font-normal">
                        {f.desc}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#FEEAE1] flex items-center text-xs font-bold text-[#FF5E3A] group-hover:text-[#E84E2A] transition">
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
      {/* 6. MODULES SECTION (INTERACTIVE EXPLORER)                */}
      {/* ======================================================== */}
      <section id="modules" className="py-24 bg-[#FFF6F2] border-y border-[#FEEAE1] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <span className="px-3.5 py-1 rounded-full bg-white text-[#FF5E3A] text-xs font-extrabold uppercase tracking-widest border border-[#FEEAE1]">
              Interactive Modules Explorer
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1E232F] tracking-tight">
              Major Modules in One Connected Ecosystem
            </h2>
            <p className="text-sm sm:text-base text-[#5A6272] leading-relaxed font-normal">
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
                  className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    active
                      ? 'bg-[#FF5E3A] text-white font-extrabold shadow-md shadow-[#FF5E3A]/25 scale-105'
                      : 'bg-white hover:bg-[#FFF0EB] text-[#5A6272] border border-[#FEEAE1] hover:border-[#FF5E3A]'
                  }`}
                >
                  <IconItem className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Module Highlight Display */}
          <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-white border-2 border-[#FEEAE1] shadow-xl shadow-[#FF5E3A]/5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#FEEAE1]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FFF0EB] border border-[#FEEAE1] text-[#FF5E3A] flex items-center justify-center shadow-xs">
                  <ActiveIcon className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF5E3A]">
                    Official Module Specification
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1E232F] tracking-tight">
                    {activeModuleData.label} Management
                  </h3>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-[#FFF0EB] border border-[#FEEAE1] text-[#FF5E3A] text-xs font-bold shadow-xs">
                Protected Enterprise Component
              </div>
            </div>

            <div className="py-6 space-y-4">
              <p className="text-sm sm:text-base text-[#5A6272] leading-relaxed font-normal">
                {activeModuleData.summary}
              </p>

              <div className="p-4 rounded-xl bg-[#FFF6F2] border border-[#FEEAE1] flex items-center gap-3 text-xs sm:text-sm text-[#5A6272] shadow-xs">
                <Activity className="w-4 h-4 text-[#FF5E3A] shrink-0" />
                <span className="font-semibold text-[#1E232F]">Live Benchmark:</span>
                <span dangerouslySetInnerHTML={{ __html: activeModuleData.stats }} />
              </div>
            </div>

            <div className="pt-6 border-t border-[#FEEAE1] flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-[#5A6272]">Access this module directly in the institutional workspace:</span>
              <Link
                to={activeModuleData.route}
                className="px-6 py-2.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white font-bold text-xs rounded-full shadow-md shadow-[#FF5E3A]/25 transition flex items-center gap-2 cursor-pointer"
              >
                <span>Launch {activeModuleData.label} Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. WHY CHOOSE US (ALL 8 BENEFITS SPECIFIED)              */}
      {/* ======================================================== */}
      <section id="why-us" className="py-24 bg-[#FFF1EB] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="px-3.5 py-1 rounded-full bg-white text-[#FF5E3A] text-xs font-extrabold uppercase tracking-widest border border-[#FEEAE1] shadow-xs">
              Why Choose SchoolSphere
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1E232F] tracking-tight">
              Engineered for Reliability, Speed &amp; Institutional Peace of Mind
            </h2>
            <p className="text-sm sm:text-base text-[#5A6272] leading-relaxed font-normal">
              Compare why leading academies choose SchoolSphere to run their mission-critical operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefitsList.map((b, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white hover:bg-white border border-[#FEEAE1] hover:border-[#FF5E3A] shadow-xs hover:shadow-xl hover:shadow-[#FF5E3A]/10 transition-all duration-300 ease-out flex flex-col justify-between group transform hover:-translate-y-2 cursor-pointer"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-[#FFF0EB] text-[#FF5E3A] flex items-center justify-center font-black text-xs mb-3.5 border border-[#FEEAE1] group-hover:bg-[#FF5E3A] group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    0{idx + 1}
                  </div>
                  <h3 className="text-base font-bold text-[#1E232F] group-hover:text-[#FF5E3A] transition-colors mb-2">
                    {b.title}
                  </h3>
                  <p className="text-xs text-[#5A6272] leading-relaxed font-normal">
                    {b.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#FEEAE1] flex items-center text-xs font-bold text-[#FF5E3A]">
                  <CheckCheck className="w-4 h-4 mr-1 text-[#FF5E3A]" />
                  <span>Institutional Standard</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. SCHEDULE DEMO / CTA SECTION                           */}
      {/* ======================================================== */}
      <section id="contact" className="py-24 bg-[#FFF6F2] border-t border-[#FEEAE1] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Final CTA Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#FEEAE1] flex items-center justify-center text-[#FF5E3A] shadow-sm">
                <Building2 className="w-7 h-7" />
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1E232F] tracking-tight leading-tight">
                Transform Your School Into a Smarter Digital Campus
              </h2>

              <p className="text-sm sm:text-base text-[#5A6272] leading-relaxed font-normal">
                Join forward-thinking academic institutions streamlining attendance, digital examinations, fee ledgers, and communications with SchoolSphere.
              </p>

              <div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#FF5E3A] hover:bg-[#E04826] text-white text-base font-bold rounded-full shadow-xl shadow-[#FF5E3A]/30 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Support Details */}
              <div className="pt-6 border-t border-[#FEEAE1] space-y-2 text-xs text-[#5A6272]">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#FF5E3A]" />
                  <span>admissions@schoolsphere.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#FF5E3A]" />
                  <span>+1 (800) 555-SPHERE &bull; Mon - Fri 8:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FF5E3A]" />
                  <span>Silicon Valley Academy Campus, CA</span>
                </div>
              </div>
            </div>

            {/* Right: Contact / Demo Request Form */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-8 sm:p-10 border border-[#FEEAE1] shadow-2xl shadow-[#FF5E3A]/5">
              <h3 className="text-xl font-bold text-[#1E232F] mb-1">Schedule an Institutional Briefing</h3>
              <p className="text-xs text-[#5A6272] mb-6">Our campus deployment engineers will configure your demo portal within 2 hours.</p>

              {contactSubmitted ? (
                <div className="p-6 rounded-2xl bg-[#FFF0EB] border border-[#FFD5C5] text-center space-y-2 animate-in fade-in">
                  <CheckCircle2 className="w-10 h-10 text-[#FF5E3A] mx-auto" />
                  <h4 className="text-base font-bold text-[#1E232F]">Inquiry Received Successfully</h4>
                  <p className="text-xs text-[#5A6272]">
                    Thank you. A SchoolSphere specialist will reach out with your school onboarding package shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#5A6272] font-bold uppercase tracking-wider mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        pattern={SECURITY_PATTERNS.name.pattern}
                        title={SECURITY_PATTERNS.name.title}
                        maxLength={80}
                        onChange={(e) => setContactForm({ ...contactForm, name: sanitizeInputText(e.target.value) })}
                        placeholder="Dr. Evelyn Sterling"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF6F2] border border-[#FEEAE1] text-[#1E232F] placeholder-slate-400 focus:outline-none focus:border-[#FF5E3A] focus:bg-white focus:ring-1 focus:ring-[#FF5E3A] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[#5A6272] font-bold uppercase tracking-wider mb-1">School / Academy Name</label>
                      <input
                        type="text"
                        required
                        value={contactForm.schoolName}
                        pattern={SECURITY_PATTERNS.name.pattern}
                        title={SECURITY_PATTERNS.name.title}
                        maxLength={100}
                        onChange={(e) => setContactForm({ ...contactForm, schoolName: sanitizeInputText(e.target.value) })}
                        placeholder="Greenwood International"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF6F2] border border-[#FEEAE1] text-[#1E232F] placeholder-slate-400 focus:outline-none focus:border-[#FF5E3A] focus:bg-white focus:ring-1 focus:ring-[#FF5E3A] transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#5A6272] font-bold uppercase tracking-wider mb-1">Official Work Email</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        pattern={SECURITY_PATTERNS.email.pattern}
                        title={SECURITY_PATTERNS.email.title}
                        maxLength={100}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value.trim() })}
                        placeholder="principal@school.edu"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF6F2] border border-[#FEEAE1] text-[#1E232F] placeholder-slate-400 focus:outline-none focus:border-[#FF5E3A] focus:bg-white focus:ring-1 focus:ring-[#FF5E3A] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[#5A6272] font-bold uppercase tracking-wider mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={contactForm.phone}
                        pattern={SECURITY_PATTERNS.phone.pattern}
                        title={SECURITY_PATTERNS.phone.title}
                        maxLength={25}
                        onChange={(e) => setContactForm({ ...contactForm, phone: sanitizeInputText(e.target.value) })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF6F2] border border-[#FEEAE1] text-[#1E232F] placeholder-slate-400 focus:outline-none focus:border-[#FF5E3A] focus:bg-white focus:ring-1 focus:ring-[#FF5E3A] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#5A6272] font-bold uppercase tracking-wider mb-1">Special Requirements / Message</label>
                    <textarea
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Tell us about student count, required modules (e.g., Gemini AI exam papers, WhatsApp alerts)..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF6F2] border border-[#FEEAE1] text-[#1E232F] placeholder-slate-400 focus:outline-none focus:border-[#FF5E3A] focus:bg-white focus:ring-1 focus:ring-[#FF5E3A] resize-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#FF5E3A] hover:bg-[#E04826] text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg shadow-[#FF5E3A]/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
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
      {/* 9. FOOTER (DEEP DARK #10131A OBSIDIAN THEME)             */}
      {/* ======================================================== */}
      <footer className="py-14 bg-[#10131A] border-t border-[#1E232F] text-xs text-[#94A3B8] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#1E232F]">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white">
                  SchoolSphere<span className="text-[#FF5E3A]">.</span>
                </span>
              </div>
              <p className="text-[#94A3B8] text-xs leading-relaxed">
                The unified, intelligent school management platform empowering educational excellence across global campuses.
              </p>
            </div>

            {/* Col 2: Institutional Portals */}
            <div className="space-y-2.5">
              <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Role Workspaces</h4>
              <ul className="space-y-1.5 text-xs text-[#94A3B8]">
                <li><Link to="/login" className="hover:text-[#FF5E3A] transition">Super Admin Central</Link></li>
                <li><Link to="/login" className="hover:text-[#FF5E3A] transition">Faculty Workstation</Link></li>
                <li><Link to="/login" className="hover:text-[#FF5E3A] transition">Parent Portal</Link></li>
                <li><Link to="/login" className="hover:text-[#FF5E3A] transition">Student Records Desk</Link></li>
              </ul>
            </div>

            {/* Col 3: Academic Operations */}
            <div className="space-y-2.5">
              <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Core Operations</h4>
              <ul className="space-y-1.5 text-xs text-[#94A3B8]">
                <li><Link to="/attendance" className="hover:text-[#FF5E3A] transition">Attendance Telemetry</Link></li>
                <li><Link to="/fees" className="hover:text-[#FF5E3A] transition">Fee Settlements</Link></li>
                <li><Link to="/exams" className="hover:text-[#FF5E3A] transition">Exams &amp; Assessment</Link></li>
                <li><Link to="/chat" className="hover:text-[#FF5E3A] transition">Chat Room</Link></li>
              </ul>
            </div>

            {/* Col 4: Compliance & Trust */}
            <div className="space-y-2.5">
              <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Enterprise Trust</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Engineered with strict role-based access control, cryptographic session handling, and high-availability MongoDB synchronization.
              </p>
              <div className="pt-2 flex items-center gap-2 text-[10px] text-[#FF5E3A] font-semibold bg-[#1E232F] px-2.5 py-1 rounded-lg border border-[#FF5E3A]/30 w-fit">
                <ShieldCheck className="w-4 h-4 text-[#FF5E3A]" />
                <span>ISO/IEC 27001 Scholastic Standard</span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
            <div>
              &copy; {new Date().getFullYear()} SchoolSphere Management System. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#home" className="hover:text-[#FF5E3A] transition">Privacy Policy</a>
              <a href="#home" className="hover:text-[#FF5E3A] transition">Terms of Service</a>
              <a href="#home" className="hover:text-[#FF5E3A] transition">Security Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
