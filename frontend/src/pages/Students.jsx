import React, { useState, useEffect } from 'react';
import { studentAPI, userAPI, transportAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Modal } from '../components/Modal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { formatDate } from '../utils/formatters.js';
import {
  GraduationCap,
  Plus,
  Eye,
  Trash2,
  Printer,
  Bus,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';

export const Students = () => {
  const { role } = useAuth();
  const { showToast } = useSchool();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Dropdown options
  const [classesList, setClassesList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [parentsList, setParentsList] = useState([]);
  const [routesList, setRoutesList] = useState([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '2010-01-01',
    gender: 'Male',
    email: '',
    phone: '',
    address: '',
    classGrade: 'Class 10',
    section: 'A',
    rollNumber: '',
    admissionNumber: '',
    parentIds: [],
    routeId: ''
  });

  useEffect(() => {
    fetchMeta();
    fetchStudents();
  }, [selectedClass, selectedSection]);

  const fetchMeta = async () => {
    try {
      const [metaRes, parentRes, routeRes] = await Promise.all([
        studentAPI.getClassesMeta(),
        userAPI.getParents(),
        transportAPI.getAll()
      ]);

      if (metaRes.success) {
        setClassesList(metaRes.data.classes || []);
        setSectionsList(metaRes.data.sections || []);
      }
      if (parentRes.success) {
        setParentsList(parentRes.data || []);
      }
      if (routeRes.success) {
        setRoutesList(routeRes.data || []);
      }
    } catch (err) {
      console.warn('Meta fetch error:', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getAll({
        classGrade: selectedClass,
        section: selectedSection,
        limit: 100
      });
      if (res.success) {
        setStudents(res.data.students || []);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading Students');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      dateOfBirth: '2010-01-01',
      gender: 'Male',
      email: '',
      phone: '',
      address: '',
      classGrade: selectedClass || 'Class 10',
      section: selectedSection || 'A',
      rollNumber: String(students.length + 101),
      admissionNumber: `ADM-${Date.now().toString().slice(-5)}`,
      parentIds: parentsList.length > 0 ? [parentsList[0]._id] : [],
      routeId: ''
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await studentAPI.create(formData);
      if (res.success) {
        showToast('Student registered successfully', 'success', 'Saved');
        setIsAddModalOpen(false);
        fetchStudents();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      const res = await studentAPI.delete(deleteConfirm.id);
      if (res.success) {
        showToast('Student removed from system', 'success');
        setDeleteConfirm({ isOpen: false, id: null });
        fetchStudents();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Delete Failed');
    }
  };

  const columns = [
    {
      header: 'Student Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={
              row.profileImage ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
            }
            alt={row.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="font-bold text-slate-900">{row.name}</div>
            <div className="text-xs text-slate-500">ID: {row.studentId}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Class / Sec',
      accessor: 'classGrade',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {row.classGrade} - {row.section}
        </span>
      )
    },
    {
      header: 'Roll No',
      accessor: 'rollNumber',
      sortable: true,
      render: (row) => <span className="font-mono text-slate-900 font-bold">{row.rollNumber}</span>
    },
    {
      header: 'Parent Contact',
      accessor: 'parent',
      render: (row) => {
        const parent = row.parentIds?.[0];
        return parent ? (
          <div>
            <div className="font-semibold text-slate-900 text-xs">{parent.name}</div>
            <div className="text-[11px] text-slate-500">{parent.phone || parent.email}</div>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'Active'} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedStudent(row);
              setIsViewModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          {['super_admin', 'principal'].includes(role) && (
            <button
              onClick={() => setDeleteConfirm({ isOpen: true, id: row._id })}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition"
              title="Delete Record"
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
            <GraduationCap className="w-7 h-7 text-slate-900" />
            <span>Student Information Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, admit, and manage active student records across classes and divisions.
          </p>
        </div>

        {['super_admin', 'principal'].includes(role) && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-xs transition duration-150 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Admit New Student</span>
          </button>
        )}
      </div>

      {/* Class & Section Filter Slot */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 shadow-xs"
        >
          <option value="">All Classes</option>
          {classesList.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>

        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 shadow-xs"
        >
          <option value="">All Sections</option>
          {sectionsList.map((sec) => (
            <option key={sec} value={sec}>
              Section {sec}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search student by name, ID, or roll number..."
        exportFileName="Students_Roster"
      />

      {/* Add Student Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Admit New Student">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Student Full Name"
                pattern="^[a-zA-Z0-9\s.,'\-]{2,80}$"
                title="Student name must be 2 to 80 characters containing only letters, numbers, and basic punctuation."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Class Grade *</label>
              <select
                value={formData.classGrade}
                onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              >
                {classesList.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Section *</label>
              <input
                type="text"
                required
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="A, B, or C"
                pattern="^[a-zA-Z0-9\-_]{1,10}$"
                title="Section must be alphanumeric (e.g. A, B, Sec-1)."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Roll Number *</label>
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="e.g. 101"
                pattern="^[a-zA-Z0-9\-_]{1,20}$"
                title="Roll number must be alphanumeric (e.g. 101, A-12)."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Link Parent *</label>
              <select
                value={formData.parentIds[0] || ''}
                onChange={(e) => setFormData({ ...formData, parentIds: [e.target.value] })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              >
                <option value="">Select Parent Account</option>
                {parentsList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.phone || p.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Transport Route</label>
              <select
                value={formData.routeId}
                onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              >
                <option value="">No Transport Required</option>
                {routesList.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.routeName} ({r.vehicleNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Residential Address</label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full home address..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              {submitting ? 'Admitting...' : 'Complete Admission'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Student Profile Modal */}
      {selectedStudent && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Student Comprehensive Record">
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
              <img
                src={
                  selectedStudent.profileImage ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={selectedStudent.name}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  ID: {selectedStudent.studentId} &bull; Roll: {selectedStudent.rollNumber}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedStudent.classGrade} - {selectedStudent.section}
                  </span>
                  <StatusBadge status={selectedStudent.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">Date of Birth</span>
                <span className="font-bold text-slate-900">{formatDate(selectedStudent.dateOfBirth)}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">Admission Number</span>
                <span className="font-bold text-slate-900">{selectedStudent.admissionNumber}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">Gender</span>
                <span className="font-bold text-slate-900">{selectedStudent.gender}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">Admission Date</span>
                <span className="font-bold text-slate-900">{formatDate(selectedStudent.admissionDate)}</span>
              </div>
            </div>

            {selectedStudent.address && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 block mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  Residential Address
                </span>
                <span className="font-medium text-slate-800">{selectedStudent.address}</span>
              </div>
            )}

            {/* Parent Info */}
            {selectedStudent.parentIds?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Guardian Information
                </h4>
                <div className="space-y-1 text-slate-600">
                  <p><strong className="text-slate-800">Name:</strong> {selectedStudent.parentIds[0]?.name}</p>
                  <p><strong className="text-slate-800">Email:</strong> {selectedStudent.parentIds[0]?.email}</p>
                  <p><strong className="text-slate-800">Phone:</strong> {selectedStudent.parentIds[0]?.phone}</p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Profile</span>
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition"
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
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Remove Student Record"
        message="Are you certain you wish to delete this student profile? Associated grades and records will be deleted."
      />
    </div>
  );
};
