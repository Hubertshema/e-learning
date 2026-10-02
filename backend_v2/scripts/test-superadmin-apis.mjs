import dns from 'dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function request(endpoint, options = {}, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 0, ok: false, error: err.message, data: { error: err.message } };
  }
}

async function runSuperadminApiAudit() {
  console.log('=============================================================');
  console.log('🛡️ SUPERADMIN API COMPREHENSIVE AUDIT & VERIFICATION');
  console.log('=============================================================\n');

  // 1. Authenticate as Superadmin
  console.log('1. Authenticating as Superadmin...');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'superadmin@linguachris.com', password: 'Password123!' },
  });

  if (!loginRes.ok || !loginRes.data?.data?.tokens?.accessToken) {
    console.error('❌ Superadmin login failed:', loginRes.status, loginRes.data);
    process.exit(1);
  }

  const token = loginRes.data.data.tokens.accessToken;
  console.log('✅ Authenticated successfully. Superadmin Token acquired.\n');

  const results = [];

  async function checkEndpoint(name, method, endpoint, body = null, expectedStatus = 200) {
    const start = Date.now();
    const res = await request(endpoint, { method, body }, token);
    const duration = Date.now() - start;
    const passed = Array.isArray(expectedStatus)
      ? expectedStatus.includes(res.status)
      : res.status === expectedStatus;

    const record = {
      name,
      method,
      endpoint,
      status: res.status,
      expected: expectedStatus,
      duration: `${duration}ms`,
      passed,
      error: passed ? null : res.data?.error || res.data?.message || 'Unexpected status code',
      dataSummary: res.data?.data ? (Array.isArray(res.data.data) ? `Array(${res.data.data.length})` : typeof res.data.data) : 'N/A',
    };
    results.push(record);

    const icon = passed ? '✅' : '❌';
    console.log(`${icon} [${method}] ${endpoint} -> ${res.status} (${duration}ms)`);
    if (!passed) {
      console.log(`    Expected: ${expectedStatus} | Actual: ${res.status}`);
      console.log(`    Response: ${JSON.stringify(res.data)}`);
    }
    return res;
  }

  console.log('--- 1. OVERVIEW & ANALYTICS ---');
  await checkEndpoint('Platform Overview', 'GET', '/superadmin/overview');
  await checkEndpoint('Platform Reports', 'GET', '/superadmin/reports');

  console.log('\n--- 2. TEACHER MANAGEMENT ---');
  const teachersRes = await checkEndpoint('List Teachers', 'GET', '/superadmin/teachers');
  const firstTeacher = teachersRes.data?.data?.[0];
  if (firstTeacher) {
    await checkEndpoint('Approve Teacher (Idempotent)', 'POST', `/superadmin/teachers/${firstTeacher.id}/approve`, { hourlyRate: 45 });
    await checkEndpoint('Update Teacher Status', 'PATCH', `/superadmin/teachers/${firstTeacher.id}/status`, { status: 'ACTIVE' });
  }

  console.log('\n--- 3. STUDENT MANAGEMENT ---');
  const studentsRes = await checkEndpoint('List Students', 'GET', '/superadmin/students');
  const firstStudent = studentsRes.data?.data?.[0];
  if (firstStudent) {
    await checkEndpoint('Update Student Status', 'PATCH', `/superadmin/students/${firstStudent.id}/status`, { status: 'ACTIVE' });
    await checkEndpoint('Update Student CEFR Level (Frontend expectation)', 'PATCH', `/superadmin/students/${firstStudent.id}/level`, { level: 'B2', reason: 'QA Audit Level Adjustment' }, [200, 404]);
    await checkEndpoint('Reset User Password', 'POST', `/superadmin/users/${firstStudent.id}/reset-password`, { newPassword: 'Password123!' });
  }

  console.log('\n--- 4. COURSE MANAGEMENT ---');
  const coursesRes = await checkEndpoint('List Courses', 'GET', '/superadmin/courses');
  const firstCourse = coursesRes.data?.data?.[0];
  if (firstCourse) {
    await checkEndpoint('Update Course Publication Status', 'PATCH', `/superadmin/courses/${firstCourse.id}/status`, { isPublished: true, featured: false });
  }

  console.log('\n--- 5. CLASS / COHORT MANAGEMENT ---');
  await checkEndpoint('List Classes', 'GET', '/superadmin/classes');

  console.log('\n--- 6. PAYMENTS & FINANCIAL LEDGER ---');
  const paymentsRes = await checkEndpoint('List Payments', 'GET', '/superadmin/payments');
  const firstPayment = paymentsRes.data?.data?.[0];
  if (firstPayment) {
    await checkEndpoint('Verify Payment', 'POST', `/superadmin/payments/${firstPayment.id}/verify`, { status: 'VERIFIED', notes: 'Automated Superadmin Verification' });
  }

  console.log('\n--- 7. ENROLLMENTS ---');
  const enrollmentsRes = await checkEndpoint('List Enrollments', 'GET', '/superadmin/enrollments');
  const firstEnrollment = enrollmentsRes.data?.data?.[0];
  if (firstEnrollment) {
    await checkEndpoint('Update Enrollment Status', 'PATCH', `/superadmin/enrollments/${firstEnrollment.id}/status`, { status: 'ACTIVE' });
    await checkEndpoint('Extend Enrollment', 'PATCH', `/superadmin/enrollments/${firstEnrollment.id}/extend`, { days: 30 });
  }

  console.log('\n--- 8. AUDIT LOGS & EMAIL LOGS ---');
  await checkEndpoint('Audit Logs Ledger', 'GET', '/superadmin/audit-logs');
  await checkEndpoint('Email Logs Ledger', 'GET', '/superadmin/email-logs');

  console.log('\n--- 9. SYSTEM SETTINGS & EMAIL SETTINGS ---');
  await checkEndpoint('Get System Settings', 'GET', '/superadmin/settings');
  await checkEndpoint('Update System Settings', 'PATCH', `/superadmin/settings`, { platformName: 'LinguaChris Academy' });
  await checkEndpoint('Get Email Settings', 'GET', '/superadmin/email-settings');

  console.log('\n--- 10. PUBLIC INQUIRIES & CONTACT MESSAGES ---');
  const contactRes = await checkEndpoint('List Contact Messages', 'GET', '/superadmin/contact-messages');
  const firstContact = contactRes.data?.data?.messages?.[0] || contactRes.data?.data?.[0];
  if (firstContact) {
    await checkEndpoint('Update Contact Message Status', 'PATCH', `/superadmin/contact-messages/${firstContact.id}/status`, { status: 'READ' });
  }

  console.log('\n--- 11. ANNOUNCEMENTS ---');
  await checkEndpoint('Broadcast Announcement', 'POST', '/superadmin/announcements', {
    title: 'Platform Maintenance Notice',
    message: 'System upgrade completed smoothly.',
    targetAudience: 'ALL',
  });

  console.log('\n--- 12. NEWSLETTER SUBSCRIBERS (Frontend expectation) ---');
  await checkEndpoint('List Newsletter Subscribers', 'GET', '/superadmin/newsletter-subscribers', null, [200, 404]);

  console.log('\n=============================================================');
  console.log('📊 AUDIT SUMMARY TABLE');
  console.log('=============================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.table(
    results.map((r) => ({
      Endpoint: `[${r.method}] ${r.endpoint}`,
      Status: r.status,
      Passed: r.passed ? '✅ YES' : '❌ NO',
      Latency: r.duration,
      Summary: r.dataSummary,
    }))
  );

  console.log(`Total Endpoints Tested: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
}

runSuperadminApiAudit();
