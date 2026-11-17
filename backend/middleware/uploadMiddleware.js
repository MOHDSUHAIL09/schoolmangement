import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.txt', '.xlsx', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();

  // Block dangerous executable, script, and stored-XSS extensions strictly
  const blockedExtensions = [
    '.exe', '.bat', '.sh', '.js', '.vbs', '.msi', '.cmd', '.php', '.phtml',
    '.py', '.cgi', '.pl', '.jsp', '.asp', '.aspx', '.jar', '.html', '.htm',
    '.svg', '.xml', '.shtml', '.xhtml', '.hta'
  ];

  if (blockedExtensions.includes(ext)) {
    return cb(new Error(`Security Alert: Uploading '${ext}' files is strictly prohibited due to institutional cybersecurity policy.`), false);
  }

  // Sanitized MIME-type validation
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];

  if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error(`Security Alert: File type '${ext}' or MIME type '${file.mimetype}' is not permitted. Only verified images and academic documents are accepted.`), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter
});
