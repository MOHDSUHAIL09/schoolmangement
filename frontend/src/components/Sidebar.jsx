import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCheck,
  CalendarCheck,
  CreditCard,
  BookOpen,
  FileSpreadsheet,
  Sparkles,
  Bus,
  BadgeDollarSign,
  MessageSquare,
  Bell,
  Send,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, role } = useAuth();
  const { settings } = useSchool();

  const navSections = [
    {
      heading: 'DASHBOARD',
      items: [
        {
          to: '/dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          roles: ['super_admin', 'principal', 'teacher', 'parent', 'student']
        }
      ]
    },
    {
      heading: 'ACADEMICS & COMMUNITY',
      items: [
        {
          to: '/students',
          label: 'Students',
          icon: GraduationCap,
          roles: ['super_admin', 'principal', 'teacher']
        },
        {
          to: '/teachers',
          label: 'Teachers',
          icon: UserCheck,
          roles: ['super_admin', 'principal']
        },
        {
          to: '/parents',
          label: 'Parents',
          icon: Users,
          roles: ['super_admin', 'principal']
        },
        {
          to: '/attendance',
          label: 'Attendance',
          icon: CalendarCheck,
          roles: ['super_admin', 'principal', 'teacher', 'parent', 'student']
        },
        {
          to: '/homework',
          label: 'Homework',
          icon: BookOpen,
          roles: ['super_admin', 'principal', 'teacher', 'parent', 'student']
        }
      ]
    },
    {
      heading: 'EXAMINATIONS & AI',
      items: [
        {
          to: '/exams',
          label: 'Exams',
          icon: FileSpreadsheet,
          roles: ['super_admin', 'principal', 'teacher', 'parent', 'student']
        },
        {
          to: '/ai-exam-generator',
          label: 'AI Exam Generator',
          icon: Sparkles,
          roles: ['super_admin', 'principal', 'teacher'],
          badge: 'Gemini AI'
        }
      ]
    },
    {
      heading: 'OPERATIONS & FINANCE',
      items: [
        {
          to: '/fees',
          label: 'Fees & Invoices',
          icon: CreditCard,
          roles: ['super_admin', 'principal', 'parent']
        },
        {
          to: '/transport',
          label: 'Transport',
          icon: Bus,
          roles: ['super_admin', 'principal', 'parent', 'student']
        },
        {
          to: '/payroll',
          label: 'Payroll',
          icon: BadgeDollarSign,
          roles: ['super_admin', 'principal']
        }
      ]
    },
    {
      heading: 'COMMUNICATIONS & AUDIT',
      items: [
        {
          to: '/chat',
          label: 'Chat',
          icon: MessageSquare,
          roles: ['super_admin', 'principal', 'teacher', 'parent', 'student']
        },
        {
          to: '/communications',
          label: 'Email & WhatsApp',
          icon: Send,
          roles: ['super_admin', 'principal', 'teacher'],
          badge: 'Services'
        },
        {
          to: '/notices',
          label: 'Notices & Events',
          icon: Bell,
          roles: ['super_admin', 'principal', 'teacher', 'parent', 'student']
        },
        {
          to: '/reports',
          label: 'Reports',
          icon: BarChart3,
          roles: ['super_admin', 'principal']
        },
        {
          to: '/settings',
          label: 'Settings',
          icon: Settings,
          roles: ['super_admin', 'principal']
        }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 text-gray-700 select-none shadow-sm">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-20 border-b border-gray-200 bg-white">
        <Link to="/" className="flex items-center gap-3 overflow-hidden group" title="Visit Public Landing Page">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-cyan-500/30 shrink-0 group-hover:scale-105 transition">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-base font-extrabold text-slate-900 tracking-tight truncate group-hover:text-cyan-800 transition">
                {settings.schoolName || 'SchoolSphere'}
              </span>
              <span className="text-[11px] font-semibold text-cyan-700 tracking-wider uppercase">
                Academy Portal
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 items-center justify-center transition border border-gray-200"
          title={isCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav sections & items */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
        {navSections.map((sec, secIdx) => {
          const visibleItems = sec.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={secIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {sec.heading}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm shadow-cyan-600/25'
                          : 'text-gray-600 hover:text-cyan-900 hover:bg-cyan-50/70'
                      }`
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between truncate">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isActive ? 'bg-gray-800 text-gray-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Logged in User Profile Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50/75">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm overflow-hidden">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Authorized User'}</div>
              <div className="text-[11px] text-gray-500 font-medium capitalize truncate">
                {role?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="fixed top-0 bottom-0 z-30 h-full transition-all duration-300" style={{ width: isCollapsed ? '5rem' : '16rem' }}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 h-full z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
