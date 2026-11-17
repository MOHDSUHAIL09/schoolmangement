import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api.js';
import { DataTable } from '../components/DataTable.jsx';
import { UserCheck, Phone, Mail, Award } from 'lucide-react';

export const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getTeachers();
      if (res.success) {
        setTeachers(res.data || []);
      }
    } catch (err) {
      console.warn('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Faculty Member',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={
              row.profileImage ||
              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
            }
            alt={row.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="font-bold text-slate-900">{row.name}</div>
            <div className="text-xs text-slate-500 font-medium">Faculty Teacher</div>
          </div>
        </div>
      )
    },
    {
      header: 'Email Address',
      accessor: 'email',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.email}</span>
        </div>
      )
    },
    {
      header: 'Contact Phone',
      accessor: 'phone',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Phone className="w-3.5 h-3.5 text-slate-500" />
          <span>{row.phone || '+1 (555) 200-0000'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      render: () => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
          Active Faculty
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <UserCheck className="w-7 h-7 text-slate-900" />
          <span>Teaching Faculty & Instructors</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Academic educators, department mentors, and pedagogical specialists.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        searchPlaceholder="Search teacher by name or email..."
        exportFileName="Faculty_Roster"
      />
    </div>
  );
};
