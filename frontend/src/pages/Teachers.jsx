import React, { useState, useEffect } from 'react';
import { userAPI, teacherAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { Modal } from '../components/Modal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import {
  UserCheck,
  Phone,
  Mail,
  Plus,
  Eye,
  Trash2,
  Printer,
  ShieldCheck,
  UserPlus,
  Lock,
  Image as ImageIcon
} from 'lucide-react';

export const Teachers = () => {
  const { role } = useAuth();
  const { showToast } = useSchool();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'General Academics',
    designation: 'Teaching Faculty',
    qualification: 'B.Ed., Master of Education',
    salary: 4800,
    password: 'Teacher@123',
    profileImage: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await teacherAPI.getAll({ limit: 100 });
      if (res.success && res.data?.teachers) {
        setTeachers(res.data.teachers);
      } else {
        const uRes = await userAPI.getTeachers();
        if (uRes.success) setTeachers(uRes.data || []);
      }
    } catch (err) {
      console.warn('Error fetching teachers from teacher table:', err);
      try {
        const uRes = await userAPI.getTeachers();
        if (uRes.success) setTeachers(uRes.data || []);
      } catch (e) {
        showToast(err.message, 'error', 'Error Loading Teachers');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: 'General Academics',
      designation: 'Teaching Faculty',
      qualification: 'B.Ed., Master of Education',
      salary: 4800,
      password: 'Teacher@123',
      profileImage: ''
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Name and email are required.', 'error', 'Validation');
      return;
    }
    setSubmitting(true);
    try {
      const res = await teacherAPI.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        department: formData.department || 'General Academics',
        designation: formData.designation || 'Teaching Faculty',
        qualification: formData.qualification || 'B.Ed., Master of Education',
        salary: formData.salary ? Number(formData.salary) : 4800,
        password: formData.password || 'Teacher@123',
        profileImage: formData.profileImage.trim()
      });
      if (res.success) {
        showToast(`Teacher "${formData.name}" added to database!`, 'success', 'Faculty Onboarded');
        setIsAddModalOpen(false);
        fetchTeachers();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create teacher account in database.', 'error', 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      const res = await teacherAPI.delete(deleteConfirm.id);
      if (res.success) {
        showToast('Faculty member removed from database', 'success');
        setDeleteConfirm({ isOpen: false, id: null, name: '' });
        fetchTeachers();
      }
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error', 'Delete Failed');
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
            <div className="flex items-center gap-1.5 mt-0.5">
              {row.teacherId && (
                <span className="px-1.5 py-0.2 rounded bg-cyan-50 border border-cyan-200 text-[10px] font-mono font-bold text-cyan-800">
                  {row.teacherId}
                </span>
              )}
              <span className="text-xs text-slate-500 font-medium">{row.designation || 'Faculty Teacher'}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      sortable: true,
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200">
          {row.department || 'General Academics'}
        </span>
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
      accessor: 'status',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
          {row.status || 'Active Faculty'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedTeacher(row);
              setIsViewModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          {['super_admin', 'admin', 'principal'].includes(role) && (
            <button
              onClick={() => setDeleteConfirm({ isOpen: true, id: row._id, name: row.name })}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition cursor-pointer"
              title="Delete Teacher"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-slate-900" />
            <span>Teaching Faculty & Instructors</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Academic educators, department mentors, and pedagogical specialists.
          </p>
        </div>

        {['super_admin', 'admin', 'principal'].includes(role) && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs transition duration-150 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Teacher</span>
          </button>
        )}
      </div>

      {/* Faculty Data Table */}
      <DataTable
        columns={columns}
        data={teachers}
        searchPlaceholder="Search teacher by name or email..."
        exportFileName="Faculty_Roster"
      />

      {/* Add Teacher Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Onboard New Teacher to Database">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Robert Chen"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="teacher.chen@school.com"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 200-0010"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              >
                <option value="General Academics">General Academics</option>
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Arts & Physical Education">Arts & Physical Education</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Designation
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Senior Faculty / Department Head"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Qualification
              </label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="e.g. M.Sc. Physics, B.Ed."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Monthly Salary / Fee ($)
              </label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="4800"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Password *
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Teacher@123"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Profile Image URL (Optional)
            </label>
            <div className="relative">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={formData.profileImage}
                onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>The teacher will be registered in the dedicated Teacher database table and linked to user authentication.</span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Adding to Database...' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Teacher Modal */}
      {selectedTeacher && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Faculty Comprehensive Profile">
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
              <img
                src={
                  selectedTeacher.profileImage ||
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
                }
                alt={selectedTeacher.name}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{selectedTeacher.name}</h3>
                  {selectedTeacher.teacherId && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-mono font-bold border border-cyan-200">
                      {selectedTeacher.teacherId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {selectedTeacher.designation || 'Faculty Teacher'} &bull; {selectedTeacher.department || 'General Academics'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
                    {selectedTeacher.status || 'Active Faculty'}
                  </span>
                  <span className="text-xs text-slate-500">
                    &bull; {selectedTeacher.qualification || 'Pedagogical Specialist'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">Official Email</span>
                <span className="font-bold text-slate-900">{selectedTeacher.email}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">Contact Phone</span>
                <span className="font-bold text-slate-900">{selectedTeacher.phone || '+1 (555) 200-0000'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">Department</span>
                <span className="font-bold text-slate-900">{selectedTeacher.department || 'General Academics'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">Base Monthly Salary / Fee</span>
                <span className="font-bold font-mono text-emerald-700">${selectedTeacher.salary || 4800}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Profile</span>
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Remove Faculty Member"
        message={`Are you certain you wish to delete teacher "${deleteConfirm.name}"? This action cannot be undone.`}
      />
    </div>
  );
};
