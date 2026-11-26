import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Fee from './models/Fee.js';
import Student from './models/Student.js';

async function testPay() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find Ananya Sharma's fee record
    const ananya = await Student.findOne({ name: /Ananya/i });
    if (!ananya) {
      console.log('Ananya not found');
      return;
    }

    const fee = await Fee.findOne({ studentId: ananya._id });
    console.log(`BEFORE: Total: ${fee.totalAmount}, Paid: ${fee.paidAmount}, Remaining: ${fee.remainingAmount}, Status: ${fee.status}, Payments: ${fee.payments?.length || 0}`);

    // Simulate paying $100 towards the $600 balance
    const payAmount = 100;
    const pDate = new Date();
    const txn = `TXN-TEST-${Date.now().toString().slice(-6)}`;
    const rNo = `REC-TEST-${Date.now().toString().slice(-6)}`;

    if (!fee.payments) fee.payments = [];
    fee.payments.push({
      amount: payAmount,
      paymentDate: pDate,
      paymentMethod: 'Cash',
      receiptNumber: rNo,
      transactionId: txn,
      remarks: 'Test payment installment',
      receivedBy: 'Admin'
    });

    fee.paidAmount = (Number(fee.paidAmount) || 0) + payAmount;
    fee.paymentMethod = 'Cash';
    fee.transactionId = txn;
    fee.paymentDate = pDate;
    fee.lastPaymentDate = pDate;
    fee.lastPaymentAmount = payAmount;

    await fee.save();

    console.log(`AFTER 1: Total: ${fee.totalAmount}, Paid: ${fee.paidAmount}, Remaining: ${fee.remainingAmount}, Status: ${fee.status}, Payments: ${fee.payments.length}`);

    // Verify status is 'Pending' (not 'Partial'!)
    if (fee.status !== 'Pending') {
      console.error('FAIL: Expected status to be Pending, got:', fee.status);
    } else {
      console.log('SUCCESS: Status is Pending!');
    }

    // Now test paying the remaining $500 to clear it to Paid
    const finalPay = fee.remainingAmount;
    fee.payments.push({
      amount: finalPay,
      paymentDate: new Date(),
      paymentMethod: 'UPI',
      receiptNumber: `REC-FINAL-${Date.now().toString().slice(-6)}`,
      transactionId: `TXN-UPI-${Date.now().toString().slice(-6)}`,
      remarks: 'Final settlement',
      receivedBy: 'Admin'
    });
    fee.paidAmount = fee.paidAmount + finalPay;
    await fee.save();

    console.log(`AFTER 2 (Full Settle): Total: ${fee.totalAmount}, Paid: ${fee.paidAmount}, Remaining: ${fee.remainingAmount}, Status: ${fee.status}`);
    if (fee.status !== 'Paid' || fee.remainingAmount !== 0) {
      console.error('FAIL: Expected status to be Paid and remaining 0');
    } else {
      console.log('SUCCESS: Status is Paid with 0 remaining!');
    }

    // Reset back to original state ($500 paid, $600 remaining) so user sees their actual test state
    fee.paidAmount = 500;
    fee.payments = fee.payments.slice(0, 1); // keep 1 transaction for testing
    await fee.save();
    console.log(`RESET: Total: ${fee.totalAmount}, Paid: ${fee.paidAmount}, Remaining: ${fee.remainingAmount}, Status: ${fee.status}`);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testPay();
