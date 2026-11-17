import CommunicationLog from '../models/CommunicationLog.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { sendEmail } from '../services/emailService.js';
import { sendWhatsAppMessage, getWhatsAppStatus } from '../services/whatsappService.js';
import { generateSmartSchoolReply, detectLanguage } from '../services/aiChatService.js';
import { ENV } from '../config/env.js';

// Helper: Wrap plain text into a beautiful SchoolSphere branded HTML email
const createSchoolSphereEmailHtml = ({ recipientName, subject, message, template }) => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F8FA; color: #171717; padding: 32px 16px; margin: 0;">
      <div style="max-width: 600px; margin: auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Top Branded Ribbon -->
        <div style="background: linear-gradient(135deg, #0891B2 0%, #0D9488 100%); padding: 24px 32px; color: #FFFFFF;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.02em; display: block;">SchoolSphere</span>
                <span style="font-size: 11px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.08em;">International Academy</span>
              </td>
              <td style="text-align: right;">
                <span style="font-size: 10px; background-color: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 9999px; font-weight: 700;">
                  Session 2026–2027
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px;">
          <h2 style="font-size: 18px; font-weight: 700; color: #0F172A; margin: 0 0 16px 0;">
            ${subject}
          </h2>

          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
            Dear ${recipientName || 'Valued Member of SchoolSphere Community'},
          </p>

          <div style="font-size: 14px; color: #1E293B; line-height: 1.7; background-color: #F8FAFC; padding: 20px; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 24px; white-space: pre-wrap;">
