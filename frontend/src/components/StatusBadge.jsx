import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const styles = {
    // Attendance & General
    Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Absent: 'bg-red-50 text-red-700 border-red-200',
    Late: 'bg-amber-50 text-amber-700 border-amber-200',
    Leave: 'bg-cyan-50 text-cyan-700 border-cyan-200',

    // Fees
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Partial: 'bg-amber-50 text-amber-800 border-amber-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Overdue: 'bg-red-50 text-red-700 border-red-200',

    // Homework & Exams
    Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    Reviewed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Ongoing: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-slate-100 text-slate-700 border-slate-200',
    Passed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Failed: 'bg-red-50 text-red-700 border-red-200'
  };

  const style = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status}
    </span>
  );
};
