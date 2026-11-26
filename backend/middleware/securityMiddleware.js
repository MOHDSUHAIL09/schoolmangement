
import rateLimit from 'express-rate-limit';

/**
 * Safe recursive NoSQL key sanitizer
 */
export const sanitizeNoSQL = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    const clean = Object.create(null);

    for (const [key, value] of Object.entries(obj)) {
      if (
        key.startsWith('$') ||
        key.includes('.') ||
        key === '__proto__' ||
        key === 'constructor' ||
        key === 'prototype'
      ) {
        continue;
      }

      clean[key] = sanitize(value);
    }

    return clean;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }

  // Express 5 req.query is read-only.
  // Use req.safeQuery in controllers instead.
  req.safeQuery = sanitize(req.query || {});

  next();
};

/**
 * Basic dangerous HTML input filtering.
 * This is NOT a replacement for output encoding.
 */
export const sanitizeXSS = (req, res, next) => {
  const stripDangerous = (value) => {
    if (typeof value !== 'string') return value;

    return value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/on(?:load|error|click|mouseover)\s*=/gi, '');
  };

  const sanitizeValues = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitizeValues);
    }

    const clean = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        clean[key] = stripDangerous(value);
      } else if (value && typeof value === 'object') {
        clean[key] = sanitizeValues(value);
      } else {
        clean[key] = value;
      }
    }

    return clean;
  };

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValues(req.body);
  }

  req.safeQuery = sanitizeValues(req.safeQuery || req.query || {});

  next();
};

/**
 * Parameter Pollution Defense
 */
export const preventParameterPollution = (req, res, next) => {
  const query = { ...(req.safeQuery || req.query || {}) };

  const singleParamFields = [
    'search',
    'role',
    'classGrade',
    'section',
    'status',
    'page',
    'limit',
    'month',
    'channel'
  ];

  for (const field of singleParamFields) {
    if (Array.isArray(query[field])) {
      const values = query[field].filter(
        value => typeof value === 'string' ||
                 typeof value === 'number'
      );

      query[field] = values.length
        ? String(values[values.length - 1])
        : '';
    }
  }

  req.safeQuery = query;
  next();
};

/**
 * Regex Injection Protection
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';

  return str
    .slice(0, 100)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const sanitizeRegexSearch = (req, res, next) => {
  const search = req.safeQuery?.search;

  if (typeof search === 'string') {
    req.safeQuery.searchRegex = escapeRegex(search.trim());
  }

  next();
};

/**
 * Security Headers
 */
export const enterpriseSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  next();
};

/**
 * Security Audit Logger
 */
export const securityAuditLogger = (req, res, next) => {
  res.on('finish', () => {
    if ([401, 403, 429, 423].includes(res.statusCode)) {
      console.warn(
        `[SECURITY AUDIT] ${new Date().toISOString()} | ` +
        `Status: ${res.statusCode} | ` +
        `Method: ${req.method} | ` +
        `Path: ${req.path} | ` +
        `IP: ${req.ip || 'Unknown'} | ` +
        `Agent: ${req.headers['user-agent'] || 'Unknown'}`
      );
    }
  });

  next();
};

/**
 * Authentication Anti-Brute-Force Rate Limiter
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Generous limit in development to allow seamless multi-role testing
  max: process.env.NODE_ENV === 'production' ? 100 : 2000,

  standardHeaders: true,
  legacyHeaders: false,

  skipSuccessfulRequests: true,

  message: {
    success: false,
    message:
      'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

/**
 * Sensitive Data Redactor
 */
export const sanitizeResponseData = (data) => {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeResponseData);
  }

  const clean = { ...data };

  delete clean.password;
  delete clean.__v;

  return clean;
};
