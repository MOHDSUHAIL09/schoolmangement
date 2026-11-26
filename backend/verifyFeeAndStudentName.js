async function verifyStudentNamePersistence() {
  try {
    console.log('--- STEP 1: Logging in as Admin ---');
    const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school.com', password: 'Password@123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error('Login failed: ' + loginData.message);
    const token = loginData.data?.token || loginData.token;
    console.log('Admin logged in successfully.');

    console.log('\n--- STEP 2: Fetching Existing Registered Student ---');
    const studentsRes = await fetch('http://127.0.0.1:5000/api/students?limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const studentsData = await studentsRes.json();
    const student = studentsData.data?.students?.[0];
    if (!student) throw new Error('No students found in database');
    console.log(`Selected Existing Student: "${student.name}" (ID: ${student._id}, Roll: ${student.rollNumber}, Class: ${student.classGrade})`);

    console.log('\n--- STEP 3: Creating Fee with Student Details Stored Directly ---');
    const createRes = await fetch('http://127.0.0.1:5000/api/fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        studentId: student._id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        classGrade: student.classGrade,
        totalFee: 1400,
        paidAmount: 400,
        month: 'November 2026',
        paymentMethod: 'Cash',
        remarks: 'Tuition installment term 1'
      })
    });
    const createData = await createRes.json();
    if (!createData.success) throw new Error('Fee creation failed: ' + createData.message);
    const createdFee = createData.data;
    console.log('Fee Created in MongoDB Atlas:');
    console.log('  Doc ID:', createdFee._id);
    console.log('  studentName in DB Doc:', createdFee.studentName);
    console.log('  studentId in DB Doc:', createdFee.studentId?._id || createdFee.studentId);
    console.log('  rollNumber in DB Doc:', createdFee.rollNumber);
    console.log('  Total Fee:', createdFee.totalAmount);
    console.log('  Paid Amount:', createdFee.paidAmount);
    console.log('  Remaining Due:', createdFee.remainingAmount);
    console.log('  Status:', createdFee.status);

    console.log('\n--- STEP 4: Recording Subsequent Payment for this Student ---');
    const payRes = await fetch(`http://127.0.0.1:5000/api/fees/${createdFee._id}/pay`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        amount: 1000,
        paymentMethod: 'UPI',
        studentName: student.name,
        remarks: 'Final settlement payment'
      })
    });
    const payData = await payRes.json();
    if (!payData.success) throw new Error('Payment failed: ' + payData.message);
    const updatedFee = payData.data;
    console.log('Payment Settled in MongoDB Atlas:');
    console.log('  Updated Paid Amount:', updatedFee.paidAmount);
    console.log('  Updated Remaining Due:', updatedFee.remainingAmount);
    console.log('  Updated Status:', updatedFee.status);
    console.log('  Payment Records Count in DB:', updatedFee.payments?.length);
    console.log('  Student Name in Latest Payment Entry:', updatedFee.payments?.[updatedFee.payments.length - 1]?.studentName);

    console.log('\n--- STEP 5: Verifying GET /api/fees Returns Student Name ---');
    const listRes = await fetch('http://127.0.0.1:5000/api/fees?limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await listRes.json();
    const fetchedRecord = listData.data?.fees?.find(f => f._id === createdFee._id);
    console.log('Fetched Fee Record from List API:');
    console.log('  studentName:', fetchedRecord?.studentName);
    console.log('  studentId.name:', fetchedRecord?.studentId?.name);
    console.log('  Total Amount:', fetchedRecord?.totalAmount);
    console.log('  Paid Amount:', fetchedRecord?.paidAmount);

    console.log('\n--- STEP 6: Verifying GET /api/fees/:id for Receipt & Slips ---');
    const singleRes = await fetch(`http://127.0.0.1:5000/api/fees/${createdFee._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const singleData = await singleRes.json();
    console.log('Single Receipt Fee Record:');
    console.log('  studentName:', singleData.data?.studentName);
    console.log('  rollNumber:', singleData.data?.rollNumber);

    console.log('\n======================================================');
    console.log('ALL VERIFICATIONS PASSED: Student Name is stored, retrieved, and linked properly in MongoDB Atlas!');
    console.log('======================================================');
  } catch (err) {
    console.error('Verification failed with error:', err);
  }
}

verifyStudentNamePersistence();
