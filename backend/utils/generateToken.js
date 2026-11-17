import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      tokenVersion: user.tokenVersion || 0
    },
    ENV.JWT_SECRET,
    {
      expiresIn: ENV.JWT_EXPIRES_IN
    }
  );
};
