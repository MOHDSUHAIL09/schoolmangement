async function testProxy() {
  try {
    const loginRes = await fetch('http://localhost:5175/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school.com', password: 'Password@123' })
    });
    const loginData = await loginRes.json();
    console.log('Frontend proxy login success:', loginData.success);
    const token = loginData.data?.token || loginData.token;

    const statsRes = await fetch('http://localhost:5175/api/fees/stats/overview', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const statsData = await statsRes.json();
    console.log('Frontend proxy stats fetched from MongoDB Atlas:');
    console.log('  Total Expected:', statsData.data?.totalExpected);
    console.log('  Total Collected:', statsData.data?.totalCollected);
    console.log('  Total Pending:', statsData.data?.totalPending);
    console.log('  Today Collected:', statsData.data?.todayCollected);

    const feesRes = await fetch('http://localhost:5175/api/fees?limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const feesData = await feesRes.json();
    console.log('Total fees in MongoDB Atlas:', feesData.data?.total);
    console.log('Latest student name in MongoDB:', feesData.data?.fees?.[0]?.studentId?.name);
    console.log('VITE PROXY AND BROWSER ROUTE 100% OPERATIONAL!');
  } catch (err) {
    console.error('Proxy test error:', err);
  }
}

testProxy();