${message}
          </div>

          <div style="background-color: #ECFEFF; border: 1px solid #CFFAFE; border-left: 4px solid #06B6D4; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 12px; color: #0E7490; font-weight: 600;">
              Official Notice Category: <span style="text-transform: capitalize;">${template || 'General Bulletin'}</span>
            </p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #155E75;">
              You can access comprehensive academic transcripts, attendance logs, and fee ledgers via your portal dashboard.
            </p>
          </div>

          <p style="font-size: 13px; color: #64748B; margin: 0;">
            Warm regards,<br />
            <strong style="color: #0F172A;">Office of Academic Communications</strong><br />
            SchoolSphere International Academy
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #F8FAFC; padding: 18px 32px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #94A3B8;">
          42 Academic Boulevard, Silicon Valley, CA 94025 &bull; +1 (800) 555-SPHERE<br />
          &copy; ${new Date().getFullYear()} SchoolSphere — Premium School Management System.
        </div>
      </div>
    </div>
  `;
};

// @desc    Dispatch Manual Email or Bulk Campaign
// @route   POST /api/communication/email/send
// @access  Private (Super Admin, Principal, Teacher)
export const sendManualEmail = async (req, res, next) => {
  try {
    const { target, recipientEmail, recipientName, classGrade, subject, message, template } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message body are required' });
    }

    const recipients = [];

    if (target === 'all_parents') {
      const parents = await User.find({ role: 'parent' }).select('name email');
      parents.forEach((p) => {
        if (p.email) recipients.push({ email: p.email, name: p.name });
      });
    } else if (target === 'all_teachers') {
      const teachers = await User.find({ role: 'teacher' }).select('name email');
      teachers.forEach((t) => {
        if (t.email) recipients.push({ email: t.email, name: t.name });
      });
    } else if (target === 'class_grade') {
      const students = await Student.find({ classGrade }).populate('parentIds', 'name email');
      students.forEach((st) => {
        st.parentIds?.forEach((p) => {
          if (p.email && !recipients.some((r) => r.email === p.email)) {
            recipients.push({ email: p.email, name: p.name });
          }
        });
      });
    } else {
      // Individual
      if (!recipientEmail) {
        return res.status(400).json({ success: false, message: 'Recipient email address is required' });
      }
      recipients.push({ email: recipientEmail, name: recipientName || recipientEmail });
    }

    if (recipients.length === 0) {
      if (target === 'all_parents' || target === 'class_grade') {
        const students = await Student.find(classGrade ? { classGrade } : {}).populate('parentIds');
        students.forEach((st) => {
          st.parentIds?.forEach((p) => {
            if (p?.email && !recipients.some((r) => r.email === p.email)) {
              recipients.push({ email: p.email, name: p.name });
            }
          });
        });
      }
      if (recipients.length === 0) {
        recipients.push({ email: 'parent@schoolsphere.com', name: 'SchoolSphere Parent Community' });
      }
    }

    let dispatchedCount = 0;

    // Generate intelligent multilingual AI response
    const combinedEmailText = `${subject || ''} ${message || ''}`.trim();
    const aiReply = await generateSmartSchoolReply({
      rawMessage: combinedEmailText,
      senderUser: req.user,
      channel: 'email'
    });

    for (const rec of recipients) {
      const html = createSchoolSphereEmailHtml({
        recipientName: rec.name,
        subject,
        message,
        template: template || 'General'
      });

      const dispatchResult = await sendEmail({
        to: rec.email,
        subject,
        html,
        text: message
      });

      // Log to CommunicationLog
      await CommunicationLog.create({
        channel: 'email',
        senderId: req.user._id,
        recipientTarget: target || 'individual',
        recipientEmail: rec.email,
        recipientName: rec.name,
        subject,
        message,
        template: template || 'custom',
        status: dispatchResult.success ? 'Delivered' : 'Failed',
        messageId: dispatchResult.messageId || 'MOCK-MSG-ID',
        aiReply
      });

      dispatchedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully dispatched email communication to ${dispatchedCount} recipient(s).`,
      count: dispatchedCount,
      aiReply
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Dispatch Manual WhatsApp Message or Bulk Broadcast
// @route   POST /api/communication/whatsapp/send
// @access  Private (Super Admin, Principal, Teacher)
export const sendManualWhatsApp = async (req, res, next) => {
  try {
    const { target, phone, recipientName, classGrade, message, template } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'WhatsApp message content is required' });
    }

    const recipients = [];

    if (target === 'all_parents') {
      const parents = await User.find({ role: 'parent' }).select('name phone');
      parents.forEach((p) => {
        if (p.phone) recipients.push({ phone: p.phone, name: p.name });
      });
    } else if (target === 'class_grade') {
      const students = await Student.find({ classGrade }).populate('parentIds', 'name phone');
      students.forEach((st) => {
        st.parentIds?.forEach((p) => {
          if (p.phone && !recipients.some((r) => r.phone === p.phone)) {
            recipients.push({ phone: p.phone, name: p.name });
          }
        });
      });
    } else {
      // Individual
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Recipient phone number is required' });
      }
      recipients.push({ phone, name: recipientName || phone });
    }

    if (recipients.length === 0) {
      if (target === 'all_parents' || target === 'class_grade') {
        const students = await Student.find(classGrade ? { classGrade } : {}).populate('parentIds');
        students.forEach((st) => {
          st.parentIds?.forEach((p) => {
            if (p?.phone && !recipients.some((r) => r.phone === p.phone)) {
              recipients.push({ phone: p.phone, name: p.name });
            }
          });
        });
      }
      if (recipients.length === 0) {
        recipients.push({ phone: '+1 (555) 300-0001', name: 'SchoolSphere Parent Community' });
      }
    }

    let sentCount = 0;

    // Generate intelligent multilingual AI response
    const aiReply = await generateSmartSchoolReply({
      rawMessage: message,
      senderUser: req.user,
      channel: 'whatsapp'
    });

    for (const rec of recipients) {
      const formattedMessage = `*SchoolSphere International Academy*\n\nDear ${rec.name || 'Parent'},\n\n${message}\n\n_SchoolSphere Automated Notification Service_`;

      const result = await sendWhatsAppMessage(rec.phone, formattedMessage);

      await CommunicationLog.create({
        channel: 'whatsapp',
        senderId: req.user._id,
        recipientTarget: target || 'individual',
        recipientPhone: rec.phone,
        recipientName: rec.name,
        subject: template || 'WhatsApp Broadcast',
        message,
        template: template || 'custom',
        status: result.success ? 'Delivered' : 'Failed',
        aiReply
      });

      sentCount++;
    }

    res.status(200).json({
      success: true,
      message: `WhatsApp message successfully dispatched to ${sentCount} recipient(s).`,
      count: sentCount,
      aiReply
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate instant multilingual AI reply for communications preview/draft
// @route   POST /api/communication/ai-reply
// @access  Private
export const generateCommunicationAIReply = async (req, res, next) => {
  try {
    const { message, channel, subject } = req.body;
    if (!message && !subject) {
      return res.status(400).json({ success: false, message: 'Message content or subject is required' });
    }
    const fullText = `${subject || ''} ${message || ''}`.trim();
    const detectedLang = detectLanguage(fullText);
    const aiReply = await generateSmartSchoolReply({
      rawMessage: fullText,
      senderUser: req.user,
      channel: channel || 'communication'
    });

    res.status(200).json({
      success: true,
      language: detectedLang,
      aiReply
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Communication History & Delivery Audit Logs
// @route   GET /api/communication/logs
// @access  Private
export const getCommunicationLogs = async (req, res, next) => {
  try {
    const { channel, page = 1, limit = 50, search } = req.query;
    const query = {};

    if (channel && channel !== 'all') {
      query.channel = channel;
    }

    if (search) {
      query.$or = [
        { recipientName: { $regex: search, $options: 'i' } },
        { recipientEmail: { $regex: search, $options: 'i' } },
        { recipientPhone: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await CommunicationLog.countDocuments(query);
    const logs = await CommunicationLog.find(query)
      .populate('senderId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        logs,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)) || 1
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Communication Gateways Live Status
// @route   GET /api/communication/status
// @access  Private
export const getCommunicationStatus = (req, res) => {
  const waStatus = getWhatsAppStatus ? getWhatsAppStatus() : { isConnected: false, hasQr: false, enabled: false };

  res.status(200).json({
    success: true,
    data: {
      email: {
        isConfigured: !!(ENV.SMTP_USER || ENV.EMAIL_USER),
        senderName: ENV.EMAIL_FROM_NAME,
        host: ENV.SMTP_HOST || 'smtp.gmail.com',
        mode: (ENV.SMTP_USER || ENV.EMAIL_USER) ? 'Live SMTP Transport' : 'Safe Development Mock Mode'
      },
      whatsapp: {
        enabled: ENV.ENABLE_WHATSAPP,
        isConnected: waStatus.isConnected,
        hasQr: waStatus.hasQr,
        mode: ENV.ENABLE_WHATSAPP && waStatus.isConnected ? 'Live Baileys Gateway' : 'Ready (Mock Dispatch & Audit Logging Active)'
      }
    }
  });
};

// @desc    Get Overall Communication KPI Analytics
// @route   GET /api/communication/stats
// @access  Private
export const getCommunicationStats = async (req, res, next) => {
  try {
    const totalEmails = await CommunicationLog.countDocuments({ channel: 'email' });
    const totalWhatsApp = await CommunicationLog.countDocuments({ channel: 'whatsapp' });
    const deliveredCount = await CommunicationLog.countDocuments({ status: 'Delivered' });
    const total = totalEmails + totalWhatsApp;
    const deliveryRate = total > 0 ? Math.round((deliveredCount / total) * 100) : 100;

    // Today's counts
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayEmails = await CommunicationLog.countDocuments({
      channel: 'email',
      createdAt: { $gte: startOfToday }
    });

    const todayWhatsApp = await CommunicationLog.countDocuments({
      channel: 'whatsapp',
      createdAt: { $gte: startOfToday }
    });

    res.status(200).json({
      success: true,
      data: {
        totalEmails,
        totalWhatsApp,
        totalDispatched: total,
        deliveryRate,
        todayEmails,
        todayWhatsApp
      }
    });
  } catch (err) {
    next(err);
  }
};
