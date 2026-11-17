import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

let sock = null;
let isConnected = false;
let qrCodeString = null;

export const initWhatsApp = async () => {
  if (!ENV.ENABLE_WHATSAPP) {
    logger.info('WhatsApp Service is running in mock/offline mode (ENABLE_WHATSAPP=false).');
    return;
  }

  try {
    const sessionDir = path.resolve(ENV.WHATSAPP_SESSION_PATH);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Dynamic import of Baileys
    const baileysModule = await import('@whiskeysockets/baileys');
    const makeWASocket = baileysModule.default?.default || baileysModule.default || baileysModule.makeWASocket;
    const { useMultiFileAuthState, DisconnectReason } = baileysModule;

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['SchoolSphere', 'Desktop', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        qrCodeString = qr;
        logger.info('WhatsApp QR generated. Scan with phone WhatsApp to authenticate.');
      }

      if (connection === 'close') {
        isConnected = false;
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        logger.warn(`WhatsApp connection closed. Reason: ${lastDisconnect?.error?.message}. Reconnect: ${shouldReconnect}`);
        if (shouldReconnect) {
          setTimeout(initWhatsApp, 5000);
        }
      } else if (connection === 'open') {
        isConnected = true;
        qrCodeString = null;
        logger.info('WhatsApp connected successfully via Baileys!');
      }
    });
  } catch (err) {
    logger.error('Failed to initialize Baileys WhatsApp client', err);
    isConnected = false;
  }
};

export const sendWhatsAppMessage = async (phone, message) => {
  try {
    if (!phone) return { success: false, message: 'No phone number provided' };

    if (!ENV.ENABLE_WHATSAPP || !isConnected || !sock) {
      logger.info(`[MOCK WHATSAPP DISPATCH] To: ${phone} | Msg: ${message.slice(0, 60)}...`);
      return { success: true, mock: true, message: 'WhatsApp mock mode active' };
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const jid = `${cleanPhone}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text: message });
    logger.info(`WhatsApp message delivered to ${cleanPhone}`);
    return { success: true };
  } catch (err) {
    logger.error(`Error sending WhatsApp to ${phone}`, err);
    return { success: false, error: err.message };
  }
};

export const sendWhatsAppAttendanceNotification = async (phone, { studentName, date, status, classGrade }) => {
  const msg = `*SchoolSphere Official Alert*\n\nDear Parent/Guardian,\nYour child *${studentName}* (Class: ${classGrade}) has been marked *${status.toUpperCase()}* on ${new Date(date).toLocaleDateString()}.\n\nIf unexpected, please contact the school administration.`;
  return sendWhatsAppMessage(phone, msg);
};

export const sendWhatsAppFeeReminder = async (phone, { studentName, remainingAmount, dueDate }) => {
  const msg = `*SchoolSphere Fee Notice*\n\nDear Parent/Guardian,\nA fee reminder for *${studentName}*:\nOutstanding balance: *$${remainingAmount}*\nDue date: *${new Date(dueDate).toLocaleDateString()}*\n\nPlease log into the SchoolSphere portal to review receipts and settle your account.`;
  return sendWhatsAppMessage(phone, msg);
};

export const sendWhatsAppNotice = async (phone, { title, description }) => {
  const msg = `*SchoolSphere Bulletin*\n\n*${title}*\n\n${description || ''}\n\nCheck the SchoolSphere portal for full details.`;
  return sendWhatsAppMessage(phone, msg);
};

export const getWhatsAppStatus = () => {
  return {
    enabled: ENV.ENABLE_WHATSAPP,
    connected: isConnected,
    qr: qrCodeString
  };
};
