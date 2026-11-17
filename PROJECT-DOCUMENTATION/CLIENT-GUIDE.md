# SchoolSphere — Client & Institutional Executive Guide

## 1. Project Purpose

**SchoolSphere** is an enterprise-grade digital campus management platform designed to automate, streamline, and secure all academic, administrative, financial, and logistical operations for modern schools, academies, and collegiate institutions.

The platform eliminates fragmented paperwork, manual spreadsheets, and disparate communication tools by consolidating daily school administration into a unified, high-security cloud portal.

---

## 2. Main Features at a Glance

| Module | Operational Capability | Realized Institutional Benefit |
| :--- | :--- | :--- |
| **Student Information System (SIS)** | Digital admissions, demographic profiles, and grade/section organization. | 100% paperless student records with instant search. |
| **Faculty & Staff Directory** | Teacher records, departmental allocations, and contact registry. | Streamlined human resource visibility. |
| **Parent Portal & Multi-Child Linking** | Single-login dashboard for parents with multiple children enrolled in different grades. | Eliminates parent frustration; seamless sibling tracking. |
| **Daily Attendance Engine** | One-tap classroom roll-call with automated absentee alert triggers. | Instant attendance metrics and automated guardian alerts. |
| **Fee Management & Invoicing** | Automated tuition, transport, and exam billing with printable receipts. | Transparent collection audit with instant receipt generation. |
| **AI Exam Studio (Google Gemini)** | Curriculum-aligned multiple choice question generation with answer keys. | Cuts teacher exam preparation time from hours to minutes. |
| **Digital Homework Workspace** | Paperless assignment distribution, file attachments, and teacher grading. | Eliminates lost paper homework; tracks student deadlines. |
| **Transit & Fleet Tracking** | Bus and van route rosters, pickup schedules, and driver contact directory. | Enhanced student transit safety and parental peace of mind. |
| **Staff Payroll System** | Salary breakdown with allowances, deductions, and payment status tracking. | Accurate, verifiable institutional payroll records. |
| **Multi-Channel Broadcast** | Automated and manual parent communication via Email and WhatsApp Web. | Guaranteed notice delivery directly to parent smartphones. |
| **Campus Bulletin Board** | Digital circulars, academic calendar dates, holidays, and event galleries. | Campus-wide alignment for students, parents, and staff. |

---

## 3. User Roles & Access Privileges

SchoolSphere implements five dedicated user roles to safeguard institutional privacy:

1. **Super Admin**: The school owner, executive director, or chief IT administrator. Possesses total operational authority, including system settings, financial ledgers, staff payroll, user management, and audit reports.
2. **Principal**: The academic dean or headmaster. Oversees faculty, student enrollment, curriculum standards, grade approvals, and operational reports.
3. **Teacher**: Academic faculty members. Marks daily classroom attendance, creates and grades homework, authors examinations, and communicates with parents.
4. **Parent**: Guardians and parents. Can toggle between multiple enrolled children to inspect attendance records, review and download tuition receipts, view homework assignments, and message teachers.
5. **Student**: Enrolled scholars. Accesses their daily timetable, pending homework assignments, exam schedules, and academic report cards.

---

## 4. Frontend & Backend Overview (Non-Technical Summary)

- **The Frontend (User Interface)**: This is the visual website and application you interact with in your web browser. Built using modern web technologies (React), it is lightning-fast, mobile-responsive, and works seamlessly on desktop computers, tablets, and mobile phones.
- **The Backend (Application Server)**: This is the secure digital engine operating quietly behind the scenes. It validates user logins, processes financial transactions, communicates with Google's artificial intelligence, dispatches automated emails, and ensures that sensitive student information remains encrypted.
- **The Database**: A secure, industrial-strength digital filing cabinet (MongoDB) that stores student demographics, attendance history, financial ledgers, and academic results with instant retrieval.

---

## 5. Login & Access Security Overview

- **Secure Login**: Access requires an institutional email and password verified against the secure database.
- **Anti-Hacking & Lockout Defense**: If an unauthorized party attempts to guess a password 5 consecutive times, the system automatically locks the account for 15 minutes to thwart brute-force intrusion attempts.
- **Injection & Script Defense**: The login form actively blocks malicious injection characters (`<`, `>`, `;`, `'`, `"`, `$`) directly on keypress, protecting the school from cyber attacks.
- **Password Privacy**: Passwords are encrypted using irreversible cryptographic hashing (`bcrypt`). Even system administrators cannot view cleartext user passwords.

---

## 6. Primary Daily Workflows

### Workflow 1: Morning Roll-Call Attendance
1. The teacher logs into SchoolSphere on their laptop or tablet.
2. The teacher navigates to **Attendance**, selects their assigned Grade and Section, and clicks **Load Roster**.
3. All students default to *Present*. The teacher taps *Absent* or *Late* for any missing students and clicks **Submit Attendance**.
4. The system logs the records and automatically prepares attendance alerts for parents.

### Workflow 2: Fee Payment & Receipt Issuance
1. A parent arrives at the accounts office or reviews their balance in the parent portal.
2. The accounts administrator opens **Fees**, searches the student's name, and selects **Record Payment**.
3. The administrator enters the collected amount and selects the payment method (*Cash*, *Credit Card*, *Bank Transfer*, *UPI*, or *Cheque*).
4. The remaining balance automatically updates to `$0.00` (*Paid*), and a high-resolution, institutional fee receipt is printed or downloaded as a PDF.

### Workflow 3: AI-Powered Exam Generation
1. A science teacher opens **AI Exam Generator**.
2. The teacher specifies: Grade 10, Subject: Chemistry, Topic: Chemical Bonding, Difficulty: Medium, Quantity: 10 Questions.
3. The teacher clicks **Generate Examination**.
4. Within seconds, Google Gemini AI generates 10 curriculum-aligned questions complete with 4 options each, the verified correct answer, and pedagogical explanations.
5. The teacher reviews the questions and clicks **Save & Publish Exam**.

---

## 7. What Can Be Customized by the School Directly (No Coding Required)

School administrators can modify the following elements directly via the **Settings** screen:
- **School Name**: The official title displayed on receipts, certificates, and headers.
- **School Motto**: The academic subtitle.
- **Official Address & Campus Locations**.
- **Contact Details**: Public telephone number and admissions email address.
- **Active Academic Session**: e.g. `2026–2027`.
- **Currency Symbol**: e.g. `$`, `€`, `£`, `₹`, `AED`.
- **School Logo URL**: Custom brand badge appearing on invoices and the navbar.

---

## 8. What Requires Developer Involvement

The following modifications require a software engineer:
- Adding a completely new academic module (e.g. Library Book Barcode Scanner or Hostel Bedding Manager).
- Connecting a custom external payment gateway (e.g. Stripe, PayPal, Razorpay).
- Modifying underlying database schema fields.
- Changing system-wide color palettes or font typography beyond standard options.

---

## 9. Deployment, Maintenance & Data Backup

- **Hosting**: The system can be hosted on standard cloud infrastructure (DigitalOcean, AWS, Google Cloud, Linode) or on on-premises institutional servers.
- **Daily Automated Backups**: It is strongly advised that the school IT team run automated daily database backups (`mongodump`). In the unlikely event of physical hardware failure, the entire school history can be restored in under 5 minutes.
- **Future Enhancements**: The platform has been engineered modularly, making it easy to incorporate future capabilities such as biometric thumbprint turnstiles, SMS gateway integrations, and native mobile apps (iOS & Android).
