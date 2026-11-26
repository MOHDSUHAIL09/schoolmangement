import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { logger } from '../utils/logger.js';

import User from '../models/User.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Homework from '../models/Homework.js';
import Exam from '../models/Exam.js';
import Transport from '../models/Transport.js';
import Payroll from '../models/Payroll.js';
import Notice from '../models/Notice.js';
import Setting from '../models/Setting.js';
import Chat from '../models/Chat.js';
import CommunicationLog from '../models/CommunicationLog.js';

export const seedDatabase = async () => {
  try {
    logger.info('Starting SchoolSphere database seeding...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Attendance.deleteMany({}),
      Fee.deleteMany({}),
      Homework.deleteMany({}),
      Exam.deleteMany({}),
      Transport.deleteMany({}),
      Payroll.deleteMany({}),
      Notice.deleteMany({}),
      Setting.deleteMany({}),
      Chat.deleteMany({}),
      CommunicationLog.deleteMany({})
    ]);

    logger.info('Purged all existing collections.');

    // 1. Seed School Branding Settings
    await Setting.create({
      schoolName: 'SchoolSphere International Academy',
      schoolMotto: 'Empowering Minds, Shaping Tomorrow • Est. 1998',
      address: '42 Academic Boulevard, Silicon Valley, CA 94025',
      phone: '+1 (800) 555-SPHERE',
      email: 'admissions@schoolsphere.com',
      website: 'https://schoolsphere.com',
      academicYear: '2026-2027',
      currency: '$'
    });

    // 2. Seed Users
    // Super Admin (Highest Central Access)
    const superAdminUser = await User.create({
      name: 'Dr. Evelyn Sterling',
      email: 'superadmin@schoolsphere.com',
      password: 'admin123',
      role: 'super_admin',
      phone: '+1 (555) 100-0001',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      status: 'active'
    });

    // Super Admin alias
    await User.create({
      name: 'Super Administrator',
      email: 'superadmin@school.com',
      password: 'admin123',
      role: 'super_admin',
      phone: '+1 (555) 100-0099',
      isActive: true,
      status: 'active'
    });

    // Admin (Replaces Principal as primary operational Admin)
    const adminUser = await User.create({
      name: 'Arthur Pendelton',
      email: 'admin@schoolsphere.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1 (555) 100-0002',
      profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      status: 'active'
    });
    const principalUser = adminUser;

    await User.create({
      name: 'Arthur Pendelton',
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1 (555) 100-0002',
      isActive: true,
      status: 'active'
    });

    // Compatibility Principal aliases (for backwards compatibility)
    await User.create({
      name: 'Arthur Pendelton',
      email: 'principal@schoolsphere.com',
      password: 'principal123',
      role: 'admin',
      phone: '+1 (555) 100-0002',
      isActive: true,
      status: 'active'
    });

    await User.create({
      name: 'Arthur Pendelton',
      email: 'principal@school.com',
      password: 'principal123',
      role: 'admin',
      phone: '+1 (555) 100-0002',
      isActive: true,
      status: 'active'
    });

    // Faculty: Math Teacher
    const teacherMath = await User.create({
      name: 'Professor Marcus Vance',
      email: 'teacher@schoolsphere.com',
      password: 'teacher123',
      role: 'teacher',
      phone: '+1 (555) 200-0001',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      status: 'active'
    });

    await User.create({
      name: 'Professor Marcus Vance',
      email: 'teacher@school.com',
      password: 'teacher123',
      role: 'teacher',
      phone: '+1 (555) 200-0001',
      isActive: true,
      status: 'active'
    });

    // Faculty: Science Teacher
    const teacherScience = await User.create({
      name: 'Dr. Sophia Morales',
      email: 'teacher.science@schoolsphere.com',
      password: 'teacher123',
      role: 'teacher',
      phone: '+1 (555) 200-0002',
      profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      status: 'active'
    });

    // Parent User (Linked to multi-children: Aarav, Ananya, Kabir)
    const parentUser = await User.create({
      name: 'Vikram Sharma',
      email: 'parent@schoolsphere.com',
      password: 'parent123',
      role: 'parent',
      phone: '+1 (555) 300-0001',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      status: 'active'
    });

    await User.create({
      name: 'Vikram Sharma',
      email: 'parent@school.com',
      password: 'parent123',
      role: 'parent',
      phone: '+1 (555) 300-0001',
      isActive: true,
      status: 'active'
    });

    // Student Login User for Aarav
    const studentUser = await User.create({
      name: 'Aarav Sharma',
      email: 'student@schoolsphere.com',
      password: 'student123',
      role: 'student',
      phone: '+1 (555) 400-0001',
      profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      status: 'active'
    });

    await User.create({
      name: 'Aarav Sharma',
      email: 'student@school.com',
      password: 'student123',
      role: 'student',
      phone: '+1 (555) 400-0001',
      isActive: true,
      status: 'active'
    });

    // 3. Seed Transport Routes
    const routeNorth = await Transport.create({
      routeName: 'North Ridge Express (Route #1)',
      vehicleNumber: 'BUS-NR-01',
      vehicleType: 'Bus',
      driverName: 'Robert Martinez',
      driverPhone: '+1 (555) 777-1001',
      capacity: 45,
      pickupPoints: [
        { name: 'Pinecrest Plaza', time: '07:15 AM', location: 'North Terminal Bay 2', fee: 150 },
        { name: 'Oakridge Crossing', time: '07:30 AM', location: 'Main Street & 4th', fee: 150 },
        { name: 'Cedar Heights Roundabout', time: '07:45 AM', location: 'Cedar Ave East', fee: 150 }
      ],
      status: 'Active'
    });

    const routeWest = await Transport.create({
      routeName: 'West Hills Shuttle (Route #2)',
      vehicleNumber: 'VAN-WH-02',
      vehicleType: 'Van',
      driverName: 'James Kelly',
      driverPhone: '+1 (555) 777-1002',
      capacity: 18,
      pickupPoints: [
        { name: 'West Valley Library', time: '07:20 AM', location: 'Library South Gate', fee: 120 },
        { name: 'Sunnyvale Commons', time: '07:40 AM', location: 'Commons Transit Hub', fee: 120 }
      ],
      status: 'Active'
    });

    // 4. Seed Students (Demonstrating Multi-Child Parent Architecture: Vikram -> Aarav, Ananya, Kabir)
    const childAarav = await Student.create({
      userId: studentUser._id,
      studentId: 'STU-2026-101',
      admissionNumber: 'ADM-2024-001',
      rollNumber: '101',
      firstName: 'Aarav',
      lastName: 'Sharma',
      name: 'Aarav Sharma',
      dateOfBirth: new Date('2010-04-12'),
      gender: 'Male',
      email: 'student@schoolsphere.com',
      phone: '+1 (555) 400-0001',
      address: '742 Evergreen Terrace, Green Valley, CA',
      classGrade: 'Class 8',
      section: 'A',
      parentIds: [parentUser._id],
      admissionDate: new Date('2024-08-15'),
      routeId: routeNorth._id,
      profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      status: 'Active'
    });

    const childAnanya = await Student.create({
      studentId: 'STU-2026-805',
      admissionNumber: 'ADM-2024-088',
      rollNumber: '805',
      firstName: 'Ananya',
      lastName: 'Sharma',
      name: 'Ananya Sharma',
      dateOfBirth: new Date('2013-09-22'),
      gender: 'Female',
      email: 'ananya.sharma@student.schoolsphere.com',
      phone: '+1 (555) 400-0002',
      address: '742 Evergreen Terrace, Green Valley, CA',
      classGrade: 'Class 5',
      section: 'B',
      parentIds: [parentUser._id],
      admissionDate: new Date('2024-08-15'),
      routeId: routeNorth._id,
      profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      status: 'Active'
    });

    const childKabir = await Student.create({
      studentId: 'STU-2026-512',
      admissionNumber: 'ADM-2025-104',
      rollNumber: '512',
      firstName: 'Kabir',
      lastName: 'Sharma',
      name: 'Kabir Sharma',
      dateOfBirth: new Date('2016-11-05'),
      gender: 'Male',
      email: 'kabir.sharma@student.schoolsphere.com',
      phone: '+1 (555) 400-0003',
      address: '742 Evergreen Terrace, Green Valley, CA',
      classGrade: 'Class 2',
      section: 'A',
      parentIds: [parentUser._id],
      admissionDate: new Date('2025-08-10'),
      routeId: routeWest._id,
      profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      status: 'Active'
    });

    // Additional class peers
    const peer1 = await Student.create({
      studentId: 'STU-2026-102',
      admissionNumber: 'ADM-2024-002',
      rollNumber: '102',
      firstName: 'Liam',
      lastName: 'Chen',
      name: 'Liam Chen',
      dateOfBirth: new Date('2010-06-18'),
      gender: 'Male',
      email: 'liam.chen@student.schoolsphere.com',
      address: '12 Blossom Way, Green Valley',
      classGrade: 'Class 8',
      section: 'A',
      admissionDate: new Date('2024-08-15'),
      status: 'Active'
    });

    const peer2 = await Student.create({
      studentId: 'STU-2026-103',
      admissionNumber: 'ADM-2024-003',
      rollNumber: '103',
      firstName: 'Maya',
      lastName: 'Patel',
      name: 'Maya Patel',
      dateOfBirth: new Date('2010-02-14'),
      gender: 'Female',
      email: 'maya.patel@student.schoolsphere.com',
      address: '88 Horizon Blvd, Green Valley',
      classGrade: 'Class 8',
      section: 'A',
      admissionDate: new Date('2024-08-15'),
      status: 'Active'
    });

    const peer3 = await Student.create({
      studentId: 'STU-2026-104',
      admissionNumber: 'ADM-2024-004',
      rollNumber: '104',
      firstName: 'Lucas',
      lastName: 'Rios',
      name: 'Lucas Rios',
      dateOfBirth: new Date('2010-10-11'),
      gender: 'Male',
      classGrade: 'Class 8',
      section: 'A',
      status: 'Active'
    });

    // Link students to transport
    routeNorth.assignedStudents.push(childAarav._id, childAnanya._id, peer1._id);
    await routeNorth.save();
    routeWest.assignedStudents.push(childKabir._id);
    await routeWest.save();

    // 5. Seed Attendance Records for past 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      attendanceDays.push(d);
    }

    const studentsForAttendance = [childAarav, childAnanya, childKabir, peer1, peer2, peer3];

    for (let day of attendanceDays) {
      for (let s of studentsForAttendance) {
        // Deterministic status: Aarav was absent on 2 days ago to demonstrate absence alert
        const isAbsentDay = day.getTime() === attendanceDays[attendanceDays.length - 3].getTime() && s._id.toString() === childAarav._id.toString();
        const isLateDay = day.getTime() === attendanceDays[attendanceDays.length - 2].getTime() && s._id.toString() === childAnanya._id.toString();

        await Attendance.create({
          studentId: s._id,
          classGrade: s.classGrade,
          section: s.section,
          date: day,
          status: isAbsentDay ? 'Absent' : isLateDay ? 'Late' : 'Present',
          markedBy: teacherMath._id,
          remarks: isAbsentDay ? 'Medical absence reported by guardian' : isLateDay ? 'School bus transit delay' : 'On time'
        });
      }
    }

    // 6. Seed Fees with Breakdown & Receipts
    const fee1 = await Fee.create({
      studentId: childAarav._id,
      classGrade: childAarav.classGrade,
      month: 'November 2026',
      academicYear: '2026-2027',
      tuition: 850,
      game: 100,
      transport: 150,
      exam: 80,
      events: 50,
      other: 20,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      paidAmount: 1250,
      status: 'Paid',
      paymentDate: new Date(),
      paymentMethod: 'Credit Card',
      paymentReference: 'REC-2026-8801',
      transactionId: 'REC-2026-8801',
      remarks: 'Full term settlement completed online'
    });

    const fee2 = await Fee.create({
      studentId: childAnanya._id,
      classGrade: childAnanya.classGrade,
      month: 'November 2026',
      academicYear: '2026-2027',
      tuition: 750,
      game: 80,
      transport: 150,
      exam: 70,
      events: 40,
      other: 10,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      paidAmount: 500,
      status: 'Partial',
      paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      paymentMethod: 'UPI',
      paymentReference: 'REC-2026-8802',
      transactionId: 'REC-2026-8802',
      remarks: 'First installment received'
    });

    const fee3 = await Fee.create({
      studentId: childKabir._id,
      classGrade: childKabir.classGrade,
      month: 'November 2026',
      academicYear: '2026-2027',
      tuition: 650,
      game: 60,
      transport: 120,
      exam: 50,
      events: 30,
      other: 10,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      paidAmount: 0,
      status: 'Pending',
      paymentReference: 'INV-2026-9041',
      transactionId: 'INV-2026-9041',
      remarks: 'Invoice issued'
    });

    // 7. Seed Homework Assignments
    const hw1 = await Homework.create({
      teacherId: teacherMath._id,
      classGrade: 'Class 8',
      section: 'A',
      subject: 'Mathematics',
      title: 'Quadratic Equations & Parabolic Modeling',
      description: 'Solve exercises 4.2 to 4.5 from Chapter 4. Formulate the quadratic roots and submit graph coordinates on the coordinate plane.',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      attachments: ['https://example.com/math-worksheet-ch4.pdf'],
      submissions: [
        {
          studentId: childAarav._id,
          fileUrl: 'https://example.com/aarav-math-ch4.pdf',
          textSubmission: 'Completed all 15 quadratic solutions with graph plots attached.',
          submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          status: 'Reviewed',
          teacherRemarks: 'Excellent mathematical rigour. All root factorizations verified.',
          marks: 95
        }
      ]
    });

    const hw2 = await Homework.create({
      teacherId: teacherScience._id,
      classGrade: 'Class 8',
      section: 'A',
      subject: 'Science',
      title: 'Fluid Mechanics & Hydrostatic Pressure Lab',
      description: 'Document laboratory observations on buoyant forces, Archimedes principle, and atmospheric pressure gradients.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      attachments: ['https://example.com/physics-fluids-lab.pdf'],
      submissions: [
        {
          studentId: childAarav._id,
          fileUrl: 'https://example.com/aarav-physics-report.pdf',
          textSubmission: 'Lab calculations with pressure vs depth graphs.',
          submittedAt: new Date(),
          status: 'Submitted',
          teacherRemarks: ''
        }
      ]
    });

    const hw3 = await Homework.create({
      teacherId: teacherMath._id,
      classGrade: 'Class 5',
      section: 'B',
      subject: 'Mathematics',
      title: 'Decimal Fractions & Geometry Fundamentals',
      description: 'Complete workbook pages 44 to 48. Calculate perimeter and area of composite rectangles.',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      submissions: []
    });

    // 8. Seed AI & Manual Exams
    const exam1 = await Exam.create({
      title: 'Mid-Term Physics & Mechanics Assessment',
      examType: 'Mid-Term',
      classGrade: 'Class 8',
      section: 'All',
      subject: 'Science',
      roomNo: 'Science Lab 2',
      timeSlot: '09:00 AM - 10:30 AM',
      durationMinutes: 45,
      createdBy: teacherScience._id,
      createdByType: 'ai_generated',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      totalMarks: 30,
      passingMarks: 12,
      status: 'Published',
      questions: [
        {
          question: 'What is the SI unit of pressure?',
          options: ['Pascal (Pa)', 'Newton (N)', 'Joule (J)', 'Watt (W)'],
          correctAnswer: 0,
          marks: 5,
          explanation: 'Pressure is defined as force per unit area. In SI units, 1 Pascal = 1 N/m².'
        },
        {
          question: 'Which principle states that an immersed body experiences an upward buoyant force equal to the weight of fluid displaced?',
          options: ['Bernoulli Principle', 'Archimedes Principle', 'Pascal Law', 'Hooke Law'],
          correctAnswer: 1,
          marks: 5,
          explanation: 'Archimedes principle directly determines buoyant force magnitude.'
        },
        {
          question: 'In a hydraulic lift, if force F1 is applied on small piston area A1, what is the output pressure P2 on larger piston area A2?',
          options: ['P2 is smaller than P1', 'P2 equals P1 (Pascal principle)', 'P2 is zero', 'P2 depends on gravity only'],
          correctAnswer: 1,
          marks: 10,
          explanation: 'Pascal principle dictates that pressure applied to an enclosed liquid is transmitted undiminished.'
        },
        {
          question: 'What happens to atmospheric pressure as altitude increases?',
          options: ['Increases exponentially', 'Decreases monotonically', 'Remains strictly constant', 'Oscillates with temperature only'],
          correctAnswer: 1,
          marks: 10,
          explanation: 'As elevation increases, fewer air molecules remain above, decreasing atmospheric weight and pressure.'
        }
      ],
      submissions: [
        {
          studentId: childAarav._id,
          answers: [
            { questionIndex: 0, selectedOption: 0 },
            { questionIndex: 1, selectedOption: 1 },
            { questionIndex: 2, selectedOption: 1 },
            { questionIndex: 3, selectedOption: 1 }
          ],
          score: 28,
          totalMarks: 30,
          percentage: 93,
          grade: 'A+',
          rank: 1,
          teacherRemarks: 'Outstanding command over physics concepts',
          isPassed: true,
          submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        },
        {
          studentId: peer1._id,
          answers: [],
          score: 25,
          totalMarks: 30,
          percentage: 83,
          grade: 'A',
          rank: 2,
          teacherRemarks: 'Very good grasp of Archimedes principle',
          isPassed: true,
          submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
        },
        {
          studentId: peer2._id,
          answers: [],
          score: 22,
          totalMarks: 30,
          percentage: 73,
          grade: 'B',
          rank: 3,
          teacherRemarks: 'Good conceptual clarity; revise calculation steps',
          isPassed: true,
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          studentId: peer3._id,
          answers: [],
          score: 18,
          totalMarks: 30,
          percentage: 60,
          grade: 'C',
          rank: 4,
          teacherRemarks: 'Satisfactory effort; focus on mechanics formulas',
          isPassed: true,
          submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
        }
      ]
    });

    const exam2 = await Exam.create({
      title: 'Advanced Mathematics Semester Evaluation',
      examType: 'Mid-Term',
      classGrade: 'Class 8',
      section: 'All',
      subject: 'Mathematics',
      roomNo: 'Exam Hall 3',
      timeSlot: '10:00 AM - 12:00 PM',
      durationMinutes: 60,
      createdBy: teacherMath._id,
      createdByType: 'manual',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      totalMarks: 100,
      passingMarks: 40,
      status: 'Published',
      questions: [
        {
          question: 'Find the discriminant of the quadratic equation: 2x² - 4x + 2 = 0',
          options: ['16', '0', '-8', '4'],
          correctAnswer: 1,
          marks: 50,
          explanation: 'Discriminant Δ = b² - 4ac = (-4)² - 4(2)(2) = 16 - 16 = 0 (Real & equal roots).'
        },
        {
          question: 'If the roots of x² - 7x + 12 = 0 are α and β, find the value of (α + β)²',
          options: ['49', '25', '144', '12'],
          correctAnswer: 0,
          marks: 50,
          explanation: 'Sum of roots α + β = -(-7)/1 = 7. Therefore, 7² = 49.'
        }
      ],
      submissions: [
        {
          studentId: childAarav._id,
          answers: [],
          score: 95,
          totalMarks: 100,
          percentage: 95,
          grade: 'A+',
          rank: 1,
          teacherRemarks: 'Exceptional algebraic precision and mathematical rigor',
          isPassed: true,
          submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
        },
        {
          studentId: peer1._id,
          answers: [],
          score: 88,
          totalMarks: 100,
          percentage: 88,
          grade: 'A',
          rank: 2,
          teacherRemarks: 'Solid analytical problem-solving abilities',
          isPassed: true,
          submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
        },
        {
          studentId: peer2._id,
          answers: [],
          score: 78,
          totalMarks: 100,
          percentage: 78,
          grade: 'B',
          rank: 3,
          teacherRemarks: 'Good performance; review quadratic formula derivations',
          isPassed: true,
          submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        },
        {
          studentId: peer3._id,
          answers: [],
          score: 64,
          totalMarks: 100,
          percentage: 64,
          grade: 'C',
          rank: 4,
          teacherRemarks: 'Passed; recommended for additional problem set sessions',
          isPassed: true,
          submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
        }
      ]
    });

    const exam3 = await Exam.create({
      title: 'English Language & Literary Analysis Term Final',
      examType: 'Term Examination',
      classGrade: 'Class 8',
      section: 'All',
      subject: 'English',
      roomNo: 'Auditorium West',
      timeSlot: '09:00 AM - 11:30 AM',
      durationMinutes: 90,
      createdBy: teacherMath._id,
      createdByType: 'manual',
      startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      totalMarks: 100,
      passingMarks: 40,
      status: 'Published',
      questions: [],
      submissions: [
        {
          studentId: childAarav._id,
          answers: [],
          score: 92,
          totalMarks: 100,
          percentage: 92,
          grade: 'A+',
          rank: 1,
          teacherRemarks: 'Superb expressive prose and critical literary insights',
          isPassed: true,
          submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
        },
        {
          studentId: peer1._id,
          answers: [],
          score: 86,
          totalMarks: 100,
          percentage: 86,
          grade: 'A',
          rank: 2,
          teacherRemarks: 'Well-structured creative composition',
          isPassed: true,
          submittedAt: new Date(Date.now() - 7 * 60 * 60 * 1000)
        },
        {
          studentId: peer2._id,
          answers: [],
          score: 75,
          totalMarks: 100,
          percentage: 75,
          grade: 'B',
          rank: 3,
          teacherRemarks: 'Good vocabulary and reading comprehension',
          isPassed: true,
          submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
        }
      ]
    });

    const exam4 = await Exam.create({
      title: 'World History & Civilizations Examination',
      examType: 'Final Exam',
      classGrade: 'Class 8',
      section: 'All',
      subject: 'Social Studies',
      roomNo: 'Room 204',
      timeSlot: '01:30 PM - 03:30 PM',
      durationMinutes: 90,
      createdBy: teacherScience._id,
      createdByType: 'manual',
      startDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      totalMarks: 100,
      passingMarks: 40,
      status: 'Published',
      questions: [],
      submissions: [
        {
          studentId: childAarav._id,
          answers: [],
          score: 90,
          totalMarks: 100,
          percentage: 90,
          grade: 'A+',
          rank: 1,
          teacherRemarks: 'Detailed historical chronology and insightful synthesis',
          isPassed: true,
          submittedAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
        },
        {
          studentId: peer1._id,
          answers: [],
          score: 82,
          totalMarks: 100,
          percentage: 82,
          grade: 'A',
          rank: 2,
          teacherRemarks: 'Solid contextual understanding',
          isPassed: true,
          submittedAt: new Date(Date.now() - 9 * 60 * 60 * 1000)
        }
      ]
    });

    // 9. Seed Staff Payroll Records
    await Payroll.create({
      employeeId: superAdminUser._id,
      salaryMonth: 'November 2026',
      baseSalary: 9500,
      allowances: 1200,
      deductions: 450,
      status: 'Paid',
      paymentDate: new Date(),
      paymentMethod: 'Direct Deposit',
      remarks: 'Super Admin executive compensation disbursed'
    });

    await Payroll.create({
      employeeId: adminUser._id,
      salaryMonth: 'November 2026',
      baseSalary: 8200,
      allowances: 1000,
      deductions: 400,
      status: 'Paid',
      paymentDate: new Date(),
      paymentMethod: 'Direct Deposit',
      remarks: 'Admin executive compensation disbursed'
    });

    await Payroll.create({
      employeeId: teacherMath._id,
      salaryMonth: 'November 2026',
      baseSalary: 5800,
      allowances: 750,
      deductions: 250,
      status: 'Paid',
      paymentDate: new Date(),
      paymentMethod: 'Bank Transfer',
      remarks: 'Faculty salary transfer verified'
    });

    await Payroll.create({
      employeeId: teacherScience._id,
      salaryMonth: 'November 2026',
      baseSalary: 5800,
      allowances: 800,
      deductions: 250,
      status: 'Pending',
      paymentMethod: 'Direct Deposit',
      remarks: 'Scheduled for bi-weekly disbursement'
    });

    // 10. Seed Notices, Events & Gallery
    await Notice.create({
      type: 'Notice',
      title: 'Annual Academic Science Olympiad & Innovation Expo',
      description: 'Registrations are officially open for students in Classes 6 through 12. Selected participants will represent SchoolSphere at the International Science Fair.',
      imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      targetRole: 'all',
      createdBy: principalUser._id
    });

    await Notice.create({
      type: 'Event',
      title: 'Michaelmas Parent-Teacher Executive Conference',
      description: 'Term academic reviews and personalized scholastic roadmaps will be held in the main campus conference auditorium and online.',
      eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      isPublished: true,
      targetRole: 'parent',
      createdBy: principalUser._id
    });

    await Notice.create({
      type: 'Gallery',
      title: 'Autumn Varsity Athletics Championship Highlights',
      description: 'SchoolSphere track and field athletes secure gold medals at the State Interscholastic Invitational.',
      imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
      isPublished: true,
      targetRole: 'all',
      createdBy: teacherMath._id
    });

    // 11. Seed Chat Conversation between Parent (Vikram) and Teacher (Marcus Vance)
    const convId = [parentUser._id.toString(), teacherMath._id.toString()].sort().join(':');

    await Chat.create({
      senderId: parentUser._id,
      receiverId: teacherMath._id,
      message: 'Good morning Professor Vance, I wanted to inquire about Aarav’s progress in Advanced Quadratic Modeling.',
      senderRole: 'parent',
      conversationId: convId,
      isRead: true,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    });

    await Chat.create({
      senderId: teacherMath._id,
      receiverId: parentUser._id,
      message: 'Hello Mr. Sharma. Aarav has displayed exceptional comprehension this term. His latest assessment scored a perfect 100%.',
      senderRole: 'teacher',
      conversationId: convId,
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    await Chat.create({
      senderId: parentUser._id,
      receiverId: teacherMath._id,
      message: 'That is wonderful news, thank you for your dedicated guidance!',
      senderRole: 'parent',
      conversationId: convId,
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000)
    });

    // 12. Seed Email & WhatsApp Communication Logs
    await CommunicationLog.create({
      channel: 'email',
      senderId: adminUser._id,
      recipientTarget: 'all_parents',
      recipientEmail: parentUser.email,
      recipientName: parentUser.name,
      subject: 'Mid-Term Examination Timetable & Revision Guidelines',
      message: 'Dear Parents,\nThe official schedule for the Mid-Term Examination 2026-2027 has been finalized and published. Please ensure your child reviews the syllabi topics on their student portal. Morning sessions commence strictly at 09:00 AM.',
      template: 'exam',
      status: 'Delivered',
      messageId: 'MSG-EM-2026-001',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    });

    await CommunicationLog.create({
      channel: 'whatsapp',
      senderId: adminUser._id,
      recipientTarget: 'individual',
      recipientPhone: parentUser.phone || '+1 (555) 300-0001',
      recipientName: parentUser.name,
      subject: 'Daily Attendance Update',
      message: 'Aarav Sharma has been marked PRESENT at SchoolSphere International Academy on 12/11/2026 at 08:15 AM.',
      template: 'attendance',
      status: 'Delivered',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    });

    await CommunicationLog.create({
      channel: 'email',
      senderId: adminUser._id,
      recipientTarget: 'individual',
      recipientEmail: parentUser.email,
      recipientName: parentUser.name,
      subject: 'Tuition Fee Invoice Issued — November 2026',
      message: 'Tuition invoice for Aarav Sharma has been generated. Balance due is $1,250 by 22/11/2026. Electronic receipts and debit/credit payment are supported in your portal.',
      template: 'fee',
      status: 'Delivered',
      messageId: 'MSG-EM-2026-002',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    await CommunicationLog.create({
      channel: 'whatsapp',
      senderId: adminUser._id,
      recipientTarget: 'all_parents',
      recipientPhone: '+1 (555) 300-0001',
      recipientName: 'School Community',
      subject: 'Campus Notice',
      message: 'Reminder: Inter-House Science & Robotics Exhibition will take place this Friday in the Main Auditorium at 10:00 AM. Parents are warmly invited.',
      template: 'notice',
      status: 'Delivered',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    });

    logger.info('===========================================================');
    logger.info(' Database seeded successfully with SchoolSphere dataset!');
    logger.info(' Demo Accounts:');
    logger.info(' Super Admin : admin@schoolsphere.com     / admin123');
    logger.info(' Principal   : principal@schoolsphere.com / principal123');
    logger.info(' Teacher     : teacher@schoolsphere.com   / teacher123');
    logger.info(' Parent      : parent@schoolsphere.com    / parent123');
    logger.info(' Student     : student@schoolsphere.com   / student123');
    logger.info('===========================================================');

    return { success: true };
  } catch (err) {
    logger.error('Error during database seed execution', err);
    throw err;
  }
};

// If run via CLI: node seed/seedDatabase.js
if (process.argv[1] && process.argv[1].endsWith('seedDatabase.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
