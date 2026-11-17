import React, { useState, useEffect } from 'react';
import { feeAPI, studentAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Modal } from '../components/Modal.jsx';
import { PrintableReceipt } from '../components/PrintableReceipt.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import {
  CreditCard,
  Plus,
  Receipt,
  CheckCircle,
  Clock,
  Printer
} from 'lucide-react';

export const Fees = () => {
  const { role, activeChild } = useAuth();
  const { showToast } = useSchool();

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [studentsList, setStudentsList] = useState([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  // Payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Create Fee Form State
  const [feeForm, setFeeForm] = useState({
    studentId: '',
    classGrade: 'Class 8',
    month: 'November 2026',
    tuition: 850,
    game: 100,
    transport: 150,
    exam: 80,
    events: 50,
    other: 20,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    remarks: ''
  });

  useEffect(() => {
    fetchFees();
    if (['super_admin', 'principal'].includes(role)) {
      fetchStudents();
    }
  }, [statusFilter, role, activeChild]);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (role === 'parent' && activeChild) {
        params.studentId = activeChild._id;
      }

      const res = await feeAPI.getAll(params);
      if (res.success) {
        setFees(res.data?.fees || []);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading Fees');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await studentAPI.getAll({ limit: 100 });
      if (res.success) {
        setStudentsList(res.data?.students || []);
        if (res.data?.students?.length > 0) {
          setFeeForm((prev) => ({ ...prev, studentId: res.data.students[0]._id }));
        }
      }
    } catch (err) {
      console.warn('Error fetching students:', err);
    }
  };

  const handleOpenPay = (fee) => {
    setSelectedFee(fee);
    setPayAmount(String(fee.remainingAmount || fee.totalAmount));
    setPayMethod('Cash');
    setPayRef(`TXN-${Date.now().toString().slice(-8)}`);
    setIsPayModalOpen(true);
  };

  const handleOpenReceipt = (fee) => {
    setSelectedFee(fee);
    setIsReceiptModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await feeAPI.recordPayment(selectedFee._id, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        transactionId: payRef,
        remarks: 'Payment recorded via Bursar portal'
      });

      if (res.success) {
        showToast('Payment recorded successfully', 'success', 'Processed');
        setIsPayModalOpen(false);
        fetchFees();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Payment Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await feeAPI.create(feeForm);
      if (res.success) {
        showToast('Fee assignment created successfully', 'success', 'Saved');
        setIsCreateModalOpen(false);
        fetchFees();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Creation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Student Name',
      accessor: 'student',
      sortable: true,
      render: (row) => {
        const student = row.studentId || {};
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 text-xs">
              {student.name?.[0] || 'S'}
            </div>
            <div>
              <div className="font-bold text-gray-900">{student.name || 'Unassigned'}</div>
              <div className="text-[11px] text-gray-500">
                {student.classGrade} - {student.section} &bull; Roll: {student.rollNumber || '-'}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Month / Session',
      accessor: 'month',
      render: (row) => <span className="font-medium text-gray-800 text-xs">{row.month}</span>
    },
    {
      header: 'Total Fee',
      accessor: 'totalAmount',
      sortable: true,
      render: (row) => <span className="font-bold text-gray-900 text-xs">{formatCurrency(row.totalAmount)}</span>
    },
    {
      header: 'Paid Amount',
      accessor: 'paidAmount',
      render: (row) => (
        <span className="font-bold text-emerald-700 text-xs">{formatCurrency(row.paidAmount)}</span>
      )
    },
    {
      header: 'Balance',
      accessor: 'remainingAmount',
      render: (row) => (
        <span
          className={`font-bold text-xs ${
            row.remainingAmount > 0 ? 'text-amber-700' : 'text-gray-400'
          }`}
        >
          {formatCurrency(row.remainingAmount)}
        </span>
      )
    },
    {
      header: 'Due Date',
      accessor: 'dueDate',
      render: (row) => <span className="text-xs text-gray-500">{formatDate(row.dueDate)}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* Print Receipt */}
          <button
            onClick={() => handleOpenReceipt(row)}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
            title="Print Official Receipt"
          >
            <Receipt className="w-4 h-4" />
          </button>

          {/* Record payment button (Staff only) */}
          {['super_admin', 'principal'].includes(role) && row.status !== 'Paid' && (
            <button
              onClick={() => handleOpenPay(row)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-900 hover:bg-black text-white shadow-xs transition"
            >
              Collect
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-gray-900" />
            <span>Tuition & Fee Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track tuition schedules, collections, outstanding balances, and official printable receipts.
          </p>
        </div>

        {['super_admin', 'principal'].includes(role) && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-xs transition duration-150 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Fee Invoice</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-100 border border-gray-200 w-fit text-xs font-semibold">
        {['', 'Paid', 'Partial', 'Pending', 'Overdue'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === st
                ? 'bg-white text-gray-900 font-bold shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {st || 'All Invoices'}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={fees}
        loading={loading}
        emptyMessage="No fee records found for the current query."
      />

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Bursar Receipt"
        maxWidth="max-w-2xl"
      >
        {selectedFee && <PrintableReceipt fee={selectedFee} />}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Fee Payment Settlement"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Total Fee:</span>
              <span className="font-bold text-gray-900">{formatCurrency(selectedFee?.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-500 mt-1">
              <span>Already Settled:</span>
              <span className="font-bold text-emerald-700">{formatCurrency(selectedFee?.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-900 font-bold mt-1 pt-1 border-t border-gray-200">
              <span>Remaining Balance:</span>
              <span className="text-amber-700">{formatCurrency(selectedFee?.remainingAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Payment Amount ($)
            </label>
            <input
              type="number"
              required
              min="1"
              max={selectedFee?.remainingAmount || 100000}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Payment Channel
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Online">Online Portal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Transaction / Ref #
              </label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                pattern="^[a-zA-Z0-9\-_#]{2,40}$"
                title="Transaction reference must be 2 to 40 alphanumeric characters (e.g., TXN-98421)."
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Confirm Receipt & Settle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Fee Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Issue New Tuition & Fee Assessment"
      >
        <form onSubmit={handleCreateFee} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Student</label>
            <select
              required
              value={feeForm.studentId}
              onChange={(e) => setFeeForm({ ...feeForm, studentId: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
            >
              <option value="">-- Choose Pupil --</option>
              {studentsList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.classGrade} - {st.section} &bull; Roll: {st.rollNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Billing Month</label>
              <input
                type="text"
                value={feeForm.month}
                onChange={(e) => setFeeForm({ ...feeForm, month: e.target.value })}
                pattern="^[a-zA-Z0-9\s\-]{3,30}$"
                title="Billing period format (e.g., September 2026)."
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Due Date</label>
              <input
                type="date"
                required
                value={feeForm.dueDate}
                onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Fee Item Breakdown ($)</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Tuition</label>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={feeForm.tuition}
                  onChange={(e) => setFeeForm({ ...feeForm, tuition: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Transport</label>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={feeForm.transport}
                  onChange={(e) => setFeeForm({ ...feeForm, transport: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Exam</label>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={feeForm.exam}
                  onChange={(e) => setFeeForm({ ...feeForm, exam: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Athletics</label>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={feeForm.game}
                  onChange={(e) => setFeeForm({ ...feeForm, game: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Events</label>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={feeForm.events}
                  onChange={(e) => setFeeForm({ ...feeForm, events: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Other</label>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={feeForm.other}
                  onChange={(e) => setFeeForm({ ...feeForm, other: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? 'Generating...' : 'Issue Invoice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
