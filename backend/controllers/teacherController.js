import Teacher from '../models/Teacher.js';
import User from '../models/User.js';

// Auto-sync function: Ensures all users with role 'teacher' exist in the Teacher collection/table
export const syncExistingFaculty = async () => {
  try {
    const teacherUsers = await User.find({ role: 'teacher' });
    let count = 0;

    for (const u of teacherUsers) {
      const existing = await Teacher.findOne({
        $or: [{ userId: u._id }, { email: u.email.toLowerCase() }]
      });

      if (!existing) {
        count++;
        const tId = `TCH-2026-${String(count).padStart(3, '0')}`;
        await Teacher.create({
          userId: u._id,
          teacherId: tId,
          name: u.name,
          email: u.email.toLowerCase(),
          phone: u.phone || '+1 (555) 200-0001',
          department: u.name.toLowerCase().includes('science')
            ? 'Science'
            : u.name.toLowerCase().includes('math')
            ? 'Mathematics'
            : 'General Academics',
          designation: 'Senior Faculty',
          qualification: 'M.Ed., Pedagogical Specialist',
          profileImage: u.profileImage || '',
          salary: 4800,
          status: u.isActive !== false ? 'Active' : 'Inactive',
          isActive: u.isActive !== false
        });
      }
    }

    if (count > 0) {
      console.log(`[SYNC] Initialized ${count} teacher records in Teacher database collection.`);
    }
  } catch (err) {
    console.warn('[SYNC ERROR] Teacher sync warning:', err.message);
  }
};

// @desc    Get all teachers with search, filter & pagination
// @route   GET /api/teachers
// @access  Private
export const getAllTeachers = async (req, res, next) => {
  try {
    const { department, status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Teacher.countDocuments(query);
    const teachers = await Teacher.find(query)
      .populate('userId', 'name email role phone profileImage isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        teachers,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private
export const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('userId', '-password');
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher record not found in database' });
    }
    res.status(200).json({ success: true, data: teacher });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new teacher (Super Admin / Admin)
// @route   POST /api/teachers
// @access  Private (Super Admin / Admin / Principal)
export const createTeacher = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password = 'Teacher@123',
      department = 'General Academics',
      designation = 'Teaching Faculty',
      qualification = 'B.Ed., Master of Education',
      salary = 4500,
      gender = 'Female',
      dateOfBirth,
      joiningDate,
      address = '',
      profileImage = '',
      assignedClasses = []
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required to register a teacher.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if teacher already exists in Teacher collection
    const existingTeacher = await Teacher.findOne({ email: normalizedEmail });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'A teacher with this email already exists in the database.'
      });
    }

    // Check or create linked User login account
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'teacher',
        phone: phone || '',
        profileImage: profileImage || ''
      });
    }

    // Generate unique Teacher ID
    const count = await Teacher.countDocuments();
    const teacherId = `TCH-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const newTeacher = await Teacher.create({
      userId: user._id,
      teacherId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone || '',
      department,
      designation,
      qualification,
      salary: Number(salary) || 4500,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      address,
      profileImage: profileImage || '',
      assignedClasses: Array.isArray(assignedClasses) ? assignedClasses : [],
      status: 'Active',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: `Teacher ${newTeacher.name} successfully created in database table.`,
      data: newTeacher
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (Super Admin / Admin / Principal)
export const updateTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher record not found in database' });
    }

    const {
      name,
      phone,
      department,
      designation,
      qualification,
      salary,
      address,
      status,
      assignedClasses,
      profileImage
    } = req.body;

    if (name) teacher.name = name.trim();
    if (phone !== undefined) teacher.phone = phone;
    if (department) teacher.department = department;
    if (designation) teacher.designation = designation;
    if (qualification) teacher.qualification = qualification;
    if (salary !== undefined) teacher.salary = Number(salary);
    if (address !== undefined) teacher.address = address;
    if (status) {
      teacher.status = status;
      teacher.isActive = status === 'Active';
    }
    if (assignedClasses) teacher.assignedClasses = assignedClasses;
    if (profileImage !== undefined) teacher.profileImage = profileImage;

    await teacher.save();

    // Synchronize User profile if linked
    if (teacher.userId) {
      await User.findByIdAndUpdate(teacher.userId, {
        name: teacher.name,
        phone: teacher.phone,
        profileImage: teacher.profileImage,
        isActive: teacher.isActive
      });
    }

    res.status(200).json({
      success: true,
      message: 'Teacher record updated successfully in database',
      data: teacher
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Super Admin / Admin)
export const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher record not found in database' });
    }

    // Delete linked User login account if present
    if (teacher.userId) {
      await User.findByIdAndDelete(teacher.userId);
    }

    await Teacher.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Teacher ${teacher.name} deleted successfully from database.`
    });
  } catch (err) {
    next(err);
  }
};
