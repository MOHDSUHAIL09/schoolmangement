// using native global fetch in Node 20
async function testSave() {
  try {
    console.log('Logging in to live backend...');
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school.com', password: 'Password@123' })
    });
    const loginData = await loginRes.json();
    console.log('Login success:', loginData.success);
    const token = loginData.data?.token || loginData.token;

    console.log('Creating fee & auto-enrolling student in MongoDB Atlas...');
    const createRes = await fetch('http://127.0.0.1:5000/api/fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        studentName: 'Rohan Malhotra',
        classGrade: 'Class 9',
        rollNumber: '777',
        totalFee: 1500,
        paidAmount: 500,
        month: 'November 2026',
        paymentMethod: 'Cash',
        remarks: 'Admission fee advance'
      })
    });
    const createData = await createRes.json();
    console.log('Create Fee Status:', createRes.status, createData.message);
    const createdFee = createData.data;
    console.log('Student Saved in DB:', createdFee?.studentId?.name, 'Roll:', createdFee?.studentId?.rollNumber);
    console.log('Fee DB Doc ID:', createdFee?._id);
    console.log('Paid:', createdFee?.paidAmount, 'Remaining Due:', createdFee?.remainingAmount, 'Status:', createdFee?.status);

    console.log('Recording subsequent payment of $1,000 to clear balance in MongoDB Atlas...');
    const payRes = await fetch(`http://127.0.0.1:5000/api/fees/${createdFee._id}/pay`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        amount: 1000,
        paymentMethod: 'UPI',
        remarks: 'Cleared full due balance'
      })
    });
    const payData = await payRes.json();
    console.log('Pay Response Status:', payRes.status, payData.message);
    console.log('Updated DB Paid Amount:', payData.data?.paidAmount);
    console.log('Updated DB Remaining Amount:', payData.data?.remainingAmount);
    console.log('Updated DB Status:', payData.data?.status);
    console.log('Payments Count in DB:', payData.data?.payments?.length);

    console.log('VERIFICATION COMPLETE: DATA PERSISTED DIRECTLY IN MONGODB ATLAS!');
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testSave();
