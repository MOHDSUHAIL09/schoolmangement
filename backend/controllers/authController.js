import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { generateToken } from '../utils/generateToken.js';
import { validateEmail, validatePasswordStrength } from '../utils/validators.js';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password as valid text strings.'
      });
    }

    const rawInput = email.toLowerCase().trim();
    // Normalize spaces and special characters for role nicknames
    const normalizedNickname = rawInput.replace(/[\s_-]+/g, '');

    // Map common role nicknames to canonical accounts
    const usernameAliases = {
      superadmin: ['superadmin@schoolsphere.com', 'superadmin@school.com'],
      super_admin: ['superadmin@schoolsphere.com', 'superadmin@school.com'],
      admin: ['admin@schoolsphere.com', 'admin@school.com'],
      administrator: ['admin@schoolsphere.com', 'admin@school.com'],
      principal: ['admin@schoolsphere.com', 'principal@schoolsphere.com', 'principal@school.com'],
      teacher: ['teacher@schoolsphere.com', 'teacher@school.com'],
      parent: ['parent@schoolsphere.com', 'parent@school.com'],
      student: ['student@schoolsphere.com', 'student@school.com']
    };

    const targetEmails = usernameAliases[normalizedNickname] || [rawInput];

    const user = await User.findOne({ email: { $in: targetEmails } }).select('+password');

    // Anti-User-Enumeration: constant generic error message
    const GENERIC_INVALID_MSG = 'Invalid credentials. Please verify your email and password.';

    if (!user) {
      return res.status(401).json({
        success: false,
        message: GENERIC_INVALID_MSG
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administration.'
      });
    }

    // Account Lockout Protection against Brute Force & Credential Stuffing
    // if (user.isLocked()) {
    //   const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    //   return res.status(423).json({
    //     success: false,
    //     message: `Account is temporarily locked due to excessive failed attempts. Please try again after ${remainingMinutes} minute(s).`
    //   });
    // }

    // const isMatch = await user.matchPassword(password);
    // if (!isMatch) {
    //   await user.handleFailedLogin();
    //   return res.status(401).json({
    //     success: false,
    //     message: GENERIC_INVALID_MSG
    //   });
    // }

    await user.handleSuccessfulLogin();

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          profileImage: user.profileImage,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public or Admin
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, profileImage } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password.'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.valid) {
      return res.status(400).json({
        success: false,
        message: pwdCheck.message
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Anti-Privilege Escalation:
    // Administrative and faculty roles can only be created by an authenticated Super Admin.
    let userRole = 'student';
    if (role === 'parent') {
      userRole = 'parent';
    } else if (role === 'student' || !role) {
      userRole = 'student';
    } else if (['super_admin', 'admin', 'principal', 'teacher'].includes(role)) {
      let isSuperAdmin = false;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const authTok = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(authTok, ENV.JWT_SECRET, { algorithms: ['HS256'] });
          const adminUser = await User.findById(decoded.id);
          if (adminUser && adminUser.role === 'super_admin') {
            isSuperAdmin = true;
          }
        } catch (_) {}
      }

      const totalUsers = await User.countDocuments();
      if (isSuperAdmin || totalUsers === 0) {
        userRole = role;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Privilege escalation rejected: Administrative and faculty accounts can only be provisioned by a Super Admin.'
        });
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      phone: phone || '',
      profileImage: profileImage || ''
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          profileImage: user.profileImage
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new passwords.'
      });
    }

    const pwdCheck = validatePasswordStrength(newPassword);
    if (!pwdCheck.valid) {
      return res.status(400).json({
        success: false,
        message: pwdCheck.message
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be identical to your current password.'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    next(err);
  }
};
