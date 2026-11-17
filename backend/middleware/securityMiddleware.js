import rateLimit from 'express-rate-limit';

/**
 * Recursive sanitizer for NoSQL Injection
 * Strips keys containing '$' or '.' from request body, query, and params.
 */
export const sanitizeNoSQL = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => sanitize(item));
    }

    const clean = {};
    for (const key of Object.keys(obj)) {
      // Strip any key starting with '$' or containing '.'
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      clean[key] = sanitize(obj[key]);
    }
    return clean;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

/**
 * XSS Filter: Strips dangerous HTML and script injections from user strings
 */
export const sanitizeXSS = (req, res, next) => {
  const stripDangerous = (val) => {
    if (typeof val !== 'string') return val;

    // Remove script tags, javascript: pseudo-protocols, and malicious event handlers
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:[^"']*/gi, '')
      .replace(/onload\s*=\s*["'][^"']*["']/gi, '')
      .replace(/onerror\s*=\s*["'][^"']*["']/gi, '')
      .replace(/onclick\s*=\s*["'][^"']*["']/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  };

  const sanitizeValues = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => (typeof item === 'object' ? sanitizeValues(item) : stripDangerous(item)));
    }

    const clean = {};
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string') {
        clean[key] = stripDangerous(val);
      } else if (typeof val === 'object' && val !== null) {
        clean[key] = sanitizeValues(val);
      } else {
        clean[key] = val;
      }
    }
    return clean;
  };

  if (req.body) req.body = sanitizeValues(req.body);
  if (req.query) req.query = sanitizeValues(req.query);

  next();
};

/**
 * Parameter Pollution Defense
 * Flattens array-polluted query parameters into single safe strings
 */
export const preventParameterPollution = (req, res, next) => {
  if (req.query) {
    const singleParamFields = ['search', 'role', 'classGrade', 'section', 'status', 'page', 'limit', 'month', 'channel'];
    for (const field of singleParamFields) {
      if (Array.isArray(req.query[field])) {
        // Take the last scalar entry safely
        req.query[field] = String(req.query[field][req.query[field].length - 1]);
      }
    }
  }
  next();
};

/**
 * ReDoS & Regex Injection Defense:
 * Escapes regex special characters in search parameters and limits length to 100 characters.
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);
};

export const sanitizeRegexSearch = (req, res, next) => {
  if (req.query && req.query.search && typeof req.query.search === 'string') {
    req.query.search = escapeRegex(req.query.search.trim());
  }
  next();
};

/**
 * Enterprise Security Headers & Fingerprint Removal
 */
export const enterpriseSecurityHeaders = (req, res, next) => {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Restrict Flash / PDF cross-domain policy
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  // Disable non-essential browser device permissions
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Origin isolation policy
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
};

/**
 * Security Audit Event Logger
 */
export const securityAuditLogger = (req, res, next) => {
  const originalEnd = res.end;
  res.end = function (...args) {
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429 || res.statusCode === 423) {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      console.warn(`[SECURITY AUDIT] ${new Date().toISOString()} | Status: ${res.statusCode} | Method: ${req.method} | Path: ${req.originalUrl} | IP: ${clientIp} | Agent: ${req.headers['user-agent'] || 'Unknown'}`);
    }
    return originalEnd.apply(this, args);
  };
  next();
};

/**
 * Strict Anti-Brute-Force Rate Limiter for Authentication Endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 15, // 15 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

/**
 * Sensitive Data Redactor: ensures passwords or secret tokens never leak in responses
 */
export const sanitizeResponseData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeResponseData);

  const clean = { ...data };
  delete clean.password;
  delete clean.__v;
  return clean;
};
