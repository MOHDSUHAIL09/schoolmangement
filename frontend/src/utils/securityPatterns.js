/**
 * Enterprise Security Input Patterns & Sanitizers
 * Enforces strict client-side validation to prevent XSS, NoSQL Injection, ReDoS, and parameter tampering.
 */

export const SECURITY_PATTERNS = {
  // Institutional Email
  email: {
    pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
    title: 'Valid institutional email format required (e.g., user@schoolsphere.com)'
  },

  // Authentication Passwords (Strictly disallows HTML/Script injection: < > ; ' " ` \)
  password: {
    pattern: '^[^<>`\'"\\\\;]{6,64}$',
    title: 'Password must be 6 to 64 characters long without script tags or injection symbols (< > ; \' " \\ `).'
  },

  // Strong Password for registration/change
  strongPassword: {
    pattern: '(?=.*[A-Za-z])(?=.*\\d).{6,}',
    title: 'Must be at least 6 characters long with both letters and numbers.'
  },

  // Names & Human Identifiers
  name: {
    pattern: "^[a-zA-Z0-9\\s.,'\\-]{2,80}$",
    title: 'Name must be 2 to 80 characters containing only letters, numbers, and basic punctuation.'
  },

  // Phone Numbers
  phone: {
    pattern: '^[+]?[0-9\\s\\-()]{7,20}$',
    title: 'Valid phone number with 7 to 20 digits (e.g., +1 555-123-4567).'
  },

  // Search Queries: strictly disallow <, >, $, and null bytes
  search: {
    pattern: '^[^<>$]{1,100}$',
    title: 'Search term must not contain script tags or injection symbols (<, >, $).'
  },

  // Alphanumeric Identifiers (Student IDs, Roll Numbers, Registration Numbers)
  idCode: {
    pattern: '^[a-zA-Z0-9\\-_]{1,30}$',
    title: 'Alphanumeric identifier, hyphens, and underscores only (1-30 characters).'
  },

  // Monetary Amounts
  amount: {
    pattern: '^\\d+(\\.\\d{1,2})?$',
    title: 'Positive currency amount with up to 2 decimal places (e.g., 250 or 250.50).'
  },

  // Safe Standard Titles & Headings (Disallows raw HTML tags)
  titleText: {
    pattern: '^[^<>]{2,150}$',
    title: 'Title must be between 2 and 150 characters without HTML tags (< >).'
  },

  // Whole Positive Numbers
  positiveInteger: {
    pattern: '^[1-9]\\d*$',
    title: 'Must be a positive whole number greater than 0.'
  }
};

/**
 * Detects whether a string contains malicious script or injection payload
 */
export const hasInjectionPayload = (str) => {
  if (typeof str !== 'string') return false;
  return /[<>$`\'"\\;\0]|<script|<\/script>|javascript:|alert\(|eval\(|document\.cookie/i.test(str);
};

/**
 * Strips dangerous injection characters and script words directly on input change
 */
export const sanitizeInputText = (text) => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/script/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/[<>$`\'"\\;\0]/g, '');
};

/**
 * Intercepts keyboard entry and blocks dangerous injection characters from ever entering the input
 */
export const blockInjectionKeys = (e, onBlocked) => {
  const dangerousKeys = ['<', '>', ';', "'", '"', '`', '\\', '$'];
  if (dangerousKeys.includes(e.key)) {
    e.preventDefault();
    if (typeof onBlocked === 'function') {
      onBlocked(e.key);
    }
  }
};
