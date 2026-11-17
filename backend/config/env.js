import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_school_management_jwt_key_2026_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  
  // Nodemailer / SMTP
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || process.env.EMAIL_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD || '',
  EMAIL_USER: process.env.EMAIL_USER || process.env.SMTP_USER || '',
  EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS || '',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'SchoolSphere — Premium School Management System',
  
  // WhatsApp Baileys
  ENABLE_WHATSAPP: process.env.ENABLE_WHATSAPP === 'true',
  WHATSAPP_SESSION_PATH: process.env.WHATSAPP_SESSION_PATH || './whatsapp_auth'
};
