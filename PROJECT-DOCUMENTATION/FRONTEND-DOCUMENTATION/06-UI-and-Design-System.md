# 06 - UI and Design System Architecture

This document details the visual design standards, color palette, typography, glassmorphism overlays, and Tailwind CSS configuration utilized across the SchoolSphere interface.

---

## 1. Visual Theme Identity

The interface adheres to an **Institutional Academic Tech** aesthetic. It balances clinical clarity, high contrast, clean typography, and subtle cyan/teal/emerald accents to create a modern and trustworthy educational dashboard.

---

## 2. Color Palette & Utility Classes

The primary branding color scheme is built upon **Cyan**, **Teal**, **Slate**, and **White**, with specialized semantic accents:

### A. Primary Institutional Brand Colors
- **Cyan / Aqua Primary**:
  - `bg-cyan-500` / `hover:bg-cyan-400` (#06b6d4)
  - `bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400`
  - Subtle background tints: `bg-[#e0f7fa]`, `bg-cyan-50/70`, `bg-[#f0fdfa]`
  - Borders: `border-cyan-200`, `border-cyan-300/80`
- **Teal Secondary**:
  - `text-teal-700`, `bg-teal-50`, `border-teal-300`

### B. Functional & Status Semantic Colors
| Semantic Meaning | Background | Text | Border | Applied To |
| :--- | :--- | :--- | :--- | :--- |
| **Success / Present / Paid** | `bg-emerald-50` | `text-emerald-800` | `border-emerald-300` | Present attendance, Paid fees, Verified session |
| **Warning / Partial / Late** | `bg-amber-50` | `text-amber-800` | `border-amber-300` | Late attendance, Partial fee payment, Draft exams |
| **Danger / Absent / Overdue** | `bg-rose-50` | `text-rose-800` | `border-rose-300` | Absent attendance, Overdue balances, Delete actions |
| **Informational / Published** | `bg-sky-50` | `text-sky-800` | `border-sky-300` | Published circulars, Ongoing exam schedules |

### C. Neutral & Surface Architecture
- **Page Background**: `bg-[#F7F8FA]` (Canvas Neutral), `bg-[#f8fafc]` (Landing Neutral)
- **Cards & Surfaces**: `bg-white/95 backdrop-blur-xl`, `border border-slate-200/80`
- **Primary Typography**: `text-slate-950` / `text-slate-900`
- **Secondary Typography**: `text-slate-600` / `text-slate-500`

---

## 3. Typography Standards

The system uses modern sans-serif typography natively bundled in CSS (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `Roboto`, `Helvetica`, `Arial`, `sans-serif`):

- **Hero Headings**: `text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08]`
- **Section Headings**: `text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950`
- **Card Titles & Headers**: `text-base sm:text-lg font-bold text-slate-900`
- **Body Text**: `text-sm text-slate-600 font-normal leading-relaxed`
- **Metadata & Badges**: `text-[10px]` or `text-[11px] font-black uppercase tracking-wider`

---

## 4. Glassmorphism & Elevation Layering

- **Header / Navigation Bar**: `sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 shadow-xs`
- **Modals & Flyouts**: `fixed inset-0 z-50 bg-black/50 backdrop-blur-sm`
- **Cards**: `rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-900/15 border-2 border-cyan-300/80 bg-white/95`

---

## 5. Responsive Breakpoint Rules

Tailwind CSS standard responsive breakpoints are strictly respected:
- `sm`: `640px` — Mobile cards convert to horizontal flex rows.
- `md`: `768px` — Table action drawers and search bars display side-by-side.
- `lg`: `1024px` — Sidebar switches from sliding off-canvas drawer to persistent vertical column; Hero grid transforms from 1-column stack to multi-column layout.
- `xl`: `1280px` — Maximum grid container (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`).
