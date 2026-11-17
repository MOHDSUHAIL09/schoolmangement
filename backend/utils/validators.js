export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePhone = (phone) => {
  if (!phone) return true; // optional
  const re = /^[+0-9\s\-()]{7,20}$/;
  return re.test(String(phone));
};

export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim();
};

export const validatePasswordStrength = (pwd) => {
  if (!pwd || typeof pwd !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }
  if (pwd.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long.' };
  }
  const commonWeak = ['123456', 'password', '12345678', 'admin123', 'qwerty', '123456789', 'password123'];
  if (commonWeak.includes(pwd.toLowerCase())) {
    return {
      valid: false,
      message: 'Password is too common and easily compromised in penetration testing. Please use a stronger password.'
    };
  }
  return { valid: true };
};
