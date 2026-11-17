import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = ENV.SMTP_USER || ENV.EMAIL_USER;
  const pass = ENV.SMTP_PASS || ENV.EMAIL_APP_PASSWORD;

  if (user && pass) {
    try {
      if (ENV.SMTP_HOST && ENV.SMTP_HOST !== 'smtp.gmail.com') {
        transporter = nodemailer.createTransport({
          host: ENV.SMTP_HOST,
          port: Number(ENV.SMTP_PORT) || 587,
          secure: Number(ENV.SMTP_PORT) === 465,
          auth: { user, pass }
        });
      } else {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass }
        });
      }
      logger.info('Nodemailer SMTP transporter configured successfully.');
    } catch (err) {
      logger.error('Failed to create Nodemailer transporter', err);
    }
  } else {
    logger.warn('SMTP credentials not configured. Running in mock email log mode.');
  }
  return transporter;
};

// Base send email helper
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = getTransporter();
    if (!transport) {
      logger.info(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
      return { success: true, mock: true };
    }

    const senderEmail = ENV.SMTP_USER || ENV.EMAIL_USER || 'noreply@schoolsphere.com';
    const info = await transport.sendMail({
      from: `"${ENV.EMAIL_FROM_NAME}" <${senderEmail}>`,
      to,
      subject,
      text: text || '',
      html
    });

    logger.info(`Email successfully dispatched to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`Error sending email to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// Reusable notification functions as required by specification
export const sendAttendanceNotification = async ({ to, studentName, date, status, classGrade }) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F8FA; color: #171717; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #E5E7EB;">
      <div style="padding-bottom: 16px; border-bottom: 1px solid #E5E7EB; margin-bottom: 20px;">
        <span style="font-size: 18px; font-weight: 700; color: #111827;">SchoolSphere</span>
        <span style="display: block; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;">Official Attendance Notice</span>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">Dear Parent / Guardian,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #4B5563;">This notification is to inform you that your child has been recorded as <strong>${status}</strong> today.</p>
      <div style="background-color: #FFFFFF; border: 1px solid #E5E7EB; border-left: 4px solid ${status === 'Absent' ? '#B91C1C' : '#B45309'}; padding: 18px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Student Name:</strong> ${studentName}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Class & Section:</strong> ${classGrade}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Recorded Date:</strong> ${new Date(date).toLocaleDateString()}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Status:</strong> <span style="font-weight: 700; color: ${status === 'Absent' ? '#B91C1C' : '#B45309'};">${status}</span></p>
      </div>
      <p style="font-size: 13px; color: #6B7280; line-height: 1.5;">If this absence was unplanned or if you believe this record is in error, please contact the school administration office.</p>
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
        &copy; ${new Date().getFullYear()} SchoolSphere — Premium School Management System. All rights reserved.
      </div>
    </div>
  `;
  return sendEmail({
    to,
    subject: `Attendance Alert: ${studentName} marked ${status}`,
    html
  });
};

export const sendFeeReminder = async ({ to, studentName, totalAmount, remainingAmount, dueDate, paymentReference }) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F8FA; color: #171717; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #E5E7EB;">
      <div style="padding-bottom: 16px; border-bottom: 1px solid #E5E7EB; margin-bottom: 20px;">
        <span style="font-size: 18px; font-weight: 700; color: #111827;">SchoolSphere</span>
        <span style="display: block; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;">Tuition & Fee Notification</span>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">Dear Parent / Guardian,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #4B5563;">Please review the updated tuition and fee summary for <strong>${studentName}</strong>.</p>
      <div style="background-color: #FFFFFF; border: 1px solid #E5E7EB; padding: 18px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Reference:</strong> ${paymentReference || 'INV-' + Date.now().toString().slice(-6)}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Total Amount:</strong> $${totalAmount}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Outstanding Balance:</strong> <span style="font-weight: 700; color: #B45309;">$${remainingAmount}</span></p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      </div>
      <p style="font-size: 13px; color: #6B7280; line-height: 1.5;">You can view official receipts and complete your settlement securely via the SchoolSphere parent portal.</p>
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
        &copy; ${new Date().getFullYear()} SchoolSphere Bursary Office
      </div>
    </div>
  `;
  return sendEmail({
    to,
    subject: `Tuition & Fee Notice - ${studentName}`,
    html
  });
};

export const sendHomeworkNotification = async ({ to, studentName, title, subject, dueDate }) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F8FA; color: #171717; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #E5E7EB;">
      <div style="padding-bottom: 16px; border-bottom: 1px solid #E5E7EB; margin-bottom: 20px;">
        <span style="font-size: 18px; font-weight: 700; color: #111827;">SchoolSphere</span>
        <span style="display: block; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;">New Homework Assigned</span>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">Dear Student / Parent,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #4B5563;">A new academic assignment has been assigned for <strong>${studentName}</strong>:</p>
      <div style="background-color: #FFFFFF; border: 1px solid #E5E7EB; padding: 18px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Subject:</strong> ${subject}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Assignment Title:</strong> ${title}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Submission Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      </div>
      <p style="font-size: 13px; color: #6B7280; line-height: 1.5;">Please log into your portal to view assignment attachments and instructions.</p>
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
        &copy; ${new Date().getFullYear()} SchoolSphere Academic Faculty
      </div>
    </div>
  `;
  return sendEmail({
    to,
    subject: `New Homework Assigned: ${subject} - ${title}`,
    html
  });
};

export const sendExamNotification = async ({ to, studentName, title, subject, startDate, durationMinutes }) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F8FA; color: #171717; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #E5E7EB;">
      <div style="padding-bottom: 16px; border-bottom: 1px solid #E5E7EB; margin-bottom: 20px;">
        <span style="font-size: 18px; font-weight: 700; color: #111827;">SchoolSphere</span>
        <span style="display: block; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;">Upcoming Examination Schedule</span>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #374151;">Dear Student / Parent,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #4B5563;">An examination has been scheduled for <strong>${studentName}</strong>:</p>
      <div style="background-color: #FFFFFF; border: 1px solid #E5E7EB; padding: 18px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Exam Title:</strong> ${title}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Subject:</strong> ${subject}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Start Date:</strong> ${new Date(startDate).toLocaleString()}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Duration:</strong> ${durationMinutes} Minutes</p>
      </div>
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
        &copy; ${new Date().getFullYear()} SchoolSphere Examinations Directorate
      </div>
    </div>
  `;
  return sendEmail({
    to,
    subject: `Exam Scheduled: ${subject} - ${title}`,
    html
  });
};

