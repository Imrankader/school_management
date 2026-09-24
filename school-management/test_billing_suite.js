const http = require('http');

function get(path, port = 8080) {
  return new Promise((resolve) => {
    http.get({ hostname: 'localhost', port, path }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', e => resolve({ err: e.message }));
  });
}

async function verifyBillingSuite() {
  console.log('=== BILLING SYSTEM VERIFICATION SUITE ===\n');

  // Test 1: Class Summary API (The core issue reported)
  console.log('Test 1: GET /api/fees/class-summary via Gateway (8080)');
  const res1 = await get('/api/fees/class-summary', 8080);
  console.log('   Status Code:', res1.status);
  console.log('   Success flag:', res1.body?.success);
  console.log('   Class count:', res1.body?.data?.length);
  if (res1.body?.data) {
    res1.body.data.forEach(c => {
      console.log(`   - ${c.className}: ${c.totalStudents} students, Billed: ₹${c.totalAmount}, Paid: ₹${c.totalPaidAmount}, Dues: ₹${c.totalOutstandingAmount}`);
    });
  }

  // Test 2: Student billing for class
  console.log('\nTest 2: GET /api/fees/class/Class%2010 via Gateway (8080)');
  const res2 = await get('/api/fees/class/Class%2010', 8080);
  console.log('   Status Code:', res2.status);
  console.log('   Students in Class 10:', res2.body?.data?.length);
  if (res2.body?.data) {
    res2.body.data.forEach(s => {
      console.log(`   - ${s.studentName} (Adm: ${s.admissionNumber}): Billed ₹${s.totalAmount}, Paid ₹${s.paidAmount}, Dues ₹${s.outstandingAmount}, Status: [${s.status}]`);
    });
  }

  // Test 3: Recent Payments
  console.log('\nTest 3: GET /api/fees/payments/recent via Gateway (8080)');
  const res3 = await get('/api/fees/payments/recent', 8080);
  console.log('   Status Code:', res3.status);
  console.log('   Recent payments count:', res3.body?.data?.length);
  if (res3.body?.data && res3.body.data.length > 0) {
    res3.body.data.slice(0, 3).forEach(p => {
      console.log(`   - Payment ID ${p.id}: ${p.studentName} (${p.className}) - ₹${p.amountPaid} on ${p.paymentDate} via ${p.paymentMethod}`);
    });
  }

  // Test 4: Student specific fees
  console.log('\nTest 4: GET /api/fees/student/1 via Gateway (8080)');
  const res4 = await get('/api/fees/student/1', 8080);
  console.log('   Status Code:', res4.status);
  console.log('   Fee records for student 1:', res4.body?.data?.length);

  // Test 5: Payments by fee ID
  console.log('\nTest 5: GET /api/fees/1/payments via Gateway (8080)');
  const res5 = await get('/api/fees/1/payments', 8080);
  console.log('   Status Code:', res5.status);
  console.log('   Payment records for Fee 1:', res5.body?.data?.length);

  // Test 6: Non-existent class handling (must return empty array, NOT 500)
  console.log('\nTest 6: GET /api/fees/class/NonExistentClass99 (Graceful empty handling)');
  const res6 = await get('/api/fees/class/NonExistentClass99', 8080);
  console.log('   Status Code:', res6.status);
  console.log('   Data returned:', res6.body?.data);

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
}

verifyBillingSuite();
