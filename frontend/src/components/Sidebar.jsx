import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { getRoleLabel, getRoleBadgeClass } from '../utils/formatters.js';
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
          roles: ['super_admin', 'admin', 'principal', 'teacher', 'parent', 'student']
        },
        {
          to: '/directory',
          label: 'School Directory',
          icon: GraduationCap,
          roles: ['super_admin', 'admin', 'principal', 'teacher', 'parent', 'student']
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
          roles: ['super_admin', 'admin', 'principal', 'teacher']
        },
        {
          to: '/teachers',
          label: 'Teachers',
          icon: UserCheck,
          roles: ['super_admin', 'admin', 'principal']
        },
        {
          to: '/parents',
          label: 'Parents',
          icon: Users,
          roles: ['super_admin', 'admin', 'principal']
        },
        {
          to: '/attendance',
          label: role === 'student' ? 'My Attendance' : role === 'parent' ? 'Child Attendance' : 'Student Attendance',
          icon: CalendarCheck,
          roles: ['super_admin', 'admin', 'principal', 'teacher', 'parent', 'student']
        },
        {
          to: '/teacher-attendance',
          label: 'Teacher Attendance',
          icon: UserCheck,
          roles: ['super_admin']
        },
        {
          to: '/homework',
          label: 'Homework',
          icon: BookOpen,
          roles: ['super_admin', 'admin', 'principal', 'teacher', 'parent', 'student']
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
          roles: ['super_admin', 'admin', 'principal', 'teacher', 'parent', 'student']
        },
        {
          to: '/ai-exam-generator',
          label: 'AI Exam Generator',
          icon: Sparkles,
          roles: ['super_admin', 'admin', 'principal', 'teacher'],
          badge: 'Gemini AI'
        }
      ]
    },
    {
      heading: 'OPERATIONS & FINANCE',
      items: [
        {
          to: '/fees',
          label: role === 'student' ? 'My Fees & Payments' : role === 'parent' ? 'Child Fees & Payments' : 'Fees & Invoices',
          icon: CreditCard,
          roles: ['super_admin', 'admin', 'principal', 'parent', 'student']
        },
        {
          to: '/transport',
          label: 'Transport',
          icon: Bus,
          roles: ['super_admin', 'admin', 'principal', 'parent', 'student']
        },
        {
          to: '/payroll',
          label: 'Teacher Fees & Payroll',
          icon: BadgeDollarSign,
          roles: ['super_admin', 'admin', 'principal']
        }
      ]
    },
    {
      heading: 'COMMUNICATIONS & AUDIT',
      items: [
        {
          to: '/chat',
          label: 'Chat Room',
          icon: MessageSquare,
          roles: ['super_admin', 'admin', 'principal', 'teacher', 'parent', 'student']
        },
        {
          to: '/communications',
          label: 'Email & WhatsApp',
          icon: Send,
          roles: ['super_admin', 'admin', 'principal', 'teacher'],
          badge: 'Services'
        },
        {
          to: '/notices',
          label: 'Notices & Events',
          icon: Bell,
          roles: ['super_admin', 'admin', 'principal', 'teacher', 'parent', 'student']
        },
        {
          to: '/reports',
          label: 'Reports',
          icon: BarChart3,
          roles: ['super_admin', 'admin', 'principal']
        },
        {
          to: '/settings',
          label: 'Settings',
          icon: Settings,
          roles: ['super_admin', 'admin', 'principal']
        }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#FEEAE1] text-slate-700 select-none shadow-[0_0_15px_rgba(255,94,58,0.03)]">
      {/* Brand Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4 sm:px-5'} h-[76px] border-b border-[#FEEAE1] bg-white shrink-0`}>
        <Link to="/" className="flex items-center gap-3 overflow-hidden group min-w-0" title="Visit Public Landing Page">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5E3A] flex items-center justify-center text-white shadow-sm shadow-[#FF5E3A]/25 shrink-0 group-hover:scale-105 transition-transform duration-200">
            <Shield className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-bold text-slate-900 tracking-tight truncate leading-tight group-hover:text-[#FF5E3A] transition-colors">
                {settings?.schoolName || 'SchoolSphere Inter...'}
              </span>
              <span className="text-[11px] font-bold text-[#FF5E3A] tracking-wider uppercase mt-0.5">
                ACADEMY PORTAL
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle (desktop only) */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 items-center justify-center transition border border-transparent hover:border-slate-200 shrink-0 ml-1"
            title="Collapse Navigation"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav sections & items */}
      <div className="flex-1 py-4 px-3 sm:px-3.5 overflow-y-auto space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {navSections.map((sec, secIdx) => {
          const visibleItems = sec.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={secIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
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
                      `group flex items-center ${
                        isCollapsed ? 'justify-center px-2 py-3' : 'gap-3.5 px-3.5 py-2.5'
                      } rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-[#FF5E3A] text-white font-bold shadow-sm shadow-[#FF5E3A]/25'
                          : 'text-[#334155] hover:text-[#FF5E3A] hover:bg-[#FFF0EB]'
                      }`
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                            isActive
                              ? 'text-white stroke-[2.2]'
                              : 'text-[#64748b] group-hover:text-[#FF5E3A] stroke-[1.8]'
                          }`}
                        />
                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between truncate">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
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
      {isCollapsed ? (
        <div
          className="p-3 border-t border-[#FEEAE1] bg-white flex justify-center cursor-pointer"
          onClick={() => setIsCollapsed(false)}
          title={`${user?.name || 'Dr. Evelyn Sterling'} (${getRoleLabel(role)}) - Click to expand`}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#FEEAE1] shadow-sm shrink-0">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#FF5E3A] to-[#E84E2A] text-white flex items-center justify-center font-bold text-xs">
                {user?.name?.[0]?.toUpperCase() || 'E'}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3.5 px-4 border-t border-[#FEEAE1] bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-[#FEEAE1] shrink-0 shadow-xs">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#FF5E3A] to-[#E84E2A] text-white flex items-center justify-center font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase() || 'E'}
                </div>
              )}
            </div>
            <div className="truncate min-w-0">
              <div className="text-[13.5px] font-bold text-slate-900 truncate leading-snug">
                {user?.name || 'Dr. Evelyn Sterling'}
              </div>
              <div className="mt-0.5">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-block ${
                    role === 'super_admin'
                      ? 'bg-[#f3e8ff] text-[#7e22ce] border-purple-200/60'
                      : getRoleBadgeClass(role)
                  }`}
                >
                  {getRoleLabel(role)}
                </span>
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
        <div
          className="fixed top-0 bottom-0 z-30 h-full transition-all duration-300 bg-white"
          style={{ width: isCollapsed ? '5rem' : '16rem' }}
        >
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 h-full z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