export const emailTemplates = {
  attendanceAlert: ({ studentName, date, status, classGrade }) => `
    <div style="font-family: -apple-system, sans-serif; padding: 20px; background: #F7F8FA; color: #171717;">
      <h3>Attendance Alert</h3>
      <p>Student: <strong>${studentName}</strong> (${classGrade}) was marked <strong>${status}</strong> on ${new Date(date).toLocaleDateString()}.</p>
    </div>
  `,
  feeReminder: ({ studentName, totalAmount, remainingAmount, dueDate, invoiceNumber }) => `
    <div style="font-family: -apple-system, sans-serif; padding: 20px; background: #F7F8FA; color: #171717;">
      <h3>Fee Notification</h3>
      <p>Student: <strong>${studentName}</strong></p>
      <p>Outstanding: <strong>$${remainingAmount}</strong> of $${totalAmount}</p>
      <p>Due Date: ${new Date(dueDate).toLocaleDateString()}</p>
    </div>
  `,
  homeworkNotification: ({ studentName, title, subject, dueDate }) => `
    <div style="font-family: -apple-system, sans-serif; padding: 20px; background: #F7F8FA; color: #171717;">
      <h3>New Homework</h3>
      <p>Student: <strong>${studentName}</strong></p>
      <p>Subject: <strong>${subject}</strong></p>
      <p>Title: <strong>${title}</strong></p>
      <p>Due: ${new Date(dueDate).toLocaleDateString()}</p>
    </div>
  `
};
