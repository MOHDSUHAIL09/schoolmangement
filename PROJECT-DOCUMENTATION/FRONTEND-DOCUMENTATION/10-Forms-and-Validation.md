# 10 - Frontend Forms and Validation Architecture

This document describes the input validation rules, cybersecurity sanitizers, and form submission flows implemented across the SchoolSphere frontend.

---

## 1. Client-Side Defensive Architecture

To prevent Cross-Site Scripting (XSS), SQL/NoSQL Injection, and parameter tampering at the user input layer, the frontend implements three layers of defense:

```mermaid
flowchart LR
    A[Keystroke Event] -->|onKeyDown| B[blockInjectionKeys]
    B -->|Forbidden Key: < > ; ' " ` \ $| C[preventDefault: Keystroke Discarded]
    B -->|Safe Key| D[Input Updates]
    D -->|onChange| E[sanitizeInputText]
    E -->|Strips scripts & symbols| F[React State]
    F -->|onSubmit| G[HTML5 Regex Pattern Validation]
    G -->|Valid| H[Axios Network Request]
```

---

## 2. Security Patterns & Sanitizers (`src/utils/securityPatterns.js`)

### A. Pre-Emptive Keystroke Blocker (`blockInjectionKeys`)
Prevents users from typing injection characters into critical input fields:
- **Blocked Characters**: `<` (less-than), `>` (greater-than), `;` (semicolon), `'` (single quote), `"` (double quote), `` ` `` (backtick), `\` (backslash), `$` (dollar sign).
- **Mechanism**: Calls `e.preventDefault()` on `keydown`, stopping the symbol before it reaches the DOM value or state.

### B. Input Sanitizer (`sanitizeInputText`)
Real-time string sanitization invoked inside `onChange`:
```javascript
export const sanitizeInputText = (text) => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/script/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/[<>$`\'"\\;\0]/g, '');
};
```

### C. Standardized Regex Pattern Library (`SECURITY_PATTERNS`)

| Field Type | Regex Pattern | Purpose |
| :--- | :--- | :--- |
| **Email** | `[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}` | Enforces valid standard email syntax. |
| **Password** | `^[^<>`\'"\\;]{6,64}$` | Min 6 characters, max 64 characters, zero injection characters. |
| **Strong Password** | `(?=.*[A-Za-z])(?=.*\d).{6,}` | Requires letters and numbers. |
| **Name** | `^[a-zA-Z0-9\s.,'\-]{2,80}$` | Proper human name format (2–80 characters). |
| **Phone** | `^[+]?[0-9\s\-()]{7,20}$` | E.164 and international phone numbers (7–20 digits). |
| **Search** | `^[^<>$]{1,100}$` | Strips script brackets and mongo dollar operators. |
| **Currency Amount** | `^\d+(\.\d{1,2})?$` | Positive float with up to 2 decimal places. |
| **ID Code** | `^[a-zA-Z0-9\-_]{1,30}$` | Roll numbers, admission numbers, registration IDs. |
| **Positive Integer**| `^[1-9]\d*$` | Counts, page limits, question numbers. |

---

## 3. Major Application Forms

### 1. Login Form (`Login.jsx`)
- **Fields**: Email/Username, Password, Remember Me checkbox.
- **Validation**: Strict HTML5 email pattern, password length check, anti-script keyblocker.
- **Handling**: Disables button, sets spinner, calls `login(email, password)`. Displays alert banner on rejection.

### 2. Student Enrollment Modal (`Students.jsx`)
- **Fields**: First Name, Last Name, Roll Number, Admission Number, Class Grade, Section, Date of Birth, Gender, Parent Linkage, Transport Route.
- **Validation**: Required fields verified before submission; duplicate roll numbers rejected by backend.

### 3. Fee Payment Recording Form (`Fees.jsx`)
- **Fields**: Payment Amount, Payment Method (`Cash`, `Credit Card`, `Bank Transfer`, `UPI`, `Cheque`), Transaction ID/Reference, Remarks.
- **Validation**: Amount must be positive and not exceed total balance; auto-updates remaining amount.

### 4. Homework Assignment Form (`Homework.jsx`)
- **Fields**: Title, Class Grade, Section, Subject, Due Date, Description, File Attachments.
- **Validation**: Due date must be valid future timestamp; class and subject are mandatory.

### 5. AI Exam Generator Form (`AIExamGenerator.jsx`)
- **Fields**: Class/Grade, Subject, Topic, Difficulty (`Easy`, `Medium`, `Hard`), Number of Questions (`1` to `30`).
- **Validation**: Bounds checking on question count (enforced 1–30).
