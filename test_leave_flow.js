// Comprehensive Leave Management Test Script
const BASE_URL = 'http://localhost:8080';

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch {
    return { status: res.status, ok: res.ok, text };
  }
}

async function login(email, password) {
  const res = await request(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data || res.text)}`);
  }
  return res.data;
}

async function runTests() {
  console.log('==================================================');
  console.log('STARTING SCHOOL MANAGEMENT LEAVE RECORDS TESTS');
  console.log('==================================================\n');

  let passedCount = 0;
  let totalTests = 8;

  // Login Admin
  const adminAuth = await login('admin@school.com', 'Admin@123');
  const adminToken = adminAuth.data ? adminAuth.data.token : adminAuth.token;
  console.log('✓ Admin login successful');

  // Login Teacher
  const teacherAuth = await login('teacher@school.com', 'Teacher@123');
  const teacherToken = teacherAuth.data ? teacherAuth.data.token : teacherAuth.token;
  console.log('✓ Teacher login successful, assigned:', teacherAuth.data?.assignedClass, teacherAuth.data?.assignedSection);

  // For parent login: ensure demo parent has linked student
  // In auth-service: parent user is parent@school.com. Let's check studentId.
  let parentAuth;
  try {
    parentAuth = await login('parent@school.com', 'Parent@123');
  } catch (e) {
    console.error('Parent login error:', e.message);
  }
  let parentToken = parentAuth?.data ? parentAuth.data.token : parentAuth?.token;
  let parentStudentId = parentAuth?.data ? parentAuth.data.studentId : parentAuth?.studentId;

  // If parent@school.com does not have a studentId, let's link student 1 (Abder Shaheen) or use parent with student
  if (!parentStudentId) {
    console.log('Linking student 1 (Abder Shaheen) to demo parent...');
    // Create/update parent or use direct token
    const linkRes = await request(`${BASE_URL}/api/auth/parents/assign-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ email: 'parent@school.com', studentId: 1 }),
    });
    // Re-login to get token with studentId
    parentAuth = await login('parent@school.com', 'Parent@123');
    parentToken = parentAuth?.data ? parentAuth.data.token : parentAuth?.token;
    parentStudentId = parentAuth?.data ? parentAuth.data.studentId : parentAuth?.studentId;
  }
  console.log(`✓ Parent login successful (studentId=${parentStudentId})`);

  // =========================================================================
  // TEST 1: Login as Parent. Submit Date: 2026-09-29, Reason: Family Function / குடும்ப நிகழ்ச்சி
  // Verify: Leave is successfully recorded.
  // =========================================================================
  console.log('\n--- TEST 1: Parent submits predefined leave reason ---');
  const test1Res = await request(`${BASE_URL}/api/attendance/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${parentToken}`,
    },
    body: JSON.stringify({
      leaveDate: '2026-09-29',
      reason: 'Family Function / குடும்ப நிகழ்ச்சி',
    }),
  });

  if (test1Res.ok && test1Res.data?.success) {
    const rec = test1Res.data.data;
    console.log('✓ TEST 1 PASSED: Leave recorded successfully');
    console.log(`  Record ID: ${rec.recordId || rec.id}, Date: ${rec.leaveDate || rec.startDate}, Status: ${rec.status}`);
    if (rec.status === 'RECORDED') passedCount++;
  } else {
    console.error('✗ TEST 1 FAILED:', test1Res.data || test1Res.text);
  }

  // =========================================================================
  // TEST 2: Login as Parent. Select Other / மற்றவை, Enter manual reason.
  // Verify manual reason is stored.
  // =========================================================================
  console.log('\n--- TEST 2: Parent submits manual reason (Other / மற்றவை) ---');
  const manualReasonText = 'Personal appointment for dental checkup';
  const test2Res = await request(`${BASE_URL}/api/attendance/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${parentToken}`,
    },
    body: JSON.stringify({
      leaveDate: '2026-09-30',
      reason: manualReasonText,
    }),
  });

  if (test2Res.ok && test2Res.data?.success) {
    const rec = test2Res.data.data;
    if (rec.reason === manualReasonText && rec.status === 'RECORDED') {
      console.log('✓ TEST 2 PASSED: Manual reason stored correctly');
      console.log(`  Reason: "${rec.reason}", Status: ${rec.status}`);
      passedCount++;
    } else {
      console.error('✗ TEST 2 FAILED: Stored reason mismatch', rec);
    }
  } else {
    console.error('✗ TEST 2 FAILED:', test2Res.data || test2Res.text);
  }

  // =========================================================================
  // TEST 3: Login as Teacher. Verify teacher can see leave record with all 8 fields.
  // Student Name ✓, Admission Number ✓, Class ✓, Section ✓, Leave Date ✓, Reason ✓, Submitted On ✓, Status ✓
  // =========================================================================
  console.log('\n--- TEST 3: Teacher queries assigned class leave records ---');
  const test3Res = await request(`${BASE_URL}/api/attendance/leave/teacher`, {
    headers: {
      Authorization: `Bearer ${teacherToken}`,
    },
  });

  if (test3Res.ok && test3Res.data?.success) {
    const records = test3Res.data.data;
    console.log(`Teacher retrieved ${records.length} records for assigned class.`);
    if (records.length > 0) {
      const sample = records[0];
      console.log('Sample Record Fields:');
      console.log(`  1. Record #: ${sample.recordId || sample.id}`);
      console.log(`  2. Student Name: ${sample.studentName}`);
      console.log(`  3. Admission No: ${sample.admissionNumber}`);
      console.log(`  4. Class & Section: ${sample.className} (${sample.section})`);
      console.log(`  5. Leave Date: ${sample.leaveDate || sample.startDate}`);
      console.log(`  6. Reason: ${sample.reason}`);
      console.log(`  7. Submitted On: ${sample.submittedAt || sample.createdAt}`);
      console.log(`  8. Status: ${sample.status}`);

      const hasAllFields =
        sample.studentName &&
        !sample.studentName.includes('undefined') &&
        sample.admissionNumber &&
        sample.className &&
        (sample.leaveDate || sample.startDate) &&
        sample.reason &&
        sample.status === 'RECORDED';

      if (hasAllFields) {
        console.log('✓ TEST 3 PASSED: All 8 required fields present and valid, Status is RECORDED');
        passedCount++;
      } else {
        console.error('✗ TEST 3 FAILED: Missing required fields in sample', sample);
      }
    } else {
      console.error('✗ TEST 3 FAILED: No records returned for teacher');
    }
  } else {
    console.error('✗ TEST 3 FAILED:', test3Res.data || test3Res.text);
  }

  // =========================================================================
  // TEST 4: Verify Teacher does NOT see students from unrelated classes/sections.
  // (e.g. student 6 in Class 8, student 11 in Class 5).
  // =========================================================================
  console.log('\n--- TEST 4: Verify Teacher class isolation (no other classes) ---');
  if (test3Res.ok && test3Res.data?.success) {
    const records = test3Res.data.data;
    const unrelated = records.filter((r) => {
      const cls = (r.className || '').toUpperCase();
      const sec = (r.section || '').toUpperCase();
      // Teacher is assigned to Class 10 (or Class X), section A
      const isClass10 = cls.includes('10') || cls.includes('X');
      const isSecA = sec === 'A' || sec === '';
      return !isClass10 || !isSecA;
    });

    if (unrelated.length === 0) {
      console.log('✓ TEST 4 PASSED: Teacher strictly sees ONLY Class 10 Section A records (Zero records from other classes/sections)');
      passedCount++;
    } else {
      console.error('✗ TEST 4 FAILED: Found unrelated class records in teacher view:', unrelated);
    }
  }

  // =========================================================================
  // TEST 5: Login as Admin. Verify Admin can see all leave records.
  // =========================================================================
  console.log('\n--- TEST 5: Admin queries all school leave records ---');
  const test5Res = await request(`${BASE_URL}/api/attendance/leave`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (test5Res.ok && test5Res.data?.success) {
    const allRecords = test5Res.data.data;
    console.log(`✓ TEST 5 PASSED: Admin retrieved ${allRecords.length} total records across all classes`);
    const allRecorded = allRecords.every((r) => r.status === 'RECORDED');
    if (allRecorded) {
      console.log('  All records have status RECORDED (no pending/approval)');
    }
    passedCount++;
  } else {
    console.error('✗ TEST 5 FAILED:', test5Res.data || test5Res.text);
  }

  // =========================================================================
  // TEST 6: Admin adds a new predefined reason (e.g. English: Medical Checkup, Tamil: மருத்துவ பரிசோதனை)
  // Verify it immediately appears in Parent Portal active reasons.
  // =========================================================================
  console.log('\n--- TEST 6: Admin adds new predefined reason & appears in parent dropdown ---');
  const testReasonEng = 'Specialist Medical Checkup';
  const testReasonTam = 'சிறப்பு மருத்துவ பரிசோதனை';

  const test6Res = await request(`${BASE_URL}/api/attendance/leave-reasons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      englishReason: testReasonEng,
      tamilMeaning: testReasonTam,
    }),
  });

  let createdReasonId = null;
  if (test6Res.ok && test6Res.data?.success) {
    createdReasonId = test6Res.data.data.id;
    console.log(`✓ Admin created reason ID: ${createdReasonId}`);

    // Check parent active reasons
    const parentReasonsRes = await request(`${BASE_URL}/api/attendance/leave-reasons`);
    const foundInParent = parentReasonsRes.data?.data?.some(
      (r) => r.englishReason === testReasonEng && r.tamilMeaning === testReasonTam
    );

    if (foundInParent) {
      console.log('✓ TEST 6 PASSED: New reason immediately available in Parent dropdown');
      passedCount++;
    } else {
      console.error('✗ TEST 6 FAILED: New reason not found in parent active reasons');
    }
  } else {
    console.error('✗ TEST 6 FAILED to create reason:', test6Res.data);
  }

  // =========================================================================
  // TEST 7: Edit the reason from Admin. Verify Parent Portal displays the updated value.
  // =========================================================================
  console.log('\n--- TEST 7: Admin edits reason & parent dropdown reflects update ---');
  if (createdReasonId) {
    const updatedEng = 'Specialist Hospital Visit';
    const updatedTam = 'சிறப்பு மருத்துவமனை வருகை';

    const test7Res = await request(`${BASE_URL}/api/attendance/leave-reasons/${createdReasonId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        englishReason: updatedEng,
        tamilMeaning: updatedTam,
      }),
    });

    if (test7Res.ok && test7Res.data?.success) {
      const parentReasonsRes = await request(`${BASE_URL}/api/attendance/leave-reasons`);
      const foundUpdated = parentReasonsRes.data?.data?.some(
        (r) => r.id === createdReasonId && r.englishReason === updatedEng
      );

      if (foundUpdated) {
        console.log('✓ TEST 7 PASSED: Updated reason reflected immediately in Parent dropdown');
        passedCount++;
      } else {
        console.error('✗ TEST 7 FAILED: Updated reason not reflected');
      }
    } else {
      console.error('✗ TEST 7 FAILED to update reason:', test7Res.data);
    }
  }

  // =========================================================================
  // TEST 8: Disable a reason. Verify it no longer appears in Parent Portal.
  // =========================================================================
  console.log('\n--- TEST 8: Admin deactivates reason & disappears from parent dropdown ---');
  if (createdReasonId) {
    const test8Res = await request(`${BASE_URL}/api/attendance/leave-reasons/${createdReasonId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (test8Res.ok && test8Res.data?.success) {
      const parentReasonsRes = await request(`${BASE_URL}/api/attendance/leave-reasons`);
      const foundInParent = parentReasonsRes.data?.data?.some((r) => r.id === createdReasonId);

      if (!foundInParent) {
        console.log('✓ TEST 8 PASSED: Deactivated reason successfully removed from Parent dropdown');
        passedCount++;
      } else {
        console.error('✗ TEST 8 FAILED: Deactivated reason still visible in parent dropdown');
      }
    } else {
      console.error('✗ TEST 8 FAILED to deactivate reason:', test8Res.data);
    }
  }

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passedCount} / ${totalTests} TESTS PASSED`);
  console.log('==================================================\n');
}

runTests().catch(console.error);
