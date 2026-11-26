import Student from '../models/Student.js';
import User from '../models/User.js';

// @desc    Get all students with filters & pagination
// @route   GET /api/students
// @access  Private
export const getAllStudents = async (req, res, next) => {
  try {
    const { classGrade, section, search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (classGrade) query.classGrade = classGrade;
    if (section) query.section = section;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based restrictions
    if (req.user.role === 'parent') {
      query.parentIds = req.user._id;
    } else if (req.user.role === 'student') {
      query.userId = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('parentIds', 'name email phone')
      .populate('routeId', 'routeName vehicleNumber driverName driverPhone')
      .sort({ classGrade: 1, section: 1, rollNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        students,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)) || 1
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private
export const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('parentIds', 'name email phone address')
      .populate('routeId');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // RBAC check: Parent can only access their child
    if (req.user.role === 'parent') {
      const isMyChild = student.parentIds.some(
        (p) => p._id.toString() === req.user._id.toString() || p.toString() === req.user._id.toString()
      );
      if (!isMyChild) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to student record' });
      }
    }

    // Student can only access their own record
    if (req.user.role === 'student' && student.userId && student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to student record' });
    }

    res.status(200).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin / Principal)
export const createStudent = async (req, res, next) => {
  try {
    const {
      name,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      address,
      parentIds,
      rollNumber,
      classGrade,
      section,
      admissionNumber,
      admissionDate,
      routeId,
      profileImage,
      status
    } = req.body;

    const studentId = req.body.studentId || `STU-${Date.now().toString().slice(-6)}`;
    const admNo = admissionNumber || `ADM-${Date.now().toString().slice(-5)}`;

    let studentName = name;
    if (!studentName && (firstName || lastName)) {
      studentName = `${firstName || ''} ${lastName || ''}`.trim();
    }

    const student = await Student.create({
      studentId,
      firstName: firstName || '',
      lastName: lastName || '',
      name: studentName,
      dateOfBirth,
      gender: gender || 'Male',
      email: email || '',
      phone: phone || '',
      address: address || '',
      parentIds: Array.isArray(parentIds) ? parentIds : parentIds ? [parentIds] : [],
      rollNumber: rollNumber || '1',
      classGrade,
      section: section || 'A',
      admissionNumber: admNo,
      admissionDate: admissionDate || Date.now(),
      routeId: routeId || null,
      profileImage: profileImage || '',
      status: status || 'Active'
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: student
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private (Admin / Principal)
export const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('parentIds', 'name email phone');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Student record updated',
      data: student
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
export const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, message: 'Student removed successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get children belonging to authenticated parent (Multi-Child Support)
// @route   GET /api/students/my-children
// @access  Private (Parent)
export const getMyChildren = async (req, res, next) => {
  try {
    // Strictly fetch only children linked to THIS parent
    const children = await Student.find({ parentIds: req.user._id })
      .populate('routeId', 'routeName vehicleNumber driverName driverPhone')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: children.length,
      data: children
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get list of unique classes and sections
// @route   GET /api/students/classes-meta
// @access  Private
export const getClassesMeta = async (req, res, next) => {
  try {
    const classes = await Student.distinct('classGrade');
    const sections = await Student.distinct('section');

    const defaultClasses = [
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
      'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
    ];
    const classNum = (c) => parseInt(c.replace(/\D/g, '')) || 0;
    const mergedClasses = Array.from(new Set([...defaultClasses, ...(classes || [])]))
      .sort((a, b) => classNum(a) - classNum(b));

    const defaultSections = ['A', 'B', 'C', 'D'];
    const mergedSections = Array.from(new Set([...defaultSections, ...(sections || [])])).sort();

    res.status(200).json({
      success: true,
      data: {
        classes: mergedClasses,
        sections: mergedSections
      }
    });
  } catch (err) {
    next(err);
  }
};
