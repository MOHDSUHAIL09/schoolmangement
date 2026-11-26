import React, { useState, useEffect } from 'react';
import { userAPI, studentAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { Modal } from '../components/Modal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import {
  Users,
  Phone,
  Mail,
  GraduationCap,
  Plus,
  Eye,
  Trash2,
  UserPlus,
  Lock,
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';

export const Parents = () => {
  const { role } = useAuth();
  const { showToast } = useSchool();

  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Parent@123',
    selectedStudentIds: []
  });

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
      if (sRes.success) setStudents(sRes.data?.students || []);
    } catch (err) {
      console.warn('Error fetching parents:', err);
      showToast(err.message || 'Error loading parents data', 'error', 'Data Error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: 'Parent@123',
      selectedStudentIds: []
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Parent full name and email are required.', 'error', 'Validation Error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await userAPI.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password || 'Parent@123',
        role: 'parent'
      });

      if (res.success) {
        const newParentId = res.data?._id;
        // If student(s) selected, link them
        if (newParentId && formData.selectedStudentIds.length > 0) {
          await Promise.all(
            formData.selectedStudentIds.map(async (studentId) => {
              const st = students.find((s) => s._id === studentId);
              const currentParents = (st?.parentIds || []).map((p) => p._id || p);
              if (!currentParents.includes(newParentId)) {
                await studentAPI.update(studentId, {
                  parentIds: [...currentParents, newParentId]
                });
              }
            })
          );
        }

        showToast(`Parent account for "${formData.name}" created successfully!`, 'success', 'Parent Registered');
        setIsAddModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create parent account.', 'error', 'Registration Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      const res = await userAPI.delete(deleteConfirm.id);
      if (res.success) {
        showToast('Parent account removed successfully', 'success', 'Account Deleted');
        setDeleteConfirm({ isOpen: false, id: null, name: '' });
        fetchData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete parent account', 'error', 'Delete Failed');
    }
  };

  const toggleStudentSelection = (studentId) => {
    setFormData((prev) => {
      const exists = prev.selectedStudentIds.includes(studentId);
      return {
        ...prev,
        selectedStudentIds: exists
          ? prev.selectedStudentIds.filter((id) => id !== studentId)
          : [...prev.selectedStudentIds, studentId]
      };
    });
  };

  const columns = [
    {
      header: 'Parent Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {row.name?.[0]?.toUpperCase() || 'P'}
          </div>
          <div>
            <div className="font-bold text-slate-900">{row.name}</div>
            <div className="text-xs text-slate-500 font-medium">Guardian Account</div>
          </div>
        </div>
      )
    },
    {
      header: 'Email Address',
      accessor: 'email',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Mail className="w-3.5 h-3.5 text-cyan-600" />
          <span>{row.email}</span>
        </div>
      )
    },
    {
      header: 'Phone Number',
      accessor: 'phone',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Phone className="w-3.5 h-3.5 text-teal-600" />
          <span>{row.phone || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Associated Children',
      render: (row) => {
        const children = students.filter((s) =>
          s.parentIds?.some((p) => (p._id || p) === row._id)
        );

        return (
          <div className="flex flex-wrap gap-1.5">
            {children.length > 0 ? (
              children.map((child) => (
                <span
                  key={child._id}
                  className="px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-xs font-semibold text-cyan-900 flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-cyan-700" />
                  {child.name} ({child.classGrade})
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No children linked yet</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const children = students.filter((s) =>
          s.parentIds?.some((p) => (p._id || p) === row._id)
        );

        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => {
                setSelectedParent({ ...row, children });
                setIsViewModalOpen(true);
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 transition cursor-pointer"
              title="View Parent Profile"
            >
              <Eye className="w-4 h-4" />
            </button>
            {['super_admin', 'admin', 'principal'].includes(role) && (
              <button
                onClick={() => setDeleteConfirm({ isOpen: true, id: row._id, name: row.name })}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition cursor-pointer"
                title="Delete Parent Account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header with Add New Parent Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-slate-900" />
            <span>Guardians & Parents Registry</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered parent accounts with linked enrolled children and contact information.
          </p>
        </div>

        {['super_admin', 'admin', 'principal'].includes(role) && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs transition duration-150 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Parent</span>
          </button>
        )}
      </div>

      {/* Parents Data Table */}
      <DataTable
        columns={columns}
        data={parents}
        searchPlaceholder="Search parent by name, phone, or email..."
        exportFileName="Parents_Directory"
      />

      {/* Add New Parent Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Parent / Guardian">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Parent Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Vikram Sharma"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address * (Login ID)
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. parent@school.com"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +1 (555) 300-0001"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Password
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition font-mono"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Parent can change password upon initial login</span>
            </div>
          </div>

          {/* Link Enrolled Students (Optional) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Link Enrolled Child / Student (Optional)</span>
              <span className="text-[11px] text-slate-400 lowercase font-normal">Can also link later during student admission</span>
            </label>
            <div className="max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl space-y-1.5 bg-slate-50/50">
              {students.length === 0 ? (
                <div className="text-xs text-slate-400 p-2 text-center">No students enrolled yet</div>
              ) : (
                students.map((st) => {
                  const isChecked = formData.selectedStudentIds.includes(st._id);
                  return (
                    <label
                      key={st._id}
                      onClick={() => toggleStudentSelection(st._id)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                        isChecked
                          ? 'bg-cyan-50/80 border-cyan-300 text-cyan-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-cyan-700" />
                        <span>{st.name}</span>
                        <span className="text-[11px] text-slate-500 font-normal">({st.classGrade} - Sec {st.section})</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs transition duration-150 disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Registering...' : 'Register Parent'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* View Parent Details Modal */}
      {selectedParent && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Parent Profile">
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <div className="w-14 h-14 rounded-full bg-cyan-500 text-white flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white/20">
                {selectedParent.name?.[0]?.toUpperCase() || 'P'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedParent.name}</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-cyan-200 border border-white/20 mt-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-300" />
                  Verified Guardian
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-1 uppercase font-bold tracking-wider text-[10px]">Email ID</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-600" />
                  {selectedParent.email}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-1 uppercase font-bold tracking-wider text-[10px]">Contact Phone</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  {selectedParent.phone || 'N/A'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-cyan-700" />
                <span>Linked Enrolled Children ({selectedParent.children?.length || 0})</span>
              </h4>
              {selectedParent.children && selectedParent.children.length > 0 ? (
                <div className="space-y-2">
                  {selectedParent.children.map((child) => (
                    <div
                      key={child._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-cyan-50/50 border border-cyan-200 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
                          {child.name?.[0] || 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{child.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {child.classGrade} &bull; Section {child.section} &bull; Roll #{child.rollNumber}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Enrolled
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No children linked to this parent account yet. Link during new student admission.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Remove Parent Account"
        message={`Are you sure you want to remove the parent account for "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete Account"
        isDanger={true}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
      />
    </div>
  );
};
