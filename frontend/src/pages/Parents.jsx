import React, { useState, useEffect } from 'react';
import { userAPI, studentAPI } from '../services/api.js';
import { DataTable } from '../components/DataTable.jsx';
import { Users, Phone, Mail, GraduationCap } from 'lucide-react';

export const Parents = () => {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        userAPI.getParents(),
        studentAPI.getAll({ limit: 100 })
      ]);

      if (pRes.success) setParents(pRes.data || []);
      if (sRes.success) setStudents(sRes.data.students || []);
    } catch (err) {
      console.warn('Error fetching parents:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Parent Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm">
            {row.name?.[0] || 'P'}
          </div>
          <div>
            <div className="font-bold text-slate-900">{row.name}</div>
            <div className="text-xs text-slate-500">Guardian Account</div>
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
      header: 'Phone Number',
      accessor: 'phone',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Phone className="w-3.5 h-3.5 text-slate-500" />
          <span>{row.phone || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Associated Children',
      render: (row) => {
        // Find students where parentIds includes this parent
        const children = students.filter((s) =>
          s.parentIds?.some((p) => (p._id || p) === row._id)
        );

        return (
          <div className="flex flex-wrap gap-1.5">
            {children.length > 0 ? (
              children.map((child) => (
                <span
                  key={child._id}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  {child.name} ({child.classGrade})
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No children linked</span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Users className="w-7 h-7 text-slate-900" />
          <span>Guardians & Parents Registry</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Registered parent accounts with linked enrolled children and contact information.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={parents}
        searchPlaceholder="Search parent by name, phone, or email..."
        exportFileName="Parents_Directory"
      />
    </div>
  );
};
