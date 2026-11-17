import Transport from '../models/Transport.js';
import Student from '../models/Student.js';

// @desc    Get all transport routes
// @route   GET /api/transport
// @access  Private
export const getAllRoutes = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { routeName: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } }
      ];
    }

    const routes = await Transport.find(query).populate('assignedStudents', 'name studentId classGrade section');
    res.status(200).json({ success: true, count: routes.length, data: routes });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single route
// @route   GET /api/transport/:id
// @access  Private
export const getRouteById = async (req, res, next) => {
  try {
    const route = await Transport.findById(req.params.id).populate('assignedStudents', 'name studentId rollNumber classGrade section phone profileImage');
    if (!route) {
      return res.status(404).json({ success: false, message: 'Transport route not found' });
    }
    res.status(200).json({ success: true, data: route });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assigned route for logged in parent's child or student
// @route   GET /api/transport/my-route
// @access  Private
export const getMyRoute = async (req, res, next) => {
  try {
    const { studentId } = req.query;
    let student = null;

    if (req.user.role === 'parent') {
      if (studentId) {
        student = await Student.findOne({ _id: studentId, parentIds: req.user._id }).populate('routeId');
      } else {
        student = await Student.findOne({ parentIds: req.user._id }).populate('routeId');
      }
    } else if (req.user.role === 'student') {
      student = await Student.findOne({ userId: req.user._id }).populate('routeId');
    }

    if (!student || !student.routeId) {
      return res.status(200).json({ success: true, data: null, message: 'No transport route assigned' });
    }

    res.status(200).json({ success: true, data: student.routeId });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new transport route
// @route   POST /api/transport
// @access  Private (Admin / Principal)
export const createRoute = async (req, res, next) => {
  try {
    const { routeName, vehicleNumber, vehicleType, driverName, driverPhone, capacity, pickupPoints, status } = req.body;

    const existing = await Transport.findOne({ vehicleNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Vehicle number already registered' });
    }

    const route = await Transport.create({
      routeName,
      vehicleNumber,
      vehicleType: vehicleType || 'Bus',
      driverName,
      driverPhone,
      capacity: capacity || 40,
      pickupPoints: pickupPoints || [],
      status: status || 'Active'
    });

    res.status(201).json({ success: true, message: 'Transport route created', data: route });
  } catch (err) {
    next(err);
  }
};

// @desc    Update transport route
// @route   PUT /api/transport/:id
// @access  Private (Admin / Principal)
export const updateRoute = async (req, res, next) => {
  try {
    const route = await Transport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!route) {
      return res.status(404).json({ success: false, message: 'Transport route not found' });
    }
    res.status(200).json({ success: true, message: 'Route updated successfully', data: route });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete transport route
// @route   DELETE /api/transport/:id
// @access  Private (Admin)
export const deleteRoute = async (req, res, next) => {
  try {
    const route = await Transport.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    // Remove route reference from students
    await Student.updateMany({ routeId: req.params.id }, { $set: { routeId: null } });
    res.status(200).json({ success: true, message: 'Transport route deleted' });
  } catch (err) {
    next(err);
  }
};
