import React, { useState, useEffect } from 'react';
import { payrollAPI, userAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { SECURITY_PATTERNS, sanitizeInputText } from '../utils/securityPatterns.js';
import {
  BadgeDollarSign,
  Plus,
  CheckCircle,
  FileText,
  Printer,
  CreditCard,
  Building,
  DollarSign
} from 'lucide-react';

export const Payroll = () => {
  const { role } = useAuth();
  const { settings, showToast } = useSchool();

  const [payrolls, setPayrolls] = useState([]);
  const [stats, setStats] = useState({ totalExpenditure: 0, paidCount: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [teachersList, setTeachersList] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'Paid' | 'Pending'

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    salaryMonth: 'November 2026',
    baseSalary: 4500,
    allowances: 600,
    deductions: 350,
    paymentMethod: 'Direct Deposit',
    remarks: ''
  });

  useEffect(() => {
    fetchPayrollData();
    fetchFaculty();
  }, []);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        payrollAPI.getAll({ limit: 100 }),
        payrollAPI.getStats()
      ]);

      if (pRes.success) setPayrolls(pRes.data?.payrolls || []);
      if (sRes.success) setStats(sRes.data || { totalExpenditure: 0, paidCount: 0, pendingCount: 0 });
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading Payroll');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await userAPI.getTeachers();
      if (res.success) {
        setTeachersList(res.data || []);
      }
    } catch (err) {
      console.warn('Faculty fetch error:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await payrollAPI.createOrUpdate(formData);
      if (res.success) {
        showToast('Payroll statement compiled successfully', 'success', 'Processed');
        setIsCreateModalOpen(false);
        fetchPayrollData();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Payroll Generation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (payrollId) => {
    try {
      const res = await payrollAPI.pay(payrollId);
      if (res.success) {
        showToast('Salary disbursed and marked Paid', 'success', 'Disbursed');
        fetchPayrollData();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Disbursement Error');
    }
  };

  const columns = [
    {
      header: 'Employee Staff',
      accessor: 'employee',
      sortable: true,
      render: (row) => {
        const emp = row.employeeId || {};
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs">
              {emp.name?.[0] || 'E'}
            </div>
            <div>
              <div className="font-bold text-slate-900">{emp.name}</div>
              <div className="text-xs text-slate-500 capitalize">{emp.role?.replace('_', ' ')}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Salary Month',
      accessor: 'salaryMonth',
      render: (row) => <span className="font-semibold text-slate-800">{row.salaryMonth}</span>
    },
    {
      header: 'Base Salary',
      accessor: 'baseSalary',
      render: (row) => <span className="font-mono text-slate-700">{formatCurrency(row.baseSalary)}</span>
    },
    {
      header: 'Allowances',
      accessor: 'allowances',
      render: (row) => <span className="font-mono text-emerald-600 font-medium">+{formatCurrency(row.allowances)}</span>
    },
    {
      header: 'Deductions',
      accessor: 'deductions',
      render: (row) => <span className="font-mono text-red-600 font-medium">-{formatCurrency(row.deductions)}</span>
    },
    {
      header: 'Net Salary',
      accessor: 'netSalary',
      sortable: true,
      render: (row) => <span className="font-mono font-extrabold text-slate-900 text-sm">{formatCurrency(row.netSalary)}</span>
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
          <button
            onClick={() => {
              setSelectedPayroll(row);
              setIsStatementModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
            title="View Pay Slip"
          >
            <FileText className="w-4 h-4" />
          </button>

          {row.status !== 'Paid' && (
            <button
              onClick={() => handleMarkPaid(row._id)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
            >
              Disburse
            </button>
          )}
        </div>
      )
    }
  ];

  const displayedPayrolls = payrolls.filter((p) => {
    if (filterStatus === 'Paid') return p.status === 'Paid';
    if (filterStatus === 'Pending') return p.status !== 'Paid';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BadgeDollarSign className="w-7 h-7 text-cyan-800" />
            <span>Teacher Fees & Faculty Payroll Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Super Admin portal to manage teachers' fees, track payment records, and disburse pending payments.
          </p>
        </div>

        {['super_admin', 'admin', 'principal'].includes(role) && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-800 hover:bg-cyan-900 text-white font-semibold text-sm rounded-xl shadow-xs transition duration-150 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record Teacher Fee / Salary</span>
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Monthly Expenditure"
          value={formatCurrency(stats.totalExpenditure)}
          subtitle="Net institutional payroll & teacher fees"
          icon={Building}
          accent="emerald"
        />
        <StatCard
          title="Disbursed Accounts"
          value={stats.paidCount}
          subtitle="Settled fee payment records"
          icon={CheckCircle}
          accent="emerald"
        />
        <StatCard
          title="Pending Dispatches"
          value={stats.pendingCount}
          subtitle="Pending teacher fee payments"
          icon={CreditCard}
          accent={stats.pendingCount > 0 ? 'red' : 'emerald'}
        />
      </div>

      {/* Payment Records & Pending Payments Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            filterStatus === 'all'
              ? 'bg-cyan-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>All Fee Records</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-black">
            {payrolls.length}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('Paid')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            filterStatus === 'Paid'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <span>Paid Records</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-black">
            {payrolls.filter((p) => p.status === 'Paid').length}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('Pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            filterStatus === 'Pending'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <span>Pending Payments</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-black">
            {payrolls.filter((p) => p.status !== 'Paid').length}
          </span>
        </button>
      </div>

      {/* Payroll Table */}
      <DataTable
        columns={columns}
        data={displayedPayrolls}
        searchPlaceholder="Search teacher fee records, month, status..."
        exportFileName="Teacher_Fee_and_Payroll_Records"
      />

      {/* Generate Payroll Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Record Teacher Fee / Payroll Schedule">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Select Employee *</label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              >
                <option value="">Select Faculty Member</option>
                {teachersList.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Salary Month *</label>
              <input
                type="text"
                required
                value={formData.salaryMonth}
                pattern="^[a-zA-Z0-9\s,\-]{3,40}$"
                title="Valid month and year (e.g. November 2026)."
                maxLength={40}
                onChange={(e) => setFormData({ ...formData, salaryMonth: sanitizeInputText(e.target.value) })}
                placeholder="e.g. November 2026"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Base Monthly Salary ($) *</label>
              <input
                type="number"
                required
                min="0"
                max="10000000"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: Math.max(0, Number(e.target.value)) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Allowances / Bonuses ($)</label>
              <input
                type="number"
                min="0"
                max="10000000"
                value={formData.allowances}
                onChange={(e) => setFormData({ ...formData, allowances: Math.max(0, Number(e.target.value)) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Deductions (Tax/Leave) ($)</label>
              <input
                type="number"
                min="0"
                max="10000000"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: Math.max(0, Number(e.target.value)) })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition"
              >
                <option value="Direct Deposit">Direct Deposit (ACH)</option>
                <option value="Bank Transfer">Bank Wire Transfer</option>
                <option value="Cheque">Corporate Cheque</option>
                <option value="Cash">Cash Voucher</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <span className="font-bold text-slate-800">Calculated Net Payable:</span>
            <span className="text-base font-extrabold text-emerald-700">
              {formatCurrency(Math.max(0, formData.baseSalary + formData.allowances - formData.deductions))}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              {submitting ? 'Processing...' : 'Authorize Statement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Pay Slip Modal */}
      {selectedPayroll && (
        <Modal
          isOpen={isStatementModalOpen}
          onClose={() => setIsStatementModalOpen(false)}
          title="Official Staff Remuneration Statement"
          maxWidth="max-w-2xl"
        >
          <div className="printable-area bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="text-center pb-4 border-b border-slate-200">
              <h2 className="text-xl font-black uppercase text-slate-900">{settings.schoolName || 'SchoolSphere Academy'}</h2>
              <p className="text-xs font-bold text-emerald-700 tracking-wider">MONTHLY SALARY SLIP</p>
              <p className="text-xs text-slate-500">{settings.address || '100 Academic Blvd, International Education District'} &bull; Finance Department</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Employee:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedPayroll.employeeId?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Designation:</span>
                <span className="font-bold text-slate-900 text-sm capitalize">{selectedPayroll.employeeId?.role?.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Salary Month:</span>
                <span className="font-bold text-slate-900">{selectedPayroll.salaryMonth}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Mode:</span>
                <span className="font-bold text-slate-900">{selectedPayroll.paymentMethod}</span>
              </div>
            </div>

            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Earnings / Allowances</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5">Deductions</th>
                  <th className="p-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-2.5 font-medium">Basic Academic Salary</td>
                  <td className="p-2.5 text-right font-semibold">{formatCurrency(selectedPayroll.baseSalary)}</td>
                  <td className="p-2.5 font-medium">Statutory Tax & Insurance</td>
                  <td className="p-2.5 text-right font-semibold">{formatCurrency(selectedPayroll.deductions)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Instructional Allowances</td>
                  <td className="p-2.5 text-right font-semibold">{formatCurrency(selectedPayroll.allowances)}</td>
                  <td className="p-2.5 font-medium">Other Withholdings</td>
                  <td className="p-2.5 text-right font-semibold">$0.00</td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                <tr>
                  <td colSpan={3} className="p-3 text-right text-sm text-slate-900">Net Disbursed Compensation:</td>
                  <td className="p-3 text-right text-base font-extrabold text-emerald-700">
                    {formatCurrency(selectedPayroll.netSalary)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="flex justify-between items-end pt-6 text-xs border-t border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Date of Disbursement: {formatDate(selectedPayroll.paymentDate || Date.now())}</p>
                <p className="text-[11px] text-slate-400">Computer generated document &bull; No signature required</p>
              </div>
              <button
                onClick={() => window.print()}
                className="no-print px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Salary Statement</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
