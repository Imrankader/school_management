const http = require('http');

function request(method, path, body, token = null, port = 8080) {
  return new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = http.request({ hostname: 'localhost', port, path, method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
        } catch (e) {
          resolve({ status: res.statusCode, rawBody: data });
        }
      });
    });
    req.on('error', e => resolve({ status: 'ERR', message: e.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runTests() {
  console.log('=== NOTIFICATION SERVICE VERIFICATION TESTS ===\n');

  // 1. Authenticate users
  console.log('1. Authenticating users:');
  const adminLogin = await request('POST', '/api/auth/login', { email: 'admin@school.com', password: 'Admin@123' });
  const adminToken = adminLogin.body?.data?.token;
  console.log(`   Admin Login: status=${adminLogin.status}, token=${adminToken ? 'OK' : 'FAIL'}`);

  const teacherLogin = await request('POST', '/api/auth/login', { email: 'teacher@school.com', password: 'Teacher@123' });
  const teacherToken = teacherLogin.body?.data?.token;
  console.log(`   Teacher Login: status=${teacherLogin.status}, token=${teacherToken ? 'OK' : 'FAIL'}`);

  const parentLogin = await request('POST', '/api/auth/login', { email: 'parent@school.com', password: 'Parent@123' });
  const parentToken = parentLogin.body?.data?.token;
  console.log(`   Parent/Student Login: status=${parentLogin.status}, token=${parentToken ? 'OK' : 'FAIL'}\n`);

  if (!adminToken || !teacherToken || !parentToken) {
    console.error('Authentication failed, aborting tests.');
    return;
  }

  // 2. Admin creates notification for TEACHERS
  console.log('2. Admin sends notification to TEACHERS:');
  const notifTeachers = await request('POST', '/api/notifications', {
    date: '2026-09-24',
    audience: 'TEACHERS',
    message: 'Staff meeting tomorrow at 9 AM in Conference Room A.'
  }, adminToken);
  console.log(`   Status: ${notifTeachers.status}, Response:`, notifTeachers.body);

  // 3. Admin creates notification for STUDENTS
  console.log('\n3. Admin sends notification to STUDENTS:');
  const notifStudents = await request('POST', '/api/notifications', {
    date: '2026-09-24',
    audience: 'STUDENTS',
    message: 'Midterm exam schedule has been published on the portal.'
  }, adminToken);
  console.log(`   Status: ${notifStudents.status}, Response:`, notifStudents.body);

  // 4. Admin creates notification for BOTH
  console.log('\n4. Admin sends notification to BOTH:');
  const notifBoth = await request('POST', '/api/notifications', {
    date: '2026-09-25',
    audience: 'BOTH',
    message: 'School will be closed this Friday for Annual Sports Day.'
  }, adminToken);
  console.log(`   Status: ${notifBoth.status}, Response:`, notifBoth.body);

  // 5. Admin retrieves history
  console.log('\n5. Admin views notification history (GET /api/notifications/history):');
  const history = await request('GET', '/api/notifications/history', null, adminToken);
  console.log(`   Status: ${history.status}, Total notifications: ${history.body?.data?.length || 0}`);
  if (history.body?.data) {
    history.body.data.forEach(n => console.log(`   - [ID ${n.id}] [${n.audience}] (${n.date}): ${n.message}`));
  }

  // 6. Teacher retrieves notifications
  console.log('\n6. Teacher views my notifications (GET /api/notifications/my):');
  const teacherNotifs = await request('GET', '/api/notifications/my', null, teacherToken);
  console.log(`   Status: ${teacherNotifs.status}, Received count: ${teacherNotifs.body?.data?.length || 0}`);
  if (teacherNotifs.body?.data) {
    teacherNotifs.body.data.forEach(n => console.log(`   - [ID ${n.id}] [${n.audience}] (${n.date}): ${n.message}`));
  }

  // 7. Parent/Student retrieves notifications
  console.log('\n7. Parent/Student views my notifications (GET /api/notifications/my):');
  const studentNotifs = await request('GET', '/api/notifications/my', null, parentToken);
  console.log(`   Status: ${studentNotifs.status}, Received count: ${studentNotifs.body?.data?.length || 0}`);
  if (studentNotifs.body?.data) {
    studentNotifs.body.data.forEach(n => console.log(`   - [ID ${n.id}] [${n.audience}] (${n.date}): ${n.message}`));
  }

  // 8. Negative security tests: non-admin attempting admin actions
  console.log('\n8. Security tests: Non-admin authorization checks:');
  const teacherSend = await request('POST', '/api/notifications', {
    date: '2026-09-24',
    audience: 'STUDENTS',
    message: 'Unauthorized teacher announcement'
  }, teacherToken);
  console.log(`   Teacher attempting POST /api/notifications -> Status: ${teacherSend.status}, Message: ${teacherSend.body?.message}`);

  const teacherHistory = await request('GET', '/api/notifications/history', null, teacherToken);
  console.log(`   Teacher attempting GET /api/notifications/history -> Status: ${teacherHistory.status}, Message: ${teacherHistory.body?.message}`);

  console.log('\n=== ALL NOTIFICATION SERVICE TESTS COMPLETED ===');
}

runTests();
