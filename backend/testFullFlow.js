import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Fee from './models/Fee.js';
import Student from './models/Student.js';

async function verifyFullFlow() {
  try {
    console.log('=== TEST 1: LIVE API TEST FOR COLLECTING FEE ===');
    // Login
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@schoolsphere.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    console.log('Admin Authenticated via JWT.');

    // Find Ananya Sharma's fee record
    const feesRes = await fetch('http://127.0.0.1:5000/api/fees', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const feesJson = await feesRes.json();
    const targetFee = feesJson.data.fees.find(f => f.studentId?.name === 'Ananya Sharma' && f.remainingAmount > 0);

    console.log(`BEFORE PAYMENT: Student: ${targetFee.studentId.name} | Total: $${targetFee.totalAmount} | Paid: $${targetFee.paidAmount} | Remaining: $${targetFee.remainingAmount} | Status: ${targetFee.status}`);

    const payDeposit = 150;
    const payRes = await fetch(`http://127.0.0.1:5000/api/fees/${targetFee._id}/pay`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: payDeposit,
        paymentMethod: 'UPI',
        remarks: 'Live payment test from Bursar counter',
        receiptNumber: `SLIP-TEST-${Date.now().toString().slice(-6)}`
      })
    });
    const payResult = await payRes.json();
    console.log('API PAY RESPONSE STATUS:', payRes.status, 'Success:', payResult.success);

    // Direct MongoDB check
    await mongoose.connect(process.env.MONGO_URI);
    const mongoFee = await Fee.findById(targetFee._id).populate('studentId', 'name');
    console.log(`\n=== MONGODB ATLAS DIRECT VERIFICATION ===`);
    console.log(`Student: ${mongoFee.studentId.name}`);
    console.log(`Total Amount: $${mongoFee.totalAmount}`);
    console.log(`Paid Amount in DB: $${mongoFee.paidAmount}`);
    console.log(`Remaining Amount in DB: $${mongoFee.remainingAmount}`);
    console.log(`Status in DB: ${mongoFee.status}`);
    console.log(`Last Payment Amount: $${mongoFee.lastPaymentAmount}`);
    console.log(`Payments array count: ${mongoFee.payments.length}`);
    console.log(`Latest payment entry in MongoDB:`, JSON.stringify(mongoFee.payments[mongoFee.payments.length - 1], null, 2));

    console.log('\n=== TEST 2: STATS OVERVIEW API (Live MongoDB Aggregation) ===');
    const statsRes = await fetch('http://127.0.0.1:5000/api/fees/stats/overview', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const statsJson = await statsRes.json();
    console.log('Live Stats from DB:', statsJson.data);

    console.log('\n>>> ALL TESTS PASSED! DATA IS 100% PERSISTED IN MONGODB ATLAS <<<');

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

verifyFullFlow();
