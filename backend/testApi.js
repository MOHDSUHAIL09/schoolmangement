async function testFlow() {
  try {
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@schoolsphere.com', password: 'password123' })
    });
    const loginJson = await loginRes.json();
    console.log('Login success:', loginJson.success, 'Role:', loginJson.data?.user?.role);
    const token = loginJson.data?.token;

    // Fetch all fees
    const feesRes = await fetch('http://127.0.0.1:5000/api/fees', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const feesJson = await feesRes.json();
    console.log('Total fees in DB:', feesJson.data?.fees?.length);

    // Find a fee with remaining balance
    const targetFee = feesJson.data.fees.find(f => f.remainingAmount > 0);
    if (!targetFee) {
      console.log('No pending fees found!');
      return;
    }

    console.log(`Target: ${targetFee.studentId?.name} | ID: ${targetFee._id} | Total: ${targetFee.totalAmount} | Paid: ${targetFee.paidAmount} | Remaining: ${targetFee.remainingAmount} | Status: ${targetFee.status}`);

    // Call PUT /api/fees/:id/pay
    const payAmt = 100;
    const payRes = await fetch(`http://127.0.0.1:5000/api/fees/${targetFee._id}/pay`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: payAmt,
        paymentMethod: 'Cash',
        remarks: 'Live payment test',
        paymentDate: new Date()
      })
    });
    const payJson = await payRes.json();
    console.log('Payment API status:', payRes.status, 'Response:', payJson);

    // Now re-fetch to verify MongoDB saved it!
    const verifyRes = await fetch(`http://127.0.0.1:5000/api/fees/${targetFee._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const verifyJson = await verifyRes.json();
    const updated = verifyJson.data;
    console.log(`VERIFICATION IN MONGODB: Total: ${updated.totalAmount} | Paid: ${updated.paidAmount} | Remaining: ${updated.remainingAmount} | Status: ${updated.status} | Payments logged: ${updated.payments?.length}`);

  } catch (err) {
    console.error('Test error:', err);
  }
}

testFlow();
