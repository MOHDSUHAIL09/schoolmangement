import React, { useState, useEffect } from 'react';
import { feeAPI, studentAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { DataTable } from '../components/DataTable.jsx';
import { Modal } from '../components/Modal.jsx';
import { PrintableReceipt } from '../components/PrintableReceipt.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import {
  CreditCard,
  Plus,
  Receipt,
  CheckCircle2,
  Clock,
  Printer,
  DollarSign,
  Calendar,
  AlertCircle,
  History,
  FileText,
  Sparkles
} from 'lucide-react';

export const Fees = () => {
  const { role, activeChild } = useAuth();
  const { showToast } = useSchool();

  const [fees, setFees] = useState([]);
  const [stats, setStats] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    todayCollected: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [studentsList, setStudentsList] = useState([]);

  // Student Selection Modes for Modals
  const [payStudentMode, setPayStudentMode] = useState('select'); // 'select' | 'custom'
  const [payCustomName, setPayCustomName] = useState('');
  const [payCustomClass, setPayCustomClass] = useState('Class 10');
  const [payCustomRoll, setPayCustomRoll] = useState('');

  const [createStudentMode, setCreateStudentMode] = useState('select'); // 'select' | 'custom'
  const [createCustomName, setCreateCustomName] = useState('');
  const [createCustomClass, setCreateCustomClass] = useState('Class 10');
  const [createCustomRoll, setCreateCustomRoll] = useState('');

  // Search filter for students dropdown
  const [payStudentSearch, setPayStudentSearch] = useState('');
  const [createStudentSearch, setCreateStudentSearch] = useState('');

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState('');
  const [payReceiptNo, setPayReceiptNo] = useState('');
  const [payRemarks, setPayRemarks] = useState('Tuition fee payment');
  const [selectedStudentForPay, setSelectedStudentForPay] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Invoice Form State
  const [simpleFeeForm, setSimpleFeeForm] = useState({
    studentId: '',
    month: 'November 2026',
    totalFee: 1000,
    paidAmount: 0,
    paymentMethod: 'Cash',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    remarks: 'Monthly fee assessment'
  });

  const isStudent = role === 'student';
  const isParent = role === 'parent';
  const canManageFees = ['super_admin', 'admin', 'principal'].includes(role);
  const canPayFees = canManageFees || isStudent || isParent;

  useEffect(() => {
    fetchFees();
    fetchStats();
    if (canManageFees) {
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

  const fetchStats = async () => {
    try {
      const res = await feeAPI.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Error fetching fee stats:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await studentAPI.getAll({ limit: 100 });
      if (res.success) {
        const list = res.data?.students || [];
        setStudentsList(list);
        if (list.length > 0) {
          setSimpleFeeForm((prev) => ({ ...prev, studentId: list[0]._id }));
        }
      }
    } catch (err) {
      console.warn('Error fetching students:', err);
    }
  };

  const filteredStudentsForPay = studentsList.filter((s) => {
    if (!payStudentSearch.trim()) return true;
    const q = payStudentSearch.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.classGrade?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q)
    );
  });

  const filteredStudentsForCreate = studentsList.filter((s) => {
    if (!createStudentSearch.trim()) return true;
    const q = createStudentSearch.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.classGrade?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q)
    );
  });

  const activePayStudent = studentsList.find((s) => s._id === selectedStudentForPay) || (selectedFee?.studentId && typeof selectedFee.studentId === 'object' ? selectedFee.studentId : null);
  const activeCreateStudent = studentsList.find((s) => s._id === simpleFeeForm.studentId);

  const handleOpenPayFromRow = (fee) => {
    setSelectedFee(fee);
    setSelectedStudentForPay(fee.studentId?._id || fee.studentId || '');
    const due = fee.remainingAmount !== undefined ? fee.remainingAmount : (fee.totalAmount - (fee.paidAmount || 0));
    setPayAmount(String(due > 0 ? due : ''));
    setPayMethod(isStudent ? 'Online' : 'Cash');
    setPayDate(new Date().toISOString().slice(0, 10));
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setPayRef(`TXN-${Date.now().toString().slice(-6)}${randomSuffix}`);
    setPayReceiptNo(`REC-${Date.now().toString().slice(-6)}${randomSuffix}`);
    setPayRemarks(isStudent ? 'Online tuition fee payment' : 'Fee collection settlement');
    setIsPayModalOpen(true);
  };

  const handleOpenPayFromTop = () => {
    const pendingFees = fees.filter((f) => (f.remainingAmount || (f.totalAmount - (f.paidAmount || 0))) > 0);
    const targetFee = pendingFees.length > 0 ? pendingFees[0] : fees[0];

    if (targetFee) {
      handleOpenPayFromRow(targetFee);
    } else if (studentsList.length > 0) {
      // Pick first student
      const firstSt = studentsList[0];
      setSelectedFee(null);
      setSelectedStudentForPay(firstSt._id);
      setPayAmount('1000');
      setPayMethod(isStudent ? 'Online' : 'Cash');
      setPayDate(new Date().toISOString().slice(0, 10));
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setPayRef(`TXN-${Date.now().toString().slice(-6)}${randomSuffix}`);
      setPayReceiptNo(`REC-${Date.now().toString().slice(-6)}${randomSuffix}`);
      setPayRemarks(isStudent ? 'Online tuition fee payment' : 'Tuition deposit');
      setIsPayModalOpen(true);
    } else {
      showToast('All fees are settled in full!', 'info');
    }
  };

  const handleStudentPaySelectChange = (stId) => {
    setSelectedStudentForPay(stId);
    const matchingFee =
      fees.find((f) => (f.studentId?._id || f.studentId) === stId && (f.remainingAmount > 0 || f.status !== 'Paid')) ||
      fees.find((f) => (f.studentId?._id || f.studentId) === stId);

    if (matchingFee) {
      setSelectedFee(matchingFee);
      const due = matchingFee.remainingAmount !== undefined ? matchingFee.remainingAmount : (matchingFee.totalAmount - (matchingFee.paidAmount || 0));
      setPayAmount(String(due > 0 ? due : '1000'));
    } else {
      setSelectedFee(null);
      setPayAmount('1000');
    }
  };

  const handleOpenReceipt = (fee) => {
    setSelectedFee(fee);
    setIsReceiptModalOpen(true);
  };

  const handleOpenHistory = (fee) => {
    setSelectedFee(fee);
    setIsHistoryModalOpen(true);
  };

  // Record Payment in MongoDB
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const payAmt = Number(payAmount);
    if (!payAmt || payAmt <= 0) {
      showToast('Please enter a valid amount to deposit.', 'error');
      return;
    }

    if (payStudentMode === 'custom' && !payCustomName.trim()) {
      showToast('Please enter student name.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (payStudentMode === 'custom') {
        // Direct custom pupil creation and fee deposit into MongoDB Atlas!
        res = await feeAPI.create({
          studentName: payCustomName.trim(),
          classGrade: payCustomClass,
          rollNumber: payCustomRoll || `${Math.floor(100 + Math.random() * 900)}`,
          month: 'November 2026',
          totalFee: payAmt,
          paidAmount: payAmt,
          paymentMethod: payMethod,
          paymentReference: payRef,
          remarks: payRemarks || 'Direct fee collection'
        });
      } else if (selectedFee && selectedFee._id) {
        // Record payment against existing invoice in MongoDB
        const studentObj = typeof selectedFee.studentId === 'object' && selectedFee.studentId !== null ? selectedFee.studentId : {};
        res = await feeAPI.recordPayment(selectedFee._id, {
          amount: payAmt,
          paymentMethod: payMethod,
          paymentDate: payDate,
          transactionId: payRef,
          receiptNumber: payReceiptNo,
          studentName: selectedFee.studentName || studentObj.name || '',
          remarks: payRemarks
        });
      } else if (selectedStudentForPay) {
        // Create fee invoice and record payment in MongoDB
        const studentObj = studentsList.find((s) => s._id === selectedStudentForPay);
        res = await feeAPI.create({
          studentId: selectedStudentForPay,
          studentName: studentObj?.name || '',
          rollNumber: studentObj?.rollNumber || '',
          admissionNumber: studentObj?.admissionNumber || '',
          classGrade: studentObj?.classGrade || 'Class 10',
          month: 'November 2026',
          totalFee: payAmt,
          paidAmount: payAmt,
          paymentMethod: payMethod,
          paymentReference: payRef,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          remarks: payRemarks || 'Fee collected and deposited'
        });
      } else {
        showToast('Please select or enter a student to record fee payment.', 'error');
        setSubmitting(false);
        return;
      }

      if (res.success) {
        showToast(
          `Fee payment of ${formatCurrency(payAmt)} successfully saved to MongoDB Atlas!`,
          'success',
          'Payment Recorded'
        );
        setIsPayModalOpen(false);
        setPayCustomName('');
        await fetchFees();
        await fetchStats();
        if (canManageFees) {
          await fetchStudents();
        }
      }
    } catch (err) {
      showToast(err.message || 'Payment recording failed', 'error', 'Payment Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Create Fee Invoice in MongoDB
  const handleCreateSimpleFee = async (e) => {
    e.preventDefault();
    if (createStudentMode === 'select' && !simpleFeeForm.studentId) {
      showToast('Please select a student.', 'error');
      return;
    }
    if (createStudentMode === 'custom' && !createCustomName.trim()) {
      showToast('Please enter student name.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let payload;
      if (createStudentMode === 'custom') {
        payload = {
          studentName: createCustomName.trim(),
          classGrade: createCustomClass,
          rollNumber: createCustomRoll || `${Math.floor(100 + Math.random() * 900)}`,
          month: simpleFeeForm.month,
          totalFee: Number(simpleFeeForm.totalFee) || 1000,
          paidAmount: Number(simpleFeeForm.paidAmount) || 0,
          paymentMethod: simpleFeeForm.paymentMethod || 'Cash',
          dueDate: simpleFeeForm.dueDate,
          remarks: simpleFeeForm.remarks
        };
      } else {
        const studentObj = studentsList.find((s) => s._id === simpleFeeForm.studentId);
        payload = {
          studentId: simpleFeeForm.studentId,
          studentName: studentObj?.name || '',
          rollNumber: studentObj?.rollNumber || '',
          admissionNumber: studentObj?.admissionNumber || '',
          classGrade: studentObj?.classGrade || 'Class 10',
          month: simpleFeeForm.month,
          totalFee: Number(simpleFeeForm.totalFee) || 1000,
          paidAmount: Number(simpleFeeForm.paidAmount) || 0,
          paymentMethod: simpleFeeForm.paymentMethod || 'Cash',
          dueDate: simpleFeeForm.dueDate,
          remarks: simpleFeeForm.remarks
        };
      }

      const res = await feeAPI.create(payload);

      if (res.success) {
        showToast(
          `Fee invoice successfully saved to MongoDB Atlas!`,
          'success',
          'Invoice Generated'
        );
        setIsCreateModalOpen(false);
        setCreateCustomName('');
        await fetchFees();
        await fetchStats();
        if (canManageFees) {
          await fetchStudents();
        }
      }
    } catch (err) {
      showToast(err.message || 'Fee creation failed', 'error', 'Creation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'STUDENT INFO',
      accessor: 'student',
      sortable: true,
      render: (row) => {
        const student = typeof row.studentId === 'object' && row.studentId !== null ? row.studentId : {};
        const studentName = row.studentName || student.name || 'Student';
        const initial = studentName[0]?.toUpperCase() || 'S';
        const rollNo = row.rollNumber || student.rollNumber || '-';
        const classGrade = row.classGrade || student.classGrade || 'Class 10';
        const section = student.section || 'A';
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-extrabold text-white text-xs shadow-2xs">
              {initial}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">{studentName}</div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  {classGrade} - {section}
                </span>
                <span>&bull; Roll #{rollNo}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'BILLING MONTH',
      accessor: 'month',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.month}</span>
        </div>
      )
    },
    {
      header: 'TOTAL FEE',
      accessor: 'totalAmount',
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-slate-900 text-sm tracking-tight">
          {formatCurrency(row.totalAmount)}
        </span>
      )
    },
    {
      header: 'PAID AMOUNT',
      accessor: 'paidAmount',
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-slate-900 text-sm tracking-tight">
          {formatCurrency(row.paidAmount)}
        </span>
      )
    },
    {
      header: 'BALANCE DUE',
      accessor: 'remainingAmount',
      sortable: true,
      render: (row) => {
        const balance = row.remainingAmount !== undefined ? row.remainingAmount : Math.max(0, row.totalAmount - (row.paidAmount || 0));
        return (
          <div>
            {balance > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-[#FF5E3A]/10 text-[#FF5E3A] border border-[#FF5E3A]/30 shadow-2xs">
                <AlertCircle className="w-3 h-3 text-[#FF5E3A]" />
                {formatCurrency(balance)}
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                $0 Cleared
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'FEE SLIP / RECEIPT',
      render: (row) => {
        const slipNo = row.transactionId || row.paymentReference || `SLIP-${row._id?.slice(-6).toUpperCase()}`;
        return (
          <button
            onClick={() => handleOpenReceipt(row)}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 transition duration-150 cursor-pointer shadow-2xs"
            title="View & Print Official Fee Slip"
          >
            <FileText className="w-3.5 h-3.5 text-slate-700 group-hover:scale-110 transition-transform" />
            <div className="text-left leading-none">
              <span className="text-[10px] font-mono font-bold text-slate-800 block">{slipNo}</span>
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Print Slip</span>
            </div>
            <Printer className="w-3 h-3 text-slate-400 group-hover:text-slate-700 ml-1" />
          </button>
        );
      }
    },
    {
      header: 'STATUS',
      accessor: 'status',
      render: (row) => {
        const balance = row.remainingAmount !== undefined ? row.remainingAmount : Math.max(0, row.totalAmount - (row.paidAmount || 0));
        const isPaid = balance === 0 || row.status === 'Paid';
        const isOverdue = !isPaid && row.dueDate && new Date(row.dueDate) < new Date();

        if (isPaid) {
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mr-1.5" />
              Paid
            </span>
          );
        }

        if (isOverdue) {
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
              Overdue
            </span>
          );
        }

        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
            Pending
          </span>
        );
      }
    },
    {
      header: 'ACTION',
      render: (row) => {
        const balance = row.remainingAmount !== undefined ? row.remainingAmount : Math.max(0, row.totalAmount - (row.paidAmount || 0));
        const hasDue = balance > 0;

        return (
          <div className="flex items-center gap-1.5">
            {hasDue ? (
              canManageFees ? (
                <button
                  onClick={() => handleOpenPayFromRow(row)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-black text-white shadow-2xs transition duration-150 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Collect</span>
                </button>
              ) : (
                <button
                  onClick={() => handleOpenPayFromRow(row)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#FF5E3A] hover:bg-[#E04D2B] text-white shadow-2xs transition duration-150 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Fee</span>
                </button>
              )
            ) : (
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-slate-600" />
                Settled
              </span>
            )}

            {row.payments && row.payments.length > 0 && (
              <button
                onClick={() => handleOpenHistory(row)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Payment Installment History"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Executive Institutional Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <div className="flex items-center gap-3">
            {/* Coral Accent Bar */}
            <div className="w-1.5 h-8 bg-[#FF5E3A] rounded-full shrink-0 shadow-sm shadow-[#FF5E3A]/40" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>{isStudent ? 'My Fees & Payments' : isParent ? 'Child Fees & Invoices' : 'Tuition & Fee Collection'}</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 pl-4.5 max-w-xl font-medium">
            {isStudent
              ? 'View your semester tuition invoices, verify payment history, print official receipts, and make fee deposits online.'
              : isParent
              ? 'Review academic fees for your children, track payment history, download official fee slips, and submit fee deposits.'
              : 'Track student fee accounts, record instant collections, issue official fee slips, and monitor live campus revenue.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto animate-fade-up delay-1">
          {canManageFees ? (
            <>
              {/* Staff Collect Fee Button */}
              <button
                onClick={handleOpenPayFromTop}
                className="group relative inline-flex items-center gap-2.5 px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md hover:shadow-xl shadow-slate-900/20 border border-slate-700/50 transition-all duration-300 cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5 text-[#FF5E3A]" />
                <span className="tracking-wide">Collect Fee</span>
              </button>

              {/* Staff Generate Invoice Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="group inline-flex items-center gap-2.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs border border-slate-200/90 rounded-xl shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
                <span className="tracking-wide">Generate Invoice</span>
              </button>
            </>
          ) : (
            fees.some((f) => (f.remainingAmount !== undefined ? f.remainingAmount : (f.totalAmount - (f.paidAmount || 0))) > 0) ? (
              <button
                onClick={handleOpenPayFromTop}
                className="group inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#FF5E3A] hover:bg-[#E04D2B] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-xl shadow-[#FF5E3A]/20 transition-all duration-300 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-white" />
                <span className="tracking-wide">Pay Outstanding Fee</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-slate-700" />
                <span>All Fees Cleared</span>
              </span>
            )
          )}
        </div>
      </div>

      {/* 4 Executive KPI Boxes - Coral & Obsidian Institutional Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Total Assessed / My Total Fees */}
        <div className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-slate-900 text-white shadow-lg shadow-slate-950/20 border border-slate-800 flex flex-col justify-between min-h-[155px] cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isStudent ? 'MY TOTAL FEES' : isParent ? 'ASSESSED FEES' : 'TOTAL ASSESSED'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <CreditCard className="w-5 h-5 text-slate-200" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formatCurrency(stats.totalExpected)}
            </div>
            <span className="text-xs text-slate-400 font-medium mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              {isStudent ? 'Total curriculum fees for academic year' : 'Total term curriculum fee'}
            </span>
          </div>
        </div>

        {/* 2. Total Paid / Deposited */}
        <div className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-slate-900 text-white shadow-lg shadow-slate-950/20 border border-slate-800 flex flex-col justify-between min-h-[155px] cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isStudent ? 'TOTAL PAID TO DATE' : 'TOTAL COLLECTED'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <CheckCircle2 className="w-5 h-5 text-slate-200" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formatCurrency(stats.totalCollected)}
            </div>
            <span className="text-xs text-slate-300 font-semibold mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Settled & recorded in database
            </span>
          </div>
        </div>

        {/* 3. Pending Balance Due - Featured in Coral Orange */}
        <div className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-[#FF5E3A] text-white shadow-lg shadow-[#FF5E3A]/25 border border-[#FF5E3A]/50 flex flex-col justify-between min-h-[155px] cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-white/90">
              {isStudent ? 'REMAINING BALANCE DUE' : 'PENDING BALANCE'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formatCurrency(stats.totalPending)}
            </div>
            <span className="text-xs text-white/90 font-semibold mt-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/90 shrink-0" />
              {stats.totalPending > 0 ? 'Outstanding balance awaiting payment' : 'Zero balance due (All Clear)'}
            </span>
          </div>
        </div>

        {/* 4. Today / Recent Activity */}
        <div className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 bg-slate-900 text-white shadow-lg shadow-slate-950/20 border border-slate-800 flex flex-col justify-between min-h-[155px] cursor-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              {isStudent ? 'RECENT PAYMENT' : "TODAY'S COLLECTION"}
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <Sparkles className="w-5 h-5 text-[#FF5E3A]" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formatCurrency(isStudent ? (fees[0]?.lastPaymentAmount || fees[0]?.paidAmount || 0) : (stats.todayCollected || 0))}
            </div>
            <span className="text-xs text-slate-300 font-semibold mt-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5E3A] shrink-0" />
              {isStudent
                ? (fees[0]?.lastPaymentDate ? `Paid on ${formatDate(fees[0]?.lastPaymentDate)}` : 'Recorded fee receipt')
                : 'Recorded today in database'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 w-fit text-xs font-semibold">
          {[
            { key: '', label: 'All Invoices' },
            { key: 'Pending', label: 'Pending' },
            { key: 'Paid', label: 'Paid' },
            { key: 'Overdue', label: 'Overdue' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg transition duration-150 cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{fees.length}</span> invoice records
        </div>
      </div>

      {/* Main Table with In-Row Fee Slip */}
      <DataTable
        columns={columns}
        data={fees}
        loading={loading}
        searchPlaceholder="Search student name, class, roll number, or slip reference..."
        emptyMessage="No fee records match the selected query."
      />

      {/* ======================================================== */}
      {/* COLLECT / PAY FEE MODAL (SAVES TO MONGODB)               */}
      {/* ======================================================== */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={isStudent ? "Pay Student Fees & Deposit" : isParent ? "Pay Student Fees" : "Collect Fee Payment"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {isStudent ? (
            /* Student Self-Pay Profile Header */
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF5E3A] text-white font-black flex items-center justify-center text-sm shadow-sm">
                  {selectedFee?.studentName?.[0] || 'A'}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-white">{selectedFee?.studentName || 'Student'}</div>
                  <div className="text-[11px] text-slate-300 font-semibold mt-0.5">
                    {selectedFee?.classGrade || 'Class 8'} &bull; Roll #{selectedFee?.rollNumber || '101'} &bull; Term: {selectedFee?.month || 'December 2026'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-[#FF5E3A]/20 text-[#FF5E3A] border border-[#FF5E3A]/40 px-2.5 py-1 rounded-lg">
                Student Self-Pay
              </span>
            </div>
          ) : (
            /* Administrator / Bursar Pupil Selector */
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Student Selection *
                </label>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPayStudentMode('select')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      payStudentMode === 'select'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Choose Pupil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayStudentMode('custom');
                      setSelectedFee(null);
                    }}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      payStudentMode === 'custom'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + New / Custom Name
                  </button>
                </div>
              </div>

              {payStudentMode === 'select' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={payStudentSearch}
                    onChange={(e) => setPayStudentSearch(e.target.value)}
                    placeholder="🔍 Type student name or roll # to filter list..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                  <select
                    value={selectedStudentForPay}
                    onChange={(e) => handleStudentPaySelectChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600 shadow-2xs"
                  >
                    {filteredStudentsForPay.map((st) => {
                      const stFee = fees.find((f) => (f.studentId?._id || f.studentId) === st._id && (f.remainingAmount > 0 || f.status !== 'Paid'));
                      const due = stFee ? (stFee.remainingAmount !== undefined ? stFee.remainingAmount : (stFee.totalAmount - (stFee.paidAmount || 0))) : 0;
                      return (
                        <option key={st._id} value={st._id}>
                          {st.name} ({st.classGrade} - Sec {st.section} &bull; Roll #{st.rollNumber}) {due > 0 ? `— Due: ${formatCurrency(due)}` : '— Settled / New'}
                        </option>
                      );
                    })}
                  </select>

                  {activePayStudent && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs">
                          {activePayStudent.name?.[0] || 'S'}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block">{activePayStudent.name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {activePayStudent.classGrade} &bull; Roll #{activePayStudent.rollNumber} &bull; {activePayStudent.studentId || ''}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md border border-slate-300">
                        Active Student Linked
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-900 uppercase mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={payCustomName}
                      onChange={(e) => setPayCustomName(e.target.value)}
                      placeholder="Enter student full name (e.g. Rahul Sharma)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-900 uppercase mb-1">
                        Class / Grade
                      </label>
                      <select
                        value={payCustomClass}
                        onChange={(e) => setPayCustomClass(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                      >
                        {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-900 uppercase mb-1">
                        Roll Number
                      </label>
                      <input
                        type="text"
                        value={payCustomRoll}
                        onChange={(e) => setPayCustomRoll(e.target.value)}
                        placeholder="e.g. 101"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pupil Balance Card */}
          {selectedFee ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {selectedFee.studentId?.name || selectedFee.studentName || 'Selected Student'}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {selectedFee.studentId?.classGrade || selectedFee.classGrade} &bull; Section {selectedFee.studentId?.section || 'A'} &bull; Roll #{selectedFee.studentId?.rollNumber || selectedFee.rollNumber || '-'}
                  </span>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs">
                  {selectedFee.month}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Fee</span>
                  <span className="text-xs font-black text-slate-900 mt-0.5 block">
                    {formatCurrency(selectedFee.totalAmount)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Already Paid</span>
                  <span className="text-xs font-black text-slate-900 mt-0.5 block">
                    {formatCurrency(selectedFee.paidAmount)}
                  </span>
                </div>
                <div className="bg-[#FF5E3A]/10 p-2.5 rounded-xl border border-[#FF5E3A]/30 shadow-2xs">
                  <span className="text-[10px] text-[#FF5E3A] uppercase font-bold block">Remaining Due</span>
                  <span className="text-sm font-black text-[#FF5E3A] mt-0.5 block">
                    {formatCurrency(
                      selectedFee.remainingAmount !== undefined
                        ? selectedFee.remainingAmount
                        : selectedFee.totalAmount - (selectedFee.paidAmount || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium">
              Information: A new fee transaction record will be created and recorded directly to database.
            </div>
          )}

          {/* Amount to Deposit Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Deposit Amount ($) *
              </label>
              {selectedFee && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const due = selectedFee.remainingAmount !== undefined ? selectedFee.remainingAmount : (selectedFee.totalAmount - (selectedFee.paidAmount || 0));
                      setPayAmount(String(due));
                    }}
                    className="text-[10px] font-black text-[#FF5E3A] bg-[#FF5E3A]/10 hover:bg-[#FF5E3A]/20 px-2.5 py-0.5 rounded-lg border border-[#FF5E3A]/30 transition cursor-pointer"
                  >
                    Full Due (${selectedFee.remainingAmount !== undefined ? selectedFee.remainingAmount : (selectedFee.totalAmount - (selectedFee.paidAmount || 0))})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const due = selectedFee.remainingAmount !== undefined ? selectedFee.remainingAmount : (selectedFee.totalAmount - (selectedFee.paidAmount || 0));
                      setPayAmount(String(Math.round(due / 2)));
                    }}
                    className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-0.5 rounded-lg transition cursor-pointer"
                  >
                    50% Due
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">$</span>
              <input
                type="number"
                required
                min="1"
                max={selectedFee?.remainingAmount || 100000}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Enter deposit amount..."
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 focus:border-[#FF5E3A] shadow-2xs"
              />
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Channel
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 focus:border-[#FF5E3A]"
              >
                <option value="Online">Online Portal (Card / UPI / NetBanking)</option>
                <option value="UPI">UPI / Instant Transfer</option>
                <option value="Credit Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                <option value="Cash">Cash Deposit at Bursar Desk</option>
                <option value="Cheque">Cheque Deposit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 focus:border-[#FF5E3A]"
              />
            </div>
          </div>

          {/* Slip Reference & Remarks */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Receipt / Transaction ID
              </label>
              <input
                type="text"
                value={payReceiptNo}
                onChange={(e) => setPayReceiptNo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 focus:border-[#FF5E3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Remarks / Notes
              </label>
              <input
                type="text"
                value={payRemarks}
                onChange={(e) => setPayRemarks(e.target.value)}
                placeholder="Optional notes"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E3A]/20 focus:border-[#FF5E3A]"
              />
            </div>
          </div>

          {/* Calculation Preview */}
          {selectedFee && Number(payAmount) > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex justify-between items-center text-slate-900 font-semibold">
                <span>Amount to Deposit:</span>
                <span className="font-black text-sm text-[#FF5E3A]">{formatCurrency(payAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700 mt-1.5 pt-1.5 border-t border-slate-200">
                <span>Remaining Balance After Payment:</span>
                <span className="font-extrabold text-slate-900">
                  {formatCurrency(
                    Math.max(
                      0,
                      (selectedFee.remainingAmount !== undefined ? selectedFee.remainingAmount : (selectedFee.totalAmount - (selectedFee.paidAmount || 0))) - Number(payAmount)
                    )
                  )}
                  {Math.max(
                    0,
                    (selectedFee.remainingAmount !== undefined ? selectedFee.remainingAmount : (selectedFee.totalAmount - (selectedFee.paidAmount || 0))) - Number(payAmount)
                  ) === 0 ? ' (Full Settlement — Status: Paid)' : ' (Status: Pending)'}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#FF5E3A] hover:bg-[#E04D2B] text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Processing Payment...' : isStudent ? `Pay ${formatCurrency(payAmount || 0)} Now` : 'Confirm Payment & Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* GENERATE FEE INVOICE MODAL                               */}
      {/* ======================================================== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate Fee Invoice"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateSimpleFee} className="space-y-4">
          {/* Pupil Selection Header with Tab Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Student Selection *
              </label>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCreateStudentMode('select')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    createStudentMode === 'select'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Choose Pupil
                </button>
                <button
                  type="button"
                  onClick={() => setCreateStudentMode('custom')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    createStudentMode === 'custom'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + New / Custom Name
                </button>
              </div>
            </div>

            {createStudentMode === 'select' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={createStudentSearch}
                  onChange={(e) => setCreateStudentSearch(e.target.value)}
                  placeholder="🔍 Type student name or roll # to filter list..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
                <select
                  required
                  value={simpleFeeForm.studentId}
                  onChange={(e) => setSimpleFeeForm({ ...simpleFeeForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600"
                >
                  <option value="">-- Choose Pupil --</option>
                  {filteredStudentsForCreate.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name} ({st.classGrade} - Sec {st.section} &bull; Roll #{st.rollNumber})
                    </option>
                  ))}
                </select>

                {activeCreateStudent && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs">
                        {activeCreateStudent.name?.[0] || 'S'}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block">{activeCreateStudent.name}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {activeCreateStudent.classGrade} &bull; Roll #{activeCreateStudent.rollNumber} &bull; {activeCreateStudent.studentId || ''}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md border border-slate-300">
                      Active Student Linked
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-900 uppercase mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createCustomName}
                    onChange={(e) => setCreateCustomName(e.target.value)}
                    placeholder="Enter student full name (e.g. Priya Sharma)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-900 uppercase mb-1">
                      Class / Grade
                    </label>
                    <select
                      value={createCustomClass}
                      onChange={(e) => setCreateCustomClass(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-900 uppercase mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={createCustomRoll}
                      onChange={(e) => setCreateCustomRoll(e.target.value)}
                      placeholder="e.g. 102"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Billing Month
              </label>
              <input
                type="text"
                required
                value={simpleFeeForm.month}
                onChange={(e) => setSimpleFeeForm({ ...simpleFeeForm, month: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={simpleFeeForm.dueDate}
                onChange={(e) => setSimpleFeeForm({ ...simpleFeeForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                Total Fee ($) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="500000"
                value={simpleFeeForm.totalFee}
                onChange={(e) => setSimpleFeeForm({ ...simpleFeeForm, totalFee: Math.max(1, Number(e.target.value)) })}
                placeholder="e.g. 1000"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                Initial Paid ($)
              </label>
              <input
                type="number"
                min="0"
                max={simpleFeeForm.totalFee}
                value={simpleFeeForm.paidAmount}
                onChange={(e) => setSimpleFeeForm({ ...simpleFeeForm, paidAmount: Math.max(0, Number(e.target.value)) })}
                placeholder="e.g. 0"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Remarks
            </label>
            <input
              type="text"
              value={simpleFeeForm.remarks}
              onChange={(e) => setSimpleFeeForm({ ...simpleFeeForm, remarks: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving to Database...' : 'Issue Invoice & Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Fee Slip / Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Bursar Fee Slip"
        maxWidth="max-w-2xl"
      >
        {selectedFee && <PrintableReceipt fee={selectedFee} />}
      </Modal>

      {/* Payment History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Payment Transactions Ledger — ${selectedFee?.studentId?.name || 'Student'}`}
        maxWidth="max-w-lg"
      >
        {selectedFee && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-extrabold text-slate-900 text-sm block">{selectedFee.studentId?.name}</span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {selectedFee.studentId?.classGrade || selectedFee.classGrade} &bull; {selectedFee.month}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Deposited</span>
                <span className="font-black text-slate-900 text-sm">
                  {formatCurrency(selectedFee.paidAmount)}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Slip Ref #</th>
                    <th className="p-3">Method</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedFee.payments && selectedFee.payments.length > 0 ? (
                    selectedFee.payments.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-700">{formatDate(p.paymentDate)}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{p.receiptNumber || p.transactionId || '-'}</td>
                        <td className="p-3 font-medium text-slate-600">{p.paymentMethod}</td>
                        <td className="p-3 text-right font-black text-slate-900">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-400">
                        No individual payment installments logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
