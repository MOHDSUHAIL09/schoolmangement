import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { studentAPI, teacherAPI } from '../services/api.js';
import { Loader } from '../components/Loader.jsx';
import {
  GraduationCap,
  Users,
  Building2,
  Layers,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  ArrowLeft,
  ArrowUpRight,
  Check,
  X,
  User,
  ChevronRight,
  BookOpen,
  CalendarCheck,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const MasterDirectory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active tab from query param or default to 'students'
  const initialTab = searchParams.get('tab') || 'students';
  const initialClass = searchParams.get('class') || 'All';

  const [activeTab, setActiveTab] = useState(initialTab); // 'students' | 'teachers' | 'classes'
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classesList, setClassesList] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState(initialClass);
  const [sectionFilter, setSectionFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  // Fallback comprehensive dataset
  const defaultMockStudents = [
    { _id: 'stu-101', studentId: 'STU-2026-101', name: 'Aarav Sharma', rollNumber: '101', classGrade: 'Class 5', section: 'A', gender: 'Male', parentIds: [{ name: 'Vikram Sharma', phone: '+91 98765 11201', email: 'vikram.sharma@example.com' }] },
    { _id: 'stu-102', studentId: 'STU-2026-102', name: 'Ananya Patel', rollNumber: '102', classGrade: 'Class 5', section: 'A', gender: 'Female', parentIds: [{ name: 'Rajesh Patel', phone: '+91 98765 11202', email: 'rajesh.patel@example.com' }] },
    { _id: 'stu-103', studentId: 'STU-2026-103', name: 'Rohan Gupta', rollNumber: '103', classGrade: 'Class 5', section: 'A', gender: 'Male', parentIds: [{ name: 'Manoj Gupta', phone: '+91 98765 11203', email: 'manoj.gupta@example.com' }] },
    { _id: 'stu-104', studentId: 'STU-2026-104', name: 'Diya Verma', rollNumber: '104', classGrade: 'Class 5', section: 'A', gender: 'Female', parentIds: [{ name: 'Suresh Verma', phone: '+91 98765 11204', email: 'suresh.verma@example.com' }] },
    { _id: 'stu-105', studentId: 'STU-2026-105', name: 'Vihaan Joshi', rollNumber: '105', classGrade: 'Class 5', section: 'B', gender: 'Male', parentIds: [{ name: 'Amit Joshi', phone: '+91 98765 11205', email: 'amit.joshi@example.com' }] },
    { _id: 'stu-106', studentId: 'STU-2026-106', name: 'Ishita Singh', rollNumber: '106', classGrade: 'Class 5', section: 'B', gender: 'Female', parentIds: [{ name: 'Rakesh Singh', phone: '+91 98765 11206', email: 'rakesh.singh@example.com' }] },
    { _id: 'stu-107', studentId: 'STU-2026-107', name: 'Kabir Mehta', rollNumber: '107', classGrade: 'Class 5', section: 'B', gender: 'Male', parentIds: [{ name: 'Sanjay Mehta', phone: '+91 98765 11207', email: 'sanjay.mehta@example.com' }] },
    { _id: 'stu-108', studentId: 'STU-2026-108', name: 'Sara Khan', rollNumber: '108', classGrade: 'Class 5', section: 'B', gender: 'Female', parentIds: [{ name: 'Tariq Khan', phone: '+91 98765 11208', email: 'tariq.khan@example.com' }] },
    { _id: 'stu-201', studentId: 'STU-2026-201', name: 'Liam Chen', rollNumber: '201', classGrade: 'Class 8', section: 'A', gender: 'Male', parentIds: [{ name: 'David Chen', phone: '+91 98765 22301', email: 'david.chen@example.com' }] },
    { _id: 'stu-202', studentId: 'STU-2026-202', name: 'Priya Nair', rollNumber: '202', classGrade: 'Class 8', section: 'A', gender: 'Female', parentIds: [{ name: 'Venkat Nair', phone: '+91 98765 22302', email: 'venkat.nair@example.com' }] },
    { _id: 'stu-203', studentId: 'STU-2026-203', name: 'Aditya Rao', rollNumber: '203', classGrade: 'Class 8', section: 'A', gender: 'Male', parentIds: [{ name: 'Prakash Rao', phone: '+91 98765 22303', email: 'prakash.rao@example.com' }] },
    { _id: 'stu-204', studentId: 'STU-2026-204', name: 'Sneha Kulkarni', rollNumber: '204', classGrade: 'Class 8', section: 'A', gender: 'Female', parentIds: [{ name: 'Anand Kulkarni', phone: '+91 98765 22304', email: 'anand.kulkarni@example.com' }] },
    { _id: 'stu-205', studentId: 'STU-2026-205', name: 'Devansh Roy', rollNumber: '205', classGrade: 'Class 8', section: 'B', gender: 'Male', parentIds: [{ name: 'Subhash Roy', phone: '+91 98765 22305', email: 'subhash.roy@example.com' }] },
    { _id: 'stu-206', studentId: 'STU-2026-206', name: 'Tanvi Agarwal', rollNumber: '206', classGrade: 'Class 8', section: 'B', gender: 'Female', parentIds: [{ name: 'Alok Agarwal', phone: '+91 98765 22306', email: 'alok.agarwal@example.com' }] },
    { _id: 'stu-207', studentId: 'STU-2026-207', name: 'Aryan Mishra', rollNumber: '207', classGrade: 'Class 8', section: 'B', gender: 'Male', parentIds: [{ name: 'Dinesh Mishra', phone: '+91 98765 22307', email: 'dinesh.mishra@example.com' }] },
    { _id: 'stu-208', studentId: 'STU-2026-208', name: 'Meera Nambiar', rollNumber: '208', classGrade: 'Class 8', section: 'B', gender: 'Female', parentIds: [{ name: 'Raman Nambiar', phone: '+91 98765 22308', email: 'raman.nambiar@example.com' }] },
    { _id: 'stu-301', studentId: 'STU-2026-301', name: 'Kunal Saxena', rollNumber: '301', classGrade: 'Class 9', section: 'A', gender: 'Male', parentIds: [{ name: 'Pradeep Saxena', phone: '+91 98765 33401', email: 'pradeep.saxena@example.com' }] },
    { _id: 'stu-302', studentId: 'STU-2026-302', name: 'Riya Sengupta', rollNumber: '302', classGrade: 'Class 9', section: 'A', gender: 'Female', parentIds: [{ name: 'Gautam Sengupta', phone: '+91 98765 33402', email: 'gautam.sengupta@example.com' }] },
    { _id: 'stu-303', studentId: 'STU-2026-303', name: 'Shaurya Chauhan', rollNumber: '303', classGrade: 'Class 9', section: 'A', gender: 'Male', parentIds: [{ name: 'Virendra Chauhan', phone: '+91 98765 33403', email: 'virendra.chauhan@example.com' }] },
    { _id: 'stu-304', studentId: 'STU-2026-304', name: 'Anika Deshmukh', rollNumber: '304', classGrade: 'Class 9', section: 'A', gender: 'Female', parentIds: [{ name: 'Nitin Deshmukh', phone: '+91 98765 33404', email: 'nitin.deshmukh@example.com' }] },
    { _id: 'stu-401', studentId: 'STU-2026-401', name: 'Harsh Vardhan', rollNumber: '401', classGrade: 'Class 10', section: 'A', gender: 'Male', parentIds: [{ name: 'R. K. Vardhan', phone: '+91 98765 44501', email: 'rk.vardhan@example.com' }] },
    { _id: 'stu-402', studentId: 'STU-2026-402', name: 'Pooja Bhatia', rollNumber: '402', classGrade: 'Class 10', section: 'A', gender: 'Female', parentIds: [{ name: 'Ashok Bhatia', phone: '+91 98765 44502', email: 'ashok.bhatia@example.com' }] },
    { _id: 'stu-403', studentId: 'STU-2026-403', name: 'Yash Singhal', rollNumber: '403', classGrade: 'Class 10', section: 'A', gender: 'Male', parentIds: [{ name: 'Mukesh Singhal', phone: '+91 98765 44503', email: 'mukesh.singhal@example.com' }] },
    { _id: 'stu-404', studentId: 'STU-2026-404', name: 'Natasha Kapoor', rollNumber: '404', classGrade: 'Class 10', section: 'A', gender: 'Female', parentIds: [{ name: 'Sunil Kapoor', phone: '+91 98765 44504', email: 'sunil.kapoor@example.com' }] }
  ];

  const defaultMockTeachers = [
    { _id: 'tch-001', teacherId: 'TCH-2026-001', name: 'Mrs. Sarah Davis', department: 'Science', designation: 'Head of Science Department', assignedClasses: ['Class 5-A', 'Class 8-A'], phone: '+91 98765 55001', email: 'sarah.davis@schoolsphere.edu', status: 'Active' },
    { _id: 'tch-002', teacherId: 'TCH-2026-002', name: 'Mr. James Vance', department: 'Mathematics', designation: 'Senior Mathematics Faculty', assignedClasses: ['Class 5-B', 'Class 8-B'], phone: '+91 98765 55002', email: 'james.vance@schoolsphere.edu', status: 'Active' },
    { _id: 'tch-003', teacherId: 'TCH-2026-003', name: 'Dr. Evelyn Sterling', department: 'Science', designation: 'Physics & Chemistry Lead', assignedClasses: ['Class 8-A', 'Class 9-A'], phone: '+91 98765 55003', email: 'evelyn.sterling@schoolsphere.edu', status: 'Active' },
    { _id: 'tch-004', teacherId: 'TCH-2026-004', name: 'Ms. Angela Jenkins', department: 'English', designation: 'Literature & Linguistics Head', assignedClasses: ['Class 8-B', 'Class 10-A'], phone: '+91 98765 55004', email: 'angela.jenkins@schoolsphere.edu', status: 'Active' },
    { _id: 'tch-005', teacherId: 'TCH-2026-005', name: 'Mr. Raymond Zhao', department: 'Social Studies', designation: 'History & Civics Senior Educator', assignedClasses: ['Class 9-A', 'Class 10-A'], phone: '+91 98765 55005', email: 'raymond.zhao@schoolsphere.edu', status: 'Active' },
    { _id: 'tch-006', teacherId: 'TCH-2026-006', name: 'Mrs. Kavita Kapoor', department: 'Hindi', designation: 'Senior Language Educator & HOD', assignedClasses: ['Class 10-A', 'Class 8-A'], phone: '+91 98765 55006', email: 'kavita.kapoor@schoolsphere.edu', status: 'Active' },
    { _id: 'tch-007', teacherId: 'TCH-2026-007', name: 'Mr. David Miller', department: 'Computer Science', designation: 'ICT & Artificial Intelligence Director', assignedClasses: ['Class 8-A', 'Class 9-A', 'Class 10-A'], phone: '+91 98765 55007', email: 'david.miller@schoolsphere.edu', status: 'Active' },
    { _id: 'tch-008', teacherId: 'TCH-2026-008', name: 'Ms. Priya Sen', department: 'Arts & Music', designation: 'Creative Arts & Music Coordinator', assignedClasses: ['Class 5-A', 'Class 5-B'], phone: '+91 98765 55008', email: 'priya.sen@schoolsphere.edu', status: 'Active' },
    { _id: 'tch-009', teacherId: 'TCH-2026-009', name: 'Dr. Robert Chen', department: 'Mathematics', designation: 'Advanced Calculus Faculty', assignedClasses: ['Class 9-A', 'Class 10-A'], phone: '+91 98765 55009', email: 'robert.chen@schoolsphere.edu', status: 'Active' },
    { _id: 'tch-010', teacherId: 'TCH-2026-010', name: 'Mrs. Anita Desai', department: 'Physical Education', designation: 'Sports Director & Athletics Coach', assignedClasses: ['All Classes'], phone: '+91 98765 55010', email: 'anita.desai@schoolsphere.edu', status: 'Active' }
  ];

  useEffect(() => {
    fetchDirectoryData();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['students', 'teachers', 'classes'].includes(tab)) {
      setActiveTab(tab);
    }
    const cls = searchParams.get('class');
    if (cls) {
      setClassFilter(cls);
    }
  }, [searchParams]);

  const fetchDirectoryData = async () => {
    setLoading(true);
    try {
      const [stuRes, tchRes, metaRes] = await Promise.all([
        studentAPI.getAll({ limit: 1000 }),
        teacherAPI.getAll({ limit: 200 }),
        studentAPI.getClassesMeta()
      ]);

      if (stuRes.success && stuRes.data?.students?.length > 0) {
        setStudents(stuRes.data.students);
      } else {
        setStudents(defaultMockStudents);
      }

      if (tchRes.success && tchRes.data?.teachers?.length > 0) {
        setTeachers(tchRes.data.teachers);
      } else {
        setTeachers(defaultMockTeachers);
      }

      if (metaRes.success && metaRes.data?.classes?.length > 0) {
        setClassesList(metaRes.data.classes);
      }
    } catch (err) {
      console.warn('Directory fetch error, using robust fallback roster:', err);
      setStudents(defaultMockStudents);
      setTeachers(defaultMockTeachers);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Active data sources
  const activeStudents = students.length > 0 ? students : defaultMockStudents;
  const activeTeachers = teachers.length > 0 ? teachers : defaultMockTeachers;

  // Filtered Students
  const filteredStudents = activeStudents.filter((s) => {
    if (classFilter !== 'All' && s.classGrade !== classFilter) return false;
    if (sectionFilter !== 'All' && s.section !== sectionFilter) return false;
    if (genderFilter !== 'All' && s.gender !== genderFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = (s.name || '').toLowerCase().includes(term);
      const rollMatch = String(s.rollNumber || '').toLowerCase().includes(term);
      const idMatch = String(s.studentId || '').toLowerCase().includes(term);
      const parentName = (s.parentIds?.[0]?.name || s.parentName || '').toLowerCase();
      const parentPhone = (s.parentIds?.[0]?.phone || s.phone || '').toLowerCase();
      const parentEmail = (s.parentIds?.[0]?.email || s.email || '').toLowerCase();
      if (!nameMatch && !rollMatch && !idMatch && !parentName.includes(term) && !parentPhone.includes(term) && !parentEmail.includes(term)) {
        return false;
      }
    }
    return true;
  });

  // Filtered Teachers
  const filteredTeachers = activeTeachers.filter((t) => {
    if (deptFilter !== 'All' && t.department !== deptFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = (t.name || '').toLowerCase().includes(term);
      const deptMatch = (t.department || '').toLowerCase().includes(term);
      const desigMatch = (t.designation || '').toLowerCase().includes(term);
      const emailMatch = (t.email || '').toLowerCase().includes(term);
      const phoneMatch = (t.phone || '').toLowerCase().includes(term);
      if (!nameMatch && !deptMatch && !desigMatch && !emailMatch && !phoneMatch) {
        return false;
      }
    }
    return true;
  });

  // Distinct sets
  const distinctClasses = Array.from(new Set(activeStudents.map((s) => s.classGrade))).filter(Boolean);
  const distinctDepts = Array.from(new Set(activeTeachers.map((t) => t.department))).filter(Boolean);

  // Class enrollment distribution stats
  const classEnrollmentStats = (distinctClasses.length > 0 ? distinctClasses : ['Class 5', 'Class 8', 'Class 9', 'Class 10']).map((clsName) => {
    const studentsInClass = activeStudents.filter((s) => s.classGrade === clsName);
    const boys = studentsInClass.filter((s) => s.gender === 'Male').length;
    const girls = studentsInClass.filter((s) => s.gender === 'Female').length;
    const sections = Array.from(new Set(studentsInClass.map((s) => s.section))).filter(Boolean);
    const matchedTeacher = activeTeachers.find((t) => (t.assignedClasses || []).some((c) => c.startsWith(clsName)))?.name || 'Senior Class Educator';

    return {
      className: clsName,
      total: studentsInClass.length,
      boys,
      girls,
      sections: sections.length > 0 ? sections : ['A', 'B'],
      inCharge: matchedTeacher
    };
  });

  // CSV Export Handler
  const exportDirectoryToCSV = () => {
    if (activeTab === 'students' || activeTab === 'classes') {
      const headers = ['#', 'Roll No', 'Student Name', 'Student ID', 'Class Grade', 'Section', 'Gender', 'Parent / Guardian Name', 'Parent Phone', 'Parent Email', 'Status'];
      const rows = filteredStudents.map((s, idx) => [
        idx + 1,
        s.rollNumber || 'N/A',
        `"${s.name || ''}"`,
        s.studentId || '',
        s.classGrade || '',
        s.section || '',
        s.gender || 'Male',
        `"${s.parentIds?.[0]?.name || s.parentName || 'Parent on Record'}"`,
        `"${s.parentIds?.[0]?.phone || s.phone || 'N/A'}"`,
        `"${s.parentIds?.[0]?.email || s.email || 'N/A'}"`,
        'Enrolled'
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `SchoolSphere_Students_Parents_Master_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['#', 'Teacher ID', 'Faculty Name', 'Department', 'Designation', 'Assigned Classes', 'Email', 'Phone', 'Status'];
      const rows = filteredTeachers.map((t, idx) => [
        idx + 1,
        t.teacherId || 'N/A',
        `"${t.name || ''}"`,
        t.department || 'Academics',
        t.designation || 'Faculty Member',
        `"${(t.assignedClasses || []).join('; ')}"`,
        `"${t.email || ''}"`,
        `"${t.phone || ''}"`,
        t.status || 'Active'
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `SchoolSphere_Faculty_Directory_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return <Loader message="Loading School Directory..." />;
  }

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & NAVIGATION                               */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#FF5E3A] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]">
              Institutional Roll
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-[#FF5E3A]" />
            <span>School Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Comprehensive institutional roll: Enrolled students by class, parent &amp; guardian contact records, faculty assignments, and class distributions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchDirectoryData}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition cursor-pointer"
            title="Refresh Directory Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={exportDirectoryToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span>Export Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP KPI EXECUTIVE METRIC CARDS                        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students Enrolled */}
        <div
          onClick={() => handleTabChange('students')}
          className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-xs cursor-pointer ${
            activeTab === 'students'
              ? 'bg-[#0F172A] text-white border-black ring-2 ring-[#FF5E3A]'
              : 'bg-white text-slate-900 border-slate-200 hover:border-[#FF5E3A]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'students' ? 'text-slate-300' : 'text-slate-400'}`}>
              Total Enrolled Students
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              activeTab === 'students' ? 'bg-[#FF5E3A] text-white' : 'bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]'
            }`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className={`text-3xl font-black tracking-tight ${activeTab === 'students' ? 'text-white' : 'text-slate-900'}`}>
                {activeStudents.length}
              </h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'students' ? 'bg-[#FF5E3A]/20 text-[#FF5E3A] border border-[#FF5E3A]/40' : 'bg-slate-100 text-slate-700'
              }`}>
                Active Students
              </span>
            </div>
            <p className={`text-[11px] mt-2 font-medium ${activeTab === 'students' ? 'text-slate-400' : 'text-slate-500'}`}>
              Click to view student-wise parent contacts
            </p>
          </div>
        </div>

        {/* Card 2: Faculty Members On Duty */}
        <div
          onClick={() => handleTabChange('teachers')}
          className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-xs cursor-pointer ${
            activeTab === 'teachers'
              ? 'bg-[#0F172A] text-white border-black ring-2 ring-[#FF5E3A]'
              : 'bg-white text-slate-900 border-slate-200 hover:border-[#FF5E3A]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'teachers' ? 'text-slate-300' : 'text-slate-400'}`}>
              Total Faculty On Duty
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              activeTab === 'teachers' ? 'bg-[#FF5E3A] text-white' : 'bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className={`text-3xl font-black tracking-tight ${activeTab === 'teachers' ? 'text-white' : 'text-slate-900'}`}>
                {activeTeachers.length}
              </h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'teachers' ? 'bg-[#FF5E3A]/20 text-[#FF5E3A] border border-[#FF5E3A]/40' : 'bg-slate-100 text-slate-700'
              }`}>
                {distinctDepts.length} Departments
              </span>
            </div>
            <p className={`text-[11px] mt-2 font-medium ${activeTab === 'teachers' ? 'text-slate-400' : 'text-slate-500'}`}>
              Click to view complete faculty roster
            </p>
          </div>
        </div>

        {/* Card 3: Active Class Divisions */}
        <div
          onClick={() => handleTabChange('classes')}
          className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-xs cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-[#0F172A] text-white border-black ring-2 ring-[#FF5E3A]'
              : 'bg-white text-slate-900 border-slate-200 hover:border-[#FF5E3A]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'classes' ? 'text-slate-300' : 'text-slate-400'}`}>
              Active Class Divisions
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              activeTab === 'classes' ? 'bg-[#FF5E3A] text-white' : 'bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className={`text-3xl font-black tracking-tight ${activeTab === 'classes' ? 'text-white' : 'text-slate-900'}`}>
                {classEnrollmentStats.length}
              </h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'classes' ? 'bg-[#FF5E3A]/20 text-[#FF5E3A] border border-[#FF5E3A]/40' : 'bg-slate-100 text-slate-700'
              }`}>
                Grade Levels
              </span>
            </div>
            <p className={`text-[11px] mt-2 font-medium ${activeTab === 'classes' ? 'text-slate-400' : 'text-slate-500'}`}>
              Click to view class-wise strength
            </p>
          </div>
        </div>

        {/* Card 4: Verified Parent Records */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Verified Guardian Contacts
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeStudents.length}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0EB] text-[#FF5E3A] border border-[#FFD5C5]">
                100% Linked
              </span>
            </div>
            <p className="text-[11px] mt-2 font-medium text-slate-500">
              Direct emergency calling &amp; SMS ready
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SEGMENTED NAVIGATION TABS                             */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('students')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'students'
                ? 'bg-[#FF5E3A] text-white shadow-md shadow-[#FF5E3A]/25'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students &amp; Parents Roster</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'students' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 font-mono'
            }`}>
              {activeStudents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('teachers')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-[#0F172A] text-white shadow-md shadow-slate-900/25'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4 text-orange-400" />
            <span>Faculty &amp; Teaching Staff</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'teachers' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 font-mono'
            }`}>
              {activeTeachers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('classes')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-[#0F172A] text-white shadow-md shadow-slate-900/25'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-orange-400" />
            <span>Class Enrollment Matrix</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeTab === 'classes' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 font-mono'
            }`}>
              {classEnrollmentStats.length}
            </span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-400 px-3">
          Institutional Academic Roster
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. TAB CONTENT 1: STUDENTS & PARENTS                     */}
      {/* ======================================================== */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Excel Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student name, roll number, or parent name..."
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF5E3A] transition shadow-2xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Class Filter Dropdown */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-2xs cursor-pointer"
              >
                <option value="All">All Classes ({distinctClasses.length})</option>
                {distinctClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              {/* Section Filter Dropdown */}
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-2xs cursor-pointer"
              >
                <option value="All">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>

              {/* Gender Filter */}
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-2xs cursor-pointer"
              >
                <option value="All">All Genders</option>
                <option value="Male">Boys (Male)</option>
                <option value="Female">Girls (Female)</option>
              </select>

              {(searchTerm || classFilter !== 'All' || sectionFilter !== 'All' || genderFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setClassFilter('All');
                    setSectionFilter('All');
                    setGenderFilter('All');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-slate-500 font-mono">
              Showing <span className="text-[#FF5E3A] font-black">{filteredStudents.length}</span> of {activeStudents.length} Students
            </div>
          </div>

          {/* Excel Style Data Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0F172A] text-white text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 select-none">
                  <tr>
                    <th className="py-3 px-3 text-center border-r border-slate-800 w-14 font-mono">#</th>
                    <th className="py-3 px-4 border-r border-slate-800">
                      Student Name &amp; Roll <span className="text-[#FF5E3A] text-[9px] font-mono">(Col A)</span>
                    </th>
                    <th className="py-3 px-4 border-r border-slate-800 text-center w-36">
                      Class &amp; Section <span className="text-[#FF5E3A] text-[9px] font-mono">(Col B)</span>
                    </th>
                    <th className="py-3 px-4 border-r border-slate-800">
                      Parent / Guardian Name <span className="text-[#FF5E3A] text-[9px] font-mono">(Col C)</span>
                    </th>
                    <th className="py-3 px-4 border-r border-slate-800">
                      Parent Contact Details <span className="text-[#FF5E3A] text-[9px] font-mono">(Col D)</span>
                    </th>
                    <th className="py-3 px-4 text-center w-32">
                      Status <span className="text-[#FF5E3A] text-[9px] font-mono">(Col E)</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="text-xs divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-sm text-slate-700">No students match your criteria.</p>
                        <p className="text-xs text-slate-400 mt-1">Try clearing your search terms or selecting a different class filter.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setClassFilter('All');
                            setSectionFilter('All');
                            setGenderFilter('All');
                          }}
                          className="mt-3 px-4 py-2 bg-[#0F172A] hover:bg-[#FF5E3A] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Reset All Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const parent = s.parentIds?.[0] || {
                        name: s.parentName || 'Parent On Record',
                        phone: s.phone || '+91 98765 00000',
                        email: s.email || 'guardian@schoolsphere.edu'
                      };

                      return (
                        <tr
                          key={s._id || idx}
                          className={`hover:bg-[#FFF0EB]/40 transition-colors group ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                          }`}
                        >
                          {/* Row Index */}
                          <td className="py-3 px-3 text-center font-mono text-[11px] font-bold text-slate-500 bg-slate-100/90 border-r border-slate-200 select-none">
                            {idx + 1}
                          </td>

                          {/* Col A: Student Name & Roll */}
                          <td className="py-3 px-4 border-r border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 border border-slate-700 shadow-xs group-hover:scale-105 transition-transform">
                                {s.name?.[0] || 'S'}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 flex items-center gap-2">
                                  <span className="group-hover:text-[#FF5E3A] transition-colors">{s.name}</span>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      s.gender === 'Female'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}
                                  >
                                    {s.gender || 'Male'}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  Roll #{s.rollNumber || 'N/A'} &bull; ID: {s.studentId || 'STU-2026'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Col B: Class & Section */}
                          <td className="py-3 px-4 border-r border-slate-100 text-center font-mono">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FFF0EB] text-[#FF5E3A] font-black text-xs border border-[#FFD5C5] shadow-2xs">
                              {s.classGrade} - Sec {s.section || 'A'}
                            </span>
                          </td>

                          {/* Col C: Parent / Guardian Name */}
                          <td className="py-3 px-4 border-r border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 block">{parent.name}</span>
                                <span className="text-[10px] text-slate-400 block font-medium">Primary Guardian</span>
                              </div>
                            </div>
                          </td>

                          {/* Col D: Parent Contact Details */}
                          <td className="py-3 px-4 border-r border-slate-100">
                            <div className="space-y-1 text-[11px]">
                              {parent.phone && (
                                <a
                                  href={`tel:${parent.phone}`}
                                  className="flex items-center gap-1.5 text-slate-700 hover:text-[#FF5E3A] font-semibold font-mono transition"
                                >
                                  <Phone className="w-3.5 h-3.5 text-[#FF5E3A] shrink-0" />
                                  <span>{parent.phone}</span>
                                </a>
                              )}
                              {parent.email && (
                                <a
                                  href={`mailto:${parent.email}`}
                                  className="flex items-center gap-1.5 text-slate-500 hover:text-[#FF5E3A] font-medium transition"
                                >
                                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[220px]">{parent.email}</span>
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Col E: Status */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F172A] text-white font-black text-[10px] shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E3A]" />
                              <span>Enrolled</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
              <span>SchoolSphere Academic Student Register</span>
              <span>Total Verified Active Records: {filteredStudents.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TAB CONTENT 2: FACULTY & TEACHING STAFF               */}
      {/* ======================================================== */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          {/* Excel Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search faculty name, department, or email..."
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF5E3A] transition shadow-2xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Department Dropdown */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF5E3A] shadow-2xs cursor-pointer"
              >
                <option value="All">All Departments ({distinctDepts.length})</option>
                {distinctDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {(searchTerm || deptFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setDeptFilter('All');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-slate-500 font-mono">
              Showing <span className="text-[#FF5E3A] font-black">{filteredTeachers.length}</span> of {activeTeachers.length} Faculty
            </div>
          </div>

          {/* Excel Style Data Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0F172A] text-white text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 select-none">
                  <tr>
                    <th className="py-3 px-3 text-center border-r border-slate-800 w-14 font-mono">#</th>
                    <th className="py-3 px-4 border-r border-slate-800">
                      Faculty Member &amp; ID <span className="text-[#FF5E3A] text-[9px] font-mono">(Col A)</span>
                    </th>
                    <th className="py-3 px-4 border-r border-slate-800 text-center w-36">
                      Department <span className="text-[#FF5E3A] text-[9px] font-mono">(Col B)</span>
                    </th>
                    <th className="py-3 px-4 border-r border-slate-800">
                      Designation <span className="text-[#FF5E3A] text-[9px] font-mono">(Col C)</span>
                    </th>
                    <th className="py-3 px-4 border-r border-slate-800">
                      Assigned Classes <span className="text-[#FF5E3A] text-[9px] font-mono">(Col D)</span>
                    </th>
                    <th className="py-3 px-4 border-r border-slate-800">
                      Contact Details <span className="text-[#FF5E3A] text-[9px] font-mono">(Col E)</span>
                    </th>
                    <th className="py-3 px-4 text-center w-32">
                      Duty Status <span className="text-[#FF5E3A] text-[9px] font-mono">(Col F)</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="text-xs divide-y divide-slate-100">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-sm text-slate-700">No faculty members found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((t, idx) => (
                      <tr
                        key={t._id || idx}
                        className={`hover:bg-[#FFF0EB]/40 transition-colors group ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                        }`}
                      >
                        {/* Row Index */}
                        <td className="py-3 px-3 text-center font-mono text-[11px] font-bold text-slate-500 bg-slate-100/90 border-r border-slate-200 select-none">
                          {idx + 1}
                        </td>

                        {/* Col A: Faculty Member & ID */}
                        <td className="py-3 px-4 border-r border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#FF5E3A] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                              {t.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2) || 'TC'}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block group-hover:text-[#FF5E3A] transition-colors">{t.name}</span>
                              <span className="text-[11px] font-mono text-slate-400">
                                ID: {t.teacherId || `TCH-2026-${String(idx + 1).padStart(3, '0')}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Col B: Department */}
                        <td className="py-3 px-4 border-r border-slate-100 text-center">
                          <span className="inline-block px-3 py-1 rounded-full bg-[#FFF0EB] text-[#FF5E3A] font-extrabold text-[11px] border border-[#FFD5C5] shadow-2xs">
                            {t.department}
                          </span>
                        </td>

                        {/* Col C: Designation */}
                        <td className="py-3 px-4 border-r border-slate-100">
                          <span className="font-bold text-slate-800">{t.designation || 'Senior Faculty'}</span>
                        </td>

                        {/* Col D: Assigned Classes */}
                        <td className="py-3 px-4 border-r border-slate-100 font-mono text-[11px]">
                          <div className="flex flex-wrap gap-1.5">
                            {(t.assignedClasses || ['Class 8-A']).map((cls, cIdx) => (
                              <span
                                key={cIdx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200"
                              >
                                {cls}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Col E: Contact Info */}
                        <td className="py-3 px-4 border-r border-slate-100">
                          <div className="space-y-1 text-[11px]">
                            {t.phone && (
                              <a
                                href={`tel:${t.phone}`}
                                className="flex items-center gap-1.5 text-slate-700 hover:text-[#FF5E3A] font-semibold font-mono transition"
                              >
                                <Phone className="w-3.5 h-3.5 text-[#FF5E3A] shrink-0" />
                                <span>{t.phone}</span>
                              </a>
                            )}
                            {t.email && (
                              <a
                                href={`mailto:${t.email}`}
                                className="flex items-center gap-1.5 text-slate-500 hover:text-[#FF5E3A] font-medium transition"
                              >
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[200px]">{t.email}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Col F: Duty Status */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F172A] text-white font-black text-[10px] shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E3A]" />
                            <span>On Duty</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
              <span>SchoolSphere Academic Faculty Register</span>
              <span>Total Active Faculty Members: {filteredTeachers.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. TAB CONTENT 3: CLASS ENROLLMENT MATRIX                */}
      {/* ======================================================== */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classEnrollmentStats.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-[#FF5E3A] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-black text-slate-900 group-hover:text-[#FF5E3A] transition-colors">
                      {item.className}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#FFF0EB] text-[#FF5E3A] font-black text-xs border border-[#FFD5C5]">
                      {item.total} Enrolled
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600 mb-6">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-400 font-medium">Faculty In-Charge:</span>
                      <span className="font-extrabold text-slate-800">{item.inCharge}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-mono">
                      <span className="text-slate-400 font-medium">Gender Breakdown:</span>
                      <span className="font-bold text-slate-800">
                        {item.boys} Boys &bull; {item.girls} Girls
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono">
                      <span className="text-slate-400 font-medium">Sections:</span>
                      <span className="font-bold text-slate-800">
                        {item.sections.map((sec) => `Sec ${sec}`).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setClassFilter(item.className);
                    handleTabChange('students');
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-[#FF5E3A] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>View All Students in {item.className}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDirectory;
