import React from 'react';
import { Printer } from 'lucide-react';
import { useSchool } from '../context/SchoolContext.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export const PrintableReceipt = ({ fee, student }) => {
  const { settings } = useSchool();

  const handlePrint = () => {
    window.print();
  };

  const studentData = student || fee?.studentId || {};

  return (
    <div className="printable-area bg-white text-gray-900 p-8 rounded-2xl shadow-xl max-w-2xl mx-auto border border-gray-200">
      {/* Action Bar (hidden when printed) */}
      <div className="no-print flex justify-end gap-3 mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-xs transition duration-150 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Receipt</span>
        </button>
      </div>

      {/* School Header */}
      <div className="text-center pb-6 border-b-2 border-gray-900">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
          {settings.schoolName || 'SchoolSphere International Academy'}
        </h1>
        <p className="text-xs font-semibold text-gray-600 tracking-wider uppercase mt-1">
          {settings.schoolMotto || 'Empowering Minds, Shaping Tomorrow'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {settings.address || '42 Academic Boulevard, Silicon Valley, CA'} &bull; Tel: {settings.phone || '+1 (800) 555-SPHERE'}
        </p>
      </div>

      {/* Title & Ref */}
      <div className="flex justify-between items-center my-6">
        <div>
          <span className="text-xs font-semibold uppercase text-gray-400">Official Invoice Ref:</span>
          <div className="text-base font-extrabold text-gray-900 font-mono">
            {fee?.transactionId || fee?.paymentReference ? `REC-${fee.transactionId || fee.paymentReference}` : `INV-${fee?._id?.slice(-8).toUpperCase()}`}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold uppercase text-gray-400">Academic Term:</span>
          <div className="text-sm font-bold text-gray-800">
            {fee?.month} ({fee?.academicYear || settings.academicYear || '2026-2027'})
          </div>
        </div>
      </div>

      {/* Student Details Card */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 text-xs mb-6">
        <div>
          <span className="text-gray-500 font-medium block">Student Name:</span>
          <span className="text-sm font-bold text-gray-900">{studentData.name || 'Student'}</span>
        </div>
        <div>
          <span className="text-gray-500 font-medium block">Student ID / Roll:</span>
          <span className="text-sm font-bold text-gray-900 font-mono">
            {studentData.studentId} &bull; #{studentData.rollNumber}
          </span>
        </div>
        <div>
          <span className="text-gray-500 font-medium block">Class & Section:</span>
          <span className="text-sm font-bold text-gray-900">
            {studentData.classGrade} - {studentData.section}
          </span>
        </div>
        <div>
          <span className="text-gray-500 font-medium block">Payment Status:</span>
          <span
            className={`font-bold uppercase text-[11px] px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
              fee?.status === 'Paid'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : fee?.status === 'Partial'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {fee?.status || 'Pending'}
          </span>
        </div>
      </div>

      {/* Fee Breakdown Table */}
      <table className="w-full text-xs text-left mb-6 border border-gray-200">
        <thead className="bg-gray-900 text-white font-bold uppercase text-[11px]">
          <tr>
            <th className="py-2.5 px-4">Fee Breakdown</th>
            <th className="py-2.5 px-4 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-gray-800">
          <tr>
            <td className="py-2 px-4 font-medium">Academic Tuition & Instruction</td>
            <td className="py-2 px-4 text-right font-semibold">{formatCurrency(fee?.tuition)}</td>
          </tr>
          <tr>
            <td className="py-2 px-4 font-medium">Athletics & Physical Education Facility</td>
            <td className="py-2 px-4 text-right font-semibold">{formatCurrency(fee?.game)}</td>
          </tr>
          <tr>
            <td className="py-2 px-4 font-medium">Campus Transport Shuttle</td>
            <td className="py-2 px-4 text-right font-semibold">{formatCurrency(fee?.transport)}</td>
          </tr>
          <tr>
            <td className="py-2 px-4 font-medium">Examinations & Laboratory Assessment</td>
            <td className="py-2 px-4 text-right font-semibold">{formatCurrency(fee?.exam)}</td>
          </tr>
          <tr>
            <td className="py-2 px-4 font-medium">Cultural Events & Activities</td>
            <td className="py-2 px-4 text-right font-semibold">{formatCurrency(fee?.events)}</td>
          </tr>
          {fee?.other > 0 && (
            <tr>
              <td className="py-2 px-4 font-medium">Miscellaneous / Campus Amenities</td>
              <td className="py-2 px-4 text-right font-semibold">{formatCurrency(fee?.other)}</td>
            </tr>
          )}
        </tbody>
        <tfoot className="border-t-2 border-gray-300 bg-gray-50 font-bold text-gray-900">
          <tr>
            <td className="py-2.5 px-4">Total Amount Due</td>
            <td className="py-2.5 px-4 text-right text-sm">{formatCurrency(fee?.totalAmount)}</td>
          </tr>
          <tr className="text-emerald-700">
            <td className="py-2.5 px-4">Paid Amount</td>
            <td className="py-2.5 px-4 text-right text-sm font-extrabold">{formatCurrency(fee?.paidAmount)}</td>
          </tr>
          <tr className="text-red-600">
            <td className="py-2.5 px-4">Outstanding Balance</td>
            <td className="py-2.5 px-4 text-right text-sm font-extrabold">{formatCurrency(fee?.remainingAmount)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Payment Details & Signatures */}
      <div className="grid grid-cols-2 gap-8 text-xs pt-4 border-t border-gray-200">
        <div>
          <p className="font-medium text-gray-600">Payment Channel: <span className="text-gray-900 font-bold">{fee?.paymentMethod || 'Direct'}</span></p>
          <p className="font-medium text-gray-600 mt-1">Transaction Ref: <span className="text-gray-900 font-bold">{fee?.transactionId || fee?.paymentReference || 'None'}</span></p>
          <p className="font-medium text-gray-600 mt-1">Receipt Date: <span className="text-gray-900 font-bold">{formatDate(fee?.paymentDate || Date.now())}</span></p>
        </div>

        <div className="text-center self-end">
          <div className="h-10 border-b border-gray-400 mx-auto w-36 mb-1"></div>
          <p className="font-bold text-gray-800">Authorized Bursar</p>
          <p className="text-[10px] text-gray-400">SchoolSphere Bursary Office</p>
        </div>
      </div>
    </div>
  );
};
