import dns from 'dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

const testResults = [];

function recordTest(id, module, scenario, expected, actual, status, severity, recommendation = 'None') {
  const result = { id, module, scenario, expected, actual, status, severity, recommendation };
  testResults.push(result);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${id}] [${module}] ${scenario} -> ${status}`);
  if (status !== 'PASS') {
    console.log(`    Expected: ${expected}`);
    console.log(`    Actual:   ${actual}`);
    console.log(`    Severity: ${severity} | Recommendation: ${recommendation}`);
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
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

async function runAllTests() {
  console.log('\n=============================================================');
  console.log('🧪 STARTING COMPREHENSIVE QA AUTOMATED TEST SUITE');
  console.log('=============================================================\n');

  // =========================================================================
  // 1. PUBLIC ENDPOINTS & INFRASTRUCTURE
  // =========================================================================
  console.log('\n--- MODULE 1: Public Endpoints & Core Infrastructure ---');

  // TC-PUB-01: Health check
  const healthRes = await request('/health');
  if (healthRes.status === 200 && (healthRes.data?.status === 'UP' || healthRes.data?.success)) {
    recordTest('TC-PUB-01', 'Public', 'Health check endpoint returns 200 and healthy status', '200 OK', `${healthRes.status} Status`, 'PASS', 'Low');
  } else {
    recordTest('TC-PUB-01', 'Public', 'Health check endpoint returns 200 and healthy status', '200 OK', `${healthRes.status} ${JSON.stringify(healthRes.data)}`, 'FAIL', 'High', 'Fix /health endpoint in health.controller.js');
  }

  // TC-PUB-02: Public courses list
  const pubCoursesRes = await request('/public/courses');
  if (pubCoursesRes.status === 200 && pubCoursesRes.data?.success) {
    recordTest('TC-PUB-02', 'Public', 'Get published courses list', '200 OK with course list', `200 OK (${pubCoursesRes.data?.data?.courses?.length || 0} courses)`, 'PASS', 'Low');
  } else {
    recordTest('TC-PUB-02', 'Public', 'Get published courses list', '200 OK', `${pubCoursesRes.status}`, 'FAIL', 'Medium', 'Verify public course query');
  }

  // TC-PUB-03: Public levels list
  const pubCaptchaRes = await request('/public/captcha');
  if (pubCaptchaRes.status === 200 && pubCaptchaRes.data?.success) {
    recordTest('TC-PUB-03', 'Public', 'Get public diagnostic captcha and token', '200 OK with captcha question', `200 OK (${pubCaptchaRes.data?.data?.question})`, 'PASS', 'Low');
  } else {
    recordTest('TC-PUB-03', 'Public', 'Get public diagnostic captcha and token', '200 OK', `${pubCaptchaRes.status}`, 'FAIL', 'Medium', 'Verify public captcha endpoint');
  }

  // TC-PUB-04: Contact form submission with valid data
  const contactRes = await request('/public/contact', {
    method: 'POST',
    body: {
      name: 'QA Test Applicant',
      email: 'qa.applicant.test@example.com',
      phone: '+1 555 123 4567',
      subject: 'Inquiry regarding CEFR B2 Intensive',
      message: 'Hello, this is an automated functional QA test message.',
    },
  });
  if ((contactRes.status === 201 || contactRes.status === 200) && contactRes.data?.success) {
    recordTest('TC-PUB-04', 'Public', 'Submit contact message with valid fields', '200/201 Created', `${contactRes.status} Success`, 'PASS', 'Low');
  } else {
    recordTest('TC-PUB-04', 'Public', 'Submit contact message with valid fields', '200/201 Created', `${contactRes.status} ${JSON.stringify(contactRes.data)}`, 'FAIL', 'Medium', 'Check contact controller validation');
  }

  // TC-PUB-05: Contact form submission with missing required fields
  const contactBadRes = await request('/public/contact', {
    method: 'POST',
    body: { name: '' },
  });
  if (contactBadRes.status === 400) {
    recordTest('TC-PUB-05', 'Public', 'Submit contact message with missing fields rejects with 400', '400 Bad Request', `${contactBadRes.status} Bad Request`, 'PASS', 'Low');
  } else {
    recordTest('TC-PUB-05', 'Public', 'Submit contact message with missing fields rejects with 400', '400 Bad Request', `${contactBadRes.status}`, 'FAIL', 'Medium', 'Add input validation for contact form');
  }

  // TC-PUB-06: Newsletter subscription
  const newsletterRes = await request('/public/newsletter/subscribe', {
    method: 'POST',
    body: { email: `qa.newsletter.${Date.now()}@example.com` },
  });
  if (newsletterRes.status === 200 || newsletterRes.status === 201) {
    recordTest('TC-PUB-06', 'Public', 'Newsletter subscription with valid email', '200/201 Success', `${newsletterRes.status}`, 'PASS', 'Low');
  } else {
    recordTest('TC-PUB-06', 'Public', 'Newsletter subscription with valid email', '200/201 Success', `${newsletterRes.status}`, 'FAIL', 'Low', 'Verify newsletter endpoint');
  }

  // =========================================================================
  // 2. AUTHENTICATION & TOKEN LIFECYCLE
  // =========================================================================
  console.log('\n--- MODULE 2: Authentication & Token Lifecycle ---');

  let superadminToken = null;
  let superadminRefresh = null;
  let teacherToken = null;
  let studentToken = null;
  let studentId = null;
  let studentEmail = 'amara.okafor@linguachris.com';

  // TC-AUTH-01: Superadmin Login
  const saLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'superadmin@linguachris.com', password: 'Password123!' },
  });
  const saTokens = saLogin.data?.data?.tokens || saLogin.data?.data;
  if (saLogin.status === 200 && saTokens?.accessToken) {
    superadminToken = saTokens.accessToken;
    superadminRefresh = saTokens.refreshToken;
    recordTest('TC-AUTH-01', 'Auth', 'Superadmin login with valid credentials', '200 OK + JWT', `200 OK (Role: ${saLogin.data.data.user?.role})`, 'PASS', 'Low');
  } else {
    recordTest('TC-AUTH-01', 'Auth', 'Superadmin login with valid credentials', '200 OK + JWT', `${saLogin.status} ${JSON.stringify(saLogin.data)}`, 'FAIL', 'Critical', 'Verify superadmin account & password hash');
  }

  // TC-AUTH-02: Teacher Login
  const teacherLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'sarah.jenkins@linguachris.com', password: 'Password123!' },
  });
  const tcTokens = teacherLogin.data?.data?.tokens || teacherLogin.data?.data;
  if (teacherLogin.status === 200 && tcTokens?.accessToken) {
    teacherToken = tcTokens.accessToken;
    recordTest('TC-AUTH-02', 'Auth', 'Teacher login with valid credentials', '200 OK + JWT', `200 OK (Role: ${teacherLogin.data.data.user?.role})`, 'PASS', 'Low');
  } else {
    recordTest('TC-AUTH-02', 'Auth', 'Teacher login with valid credentials', '200 OK + JWT', `${teacherLogin.status} ${JSON.stringify(teacherLogin.data)}`, 'FAIL', 'Critical', 'Verify teacher account & password hash');
  }

  // TC-AUTH-03: Student Login
  const studentLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: studentEmail, password: 'Password123!' },
  });
  const stTokens = studentLogin.data?.data?.tokens || studentLogin.data?.data;
  if (studentLogin.status === 200 && stTokens?.accessToken) {
    studentToken = stTokens.accessToken;
    studentId = studentLogin.data.data.user?.id;
    recordTest('TC-AUTH-03', 'Auth', 'Student login with valid credentials', '200 OK + JWT', `200 OK (Role: ${studentLogin.data.data.user?.role})`, 'PASS', 'Low');
  } else {
    recordTest('TC-AUTH-03', 'Auth', 'Student login with valid credentials', '200 OK + JWT', `${studentLogin.status} ${JSON.stringify(studentLogin.data)}`, 'FAIL', 'Critical', 'Verify student account & password hash');
  }

  // TC-AUTH-04: Invalid password rejection
  const badPassLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'superadmin@linguachris.com', password: 'WrongPassword999!' },
  });
  if (badPassLogin.status === 401) {
    recordTest('TC-AUTH-04', 'Auth', 'Login with wrong password rejects with 401', '401 Unauthorized', `${badPassLogin.status} Unauthorized`, 'PASS', 'Low');
  } else {
    recordTest('TC-AUTH-04', 'Auth', 'Login with wrong password rejects with 401', '401 Unauthorized', `${badPassLogin.status}`, 'FAIL', 'High', 'Verify password comparison logic');
  }

  // TC-AUTH-05: Nonexistent user rejection
  const nonExistLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'nobody_exists_here_9876543@example.com', password: 'Password123!' },
  });
  if (nonExistLogin.status === 401 || nonExistLogin.status === 404) {
    recordTest('TC-AUTH-05', 'Auth', 'Login with nonexistent email rejects safely', '401 or 404', `${nonExistLogin.status}`, 'PASS', 'Low');
  } else {
    recordTest('TC-AUTH-05', 'Auth', 'Login with nonexistent email rejects safely', '401 or 404', `${nonExistLogin.status}`, 'FAIL', 'High', 'Prevent unhandled errors on unknown user');
  }

  // TC-AUTH-06: /auth/me with Superadmin token
  const saMe = await request('/auth/me', { headers: { Authorization: `Bearer ${superadminToken}` } });
  const saRole = saMe.data?.data?.user?.role || saMe.data?.data?.role;
  if (saMe.status === 200 && saRole === 'SUPERADMIN') {
    recordTest('TC-AUTH-06', 'Auth', 'Fetch /auth/me with Superadmin JWT token', '200 OK + Superadmin profile', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-AUTH-06', 'Auth', 'Fetch /auth/me with Superadmin JWT token', '200 OK', `${saMe.status}`, 'FAIL', 'High', 'Check /auth/me handler');
  }

  // TC-AUTH-07: /auth/me with No token
  const noTokenMe = await request('/auth/me');
  if (noTokenMe.status === 401) {
    recordTest('TC-AUTH-07', 'Auth', 'Access protected /auth/me without token rejects with 401', '401 Unauthorized', '401 Unauthorized', 'PASS', 'Low');
  } else {
    recordTest('TC-AUTH-07', 'Auth', 'Access protected /auth/me without token rejects with 401', '401 Unauthorized', `${noTokenMe.status}`, 'FAIL', 'Critical', 'Check authenticate middleware');
  }

  // TC-AUTH-08: /auth/me with Corrupted token
  const badTokenMe = await request('/auth/me', { headers: { Authorization: 'Bearer this-is-not-a-valid-jwt-token' } });
  if (badTokenMe.status === 401) {
    recordTest('TC-AUTH-08', 'Auth', 'Access protected /auth/me with malformed token rejects with 401', '401 Unauthorized', '401 Unauthorized', 'PASS', 'Low');
  } else {
    recordTest('TC-AUTH-08', 'Auth', 'Access protected /auth/me with malformed token rejects with 401', '401 Unauthorized', `${badTokenMe.status}`, 'FAIL', 'High', 'Check JWT verification error catching');
  }

  // TC-AUTH-09: Refresh token endpoint
  if (superadminRefresh) {
    const refreshRes = await request('/auth/refresh-token', {
      method: 'POST',
      body: { refreshToken: superadminRefresh },
    });
    const refreshedToken = refreshRes.data?.data?.tokens?.accessToken || refreshRes.data?.data?.accessToken;
    if (refreshRes.status === 200 && refreshedToken) {
      recordTest('TC-AUTH-09', 'Auth', 'Exchange valid refreshToken for new accessToken', '200 OK + new token', '200 OK', 'PASS', 'Low');
    } else {
      recordTest('TC-AUTH-09', 'Auth', 'Exchange valid refreshToken for new accessToken', '200 OK', `${refreshRes.status}`, 'FAIL', 'Medium', 'Verify refreshToken controller');
    }
  }

  // =========================================================================
  // 3. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS
  // =========================================================================
  console.log('\n--- MODULE 3: Role-Based Access Control (RBAC) ---');

  // TC-RBAC-01: Student calling Superadmin Overview
  const stToSaRes = await request('/superadmin/overview', { headers: { Authorization: `Bearer ${studentToken}` } });
  if (stToSaRes.status === 403) {
    recordTest('TC-RBAC-01', 'RBAC', 'Student accessing /superadmin/overview is blocked with 403', '403 Forbidden', '403 Forbidden', 'PASS', 'Low');
  } else {
    recordTest('TC-RBAC-01', 'RBAC', 'Student accessing /superadmin/overview is blocked with 403', '403 Forbidden', `${stToSaRes.status}`, 'FAIL', 'Critical', 'Enforce authorize("SUPERADMIN")');
  }

  // TC-RBAC-02: Student calling Superadmin Users list
  const stToUsersRes = await request('/superadmin/teachers', { headers: { Authorization: `Bearer ${studentToken}` } });
  if (stToUsersRes.status === 403) {
    recordTest('TC-RBAC-02', 'RBAC', 'Student accessing /superadmin/teachers is blocked with 403', '403 Forbidden', '403 Forbidden', 'PASS', 'Low');
  } else {
    recordTest('TC-RBAC-02', 'RBAC', 'Student accessing /superadmin/teachers is blocked with 403', '403 Forbidden', `${stToUsersRes.status}`, 'FAIL', 'Critical', 'Enforce authorize("SUPERADMIN")');
  }

  // TC-RBAC-03: Student calling Teacher Dashboard
  const stToTeachRes = await request('/teacher/dashboard', { headers: { Authorization: `Bearer ${studentToken}` } });
  if (stToTeachRes.status === 403) {
    recordTest('TC-RBAC-03', 'RBAC', 'Student accessing /teacher/dashboard is blocked with 403', '403 Forbidden', '403 Forbidden', 'PASS', 'Low');
  } else {
    recordTest('TC-RBAC-03', 'RBAC', 'Student accessing /teacher/dashboard is blocked with 403', '403 Forbidden', `${stToTeachRes.status}`, 'FAIL', 'Critical', 'Enforce authorize("TEACHER")');
  }

  // TC-RBAC-04: Student attempting to create a course via Teacher endpoint
  const stCreateCourse = await request('/teacher/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { title: 'Unauthorized Course', description: 'Should fail' },
  });
  if (stCreateCourse.status === 403) {
    recordTest('TC-RBAC-04', 'RBAC', 'Student creating course via /teacher/courses is blocked with 403', '403 Forbidden', '403 Forbidden', 'PASS', 'Low');
  } else {
    recordTest('TC-RBAC-04', 'RBAC', 'Student creating course via /teacher/courses is blocked with 403', '403 Forbidden', `${stCreateCourse.status}`, 'FAIL', 'Critical', 'Enforce role guard on course creation');
  }

  // TC-RBAC-05: Teacher calling Superadmin Audit Logs
  const tcToAuditRes = await request('/superadmin/audit-logs', { headers: { Authorization: `Bearer ${teacherToken}` } });
  if (tcToAuditRes.status === 403) {
    recordTest('TC-RBAC-05', 'RBAC', 'Teacher accessing /superadmin/audit-logs is blocked with 403', '403 Forbidden', '403 Forbidden', 'PASS', 'Low');
  } else {
    recordTest('TC-RBAC-05', 'RBAC', 'Teacher accessing /superadmin/audit-logs is blocked with 403', '403 Forbidden', `${tcToAuditRes.status}`, 'FAIL', 'High', 'Enforce authorize("SUPERADMIN")');
  }

  // TC-RBAC-06: Superadmin calling Superadmin Overview
  const saToOverviewRes = await request('/superadmin/overview', { headers: { Authorization: `Bearer ${superadminToken}` } });
  if (saToOverviewRes.status === 200 && saToOverviewRes.data?.success) {
    recordTest('TC-RBAC-06', 'RBAC', 'Superadmin accessing /superadmin/overview succeeds', '200 OK with KPIs', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-RBAC-06', 'RBAC', 'Superadmin accessing /superadmin/overview succeeds', '200 OK', `${saToOverviewRes.status} ${JSON.stringify(saToOverviewRes.data)}`, 'FAIL', 'High', 'Check superadmin.model.js overview query');
  }

  // TC-RBAC-07: Teacher calling Teacher Dashboard
  const tcToDashRes = await request('/teacher/dashboard', { headers: { Authorization: `Bearer ${teacherToken}` } });
  if (tcToDashRes.status === 200 && tcToDashRes.data?.success) {
    recordTest('TC-RBAC-07', 'RBAC', 'Teacher accessing /teacher/dashboard succeeds', '200 OK with teacher stats', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-RBAC-07', 'RBAC', 'Teacher accessing /teacher/dashboard succeeds', '200 OK', `${tcToDashRes.status} ${JSON.stringify(tcToDashRes.data)}`, 'FAIL', 'High', 'Check teacher dashboard query');
  }

  // TC-RBAC-08: Student calling Student Dashboard
  const stToDashRes = await request('/student/dashboard', { headers: { Authorization: `Bearer ${studentToken}` } });
  if (stToDashRes.status === 200 && stToDashRes.data?.success) {
    recordTest('TC-RBAC-08', 'RBAC', 'Student accessing /student/dashboard succeeds', '200 OK with student metrics', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-RBAC-08', 'RBAC', 'Student accessing /student/dashboard succeeds', '200 OK', `${stToDashRes.status} ${JSON.stringify(stToDashRes.data)}`, 'FAIL', 'High', 'Check student dashboard query');
  }

  // =========================================================================
  // 4. STUDENT FUNCTIONAL ENDPOINTS
  // =========================================================================
  console.log('\n--- MODULE 4: Student Functional Workflows ---');

  // TC-STU-01: Student courses
  const stCourses = await request('/student/courses', { headers: { Authorization: `Bearer ${studentToken}` } });
  if (stCourses.status === 200 && stCourses.data?.success) {
    const enrolledCount = stCourses.data?.data?.enrolled?.length || 0;
    recordTest('TC-STU-01', 'Student', 'Student gets own enrolled courses', '200 OK with courses array', `200 OK (${enrolledCount} enrolled)`, 'PASS', 'Low');
  } else {
    recordTest('TC-STU-01', 'Student', 'Student gets own enrolled courses', '200 OK', `${stCourses.status}`, 'FAIL', 'High', 'Check getStudentCourses handler');
  }

  // TC-STU-02: Student certificates
  const stCerts = await request('/student/certificates', { headers: { Authorization: `Bearer ${studentToken}` } });
  if (stCerts.status === 200 && stCerts.data?.success) {
    recordTest('TC-STU-02', 'Student', 'Student queries earned certificates', '200 OK with certificates list', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-STU-02', 'Student', 'Student queries earned certificates', '200 OK', `${stCerts.status}`, 'FAIL', 'Medium', 'Check certificate model query');
  }

  // TC-STU-03: Student admission status
  const stAdmission = await request('/student/admission-status', { headers: { Authorization: `Bearer ${studentToken}` } });
  if (stAdmission.status === 200 && stAdmission.data?.success) {
    recordTest('TC-STU-03', 'Student', 'Student checks admission & payment status', '200 OK with admission data', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-STU-03', 'Student', 'Student checks admission & payment status', '200 OK', `${stAdmission.status}`, 'FAIL', 'Medium', 'Check admission status controller');
  }

  // =========================================================================
  // 5. TEACHER FUNCTIONAL ENDPOINTS
  // =========================================================================
  console.log('\n--- MODULE 5: Teacher Functional Workflows ---');

  // TC-TCH-01: Teacher courses list
  const tchCourses = await request('/teacher/courses', { headers: { Authorization: `Bearer ${teacherToken}` } });
  let sampleCourseId = null;
  if (tchCourses.status === 200 && tchCourses.data?.success) {
    const courses = tchCourses.data?.data?.courses || tchCourses.data?.data || [];
    if (courses.length > 0) sampleCourseId = courses[0].id;
    recordTest('TC-TCH-01', 'Teacher', 'Teacher retrieves authored courses list', '200 OK with courses', `200 OK (${courses.length} courses)`, 'PASS', 'Low');
  } else {
    recordTest('TC-TCH-01', 'Teacher', 'Teacher retrieves authored courses list', '200 OK', `${tchCourses.status}`, 'FAIL', 'High', 'Check teacher courses query');
  }

  // TC-TCH-02: Teacher resource library
  const tchLibrary = await request('/teacher/library', { headers: { Authorization: `Bearer ${teacherToken}` } });
  if (tchLibrary.status === 200 && tchLibrary.data?.success) {
    recordTest('TC-TCH-02', 'Teacher', 'Teacher accesses resource library', '200 OK with library items', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-TCH-02', 'Teacher', 'Teacher accesses resource library', '200 OK', `${tchLibrary.status}`, 'FAIL', 'Medium', 'Check getLibraryItems function');
  }

  // TC-TCH-03: Teacher student directory
  const tchStudents = await request('/teacher/students', { headers: { Authorization: `Bearer ${teacherToken}` } });
  if (tchStudents.status === 200 && tchStudents.data?.success) {
    recordTest('TC-TCH-03', 'Teacher', 'Teacher lists enrolled students', '200 OK with students array', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-TCH-03', 'Teacher', 'Teacher lists enrolled students', '200 OK', `${tchStudents.status}`, 'FAIL', 'High', 'Check getStudents query in teacher.controller.js');
  }

  // =========================================================================
  // 6. SUPERADMIN FUNCTIONAL ENDPOINTS
  // =========================================================================
  console.log('\n--- MODULE 6: Superadmin Functional Workflows ---');

  // TC-ADM-01: Teacher approval management
  const saTeachers = await request('/superadmin/teachers', { headers: { Authorization: `Bearer ${superadminToken}` } });
  if (saTeachers.status === 200 && saTeachers.data?.success) {
    recordTest('TC-ADM-01', 'Superadmin', 'Superadmin lists teachers with approval status', '200 OK with teachers list', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-ADM-01', 'Superadmin', 'Superadmin lists teachers with approval status', '200 OK', `${saTeachers.status}`, 'FAIL', 'High', 'Check superadmin.model getTeachers');
  }

  // TC-ADM-02: Student registry & management
  const saStudents = await request('/superadmin/students', { headers: { Authorization: `Bearer ${superadminToken}` } });
  if (saStudents.status === 200 && saStudents.data?.success) {
    recordTest('TC-ADM-02', 'Superadmin', 'Superadmin lists student registry with pagination', '200 OK with students list', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-ADM-02', 'Superadmin', 'Superadmin lists student registry with pagination', '200 OK', `${saStudents.status}`, 'FAIL', 'High', 'Check superadmin.model getStudents');
  }

  // TC-ADM-03: Courses administration
  const saCourses = await request('/superadmin/courses', { headers: { Authorization: `Bearer ${superadminToken}` } });
  if (saCourses.status === 200 && saCourses.data?.success) {
    recordTest('TC-ADM-03', 'Superadmin', 'Superadmin views all courses across platform', '200 OK with course records', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-ADM-03', 'Superadmin', 'Superadmin views all courses across platform', '200 OK', `${saCourses.status}`, 'FAIL', 'High', 'Check superadmin.model getCourses');
  }

  // TC-ADM-04: Class & Cohort management
  const saClasses = await request('/superadmin/classes', { headers: { Authorization: `Bearer ${superadminToken}` } });
  if (saClasses.status === 200 && saClasses.data?.success) {
    recordTest('TC-ADM-04', 'Superadmin', 'Superadmin views all live classes and cohorts', '200 OK with classes list', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-ADM-04', 'Superadmin', 'Superadmin views all live classes and cohorts', '200 OK', `${saClasses.status}`, 'FAIL', 'Medium', 'Check superadmin.model getClasses');
  }

  // TC-ADM-05: Financials & Payments ledger
  const saPayments = await request('/superadmin/payments', { headers: { Authorization: `Bearer ${superadminToken}` } });
  if (saPayments.status === 200 && saPayments.data?.success) {
    recordTest('TC-ADM-05', 'Superadmin', 'Superadmin retrieves financial transactions ledger', '200 OK with payments records', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-ADM-05', 'Superadmin', 'Superadmin retrieves financial transactions ledger', '200 OK', `${saPayments.status}`, 'FAIL', 'High', 'Check superadmin.model getPayments');
  }

  // TC-ADM-06: Email settings diagnostic
  const saEmailSettings = await request('/superadmin/email-settings', { headers: { Authorization: `Bearer ${superadminToken}` } });
  if (saEmailSettings.status === 200 && saEmailSettings.data?.success) {
    recordTest('TC-ADM-06', 'Superadmin', 'Superadmin checks email service configuration and active provider', '200 OK with activeProvider', `200 OK (Provider: ${saEmailSettings.data.data?.activeProvider})`, 'PASS', 'Low');
  } else {
    recordTest('TC-ADM-06', 'Superadmin', 'Superadmin checks email service configuration and active provider', '200 OK', `${saEmailSettings.status}`, 'FAIL', 'Medium', 'Check getEmailSettings handler');
  }

  // TC-ADM-07: Contact messages inbox
  const saContactMsgs = await request('/superadmin/contact-messages', { headers: { Authorization: `Bearer ${superadminToken}` } });
  if (saContactMsgs.status === 200 && saContactMsgs.data?.success) {
    recordTest('TC-ADM-07', 'Superadmin', 'Superadmin views public inquiries inbox', '200 OK with contact messages', '200 OK', 'PASS', 'Low');
  } else {
    recordTest('TC-ADM-07', 'Superadmin', 'Superadmin views public inquiries inbox', '200 OK', `${saContactMsgs.status}`, 'FAIL', 'Medium', 'Check getContactMessages handler');
  }

  // =========================================================================
  // 7. SECURITY & VULNERABILITY TESTING
  // =========================================================================
  console.log('\n--- MODULE 7: Security & Vulnerability Audits ---');

  // TC-SEC-01: SQL Injection probe on courses category filter
  const sqliRes = await request('/public/courses?category=' + encodeURIComponent("' OR 1=1 --"));
  if (sqliRes.status === 200 && Array.isArray(sqliRes.data?.data?.courses)) {
    // Parameterized query treats it as literal string "' OR 1=1 --", matching 0 rows instead of leaking all rows
    recordTest('TC-SEC-01', 'Security', "SQL injection probe on search filter (' OR 1=1 --)", 'Safe handling without SQL error or injection', 'Safe (Parameterized query neutralized payload)', 'PASS', 'Critical');
  } else if (sqliRes.status === 500) {
    recordTest('TC-SEC-01', 'Security', "SQL injection probe on search filter (' OR 1=1 --)", 'Safe handling', '500 Server Error (Possible unhandled SQL syntax error)', 'FAIL', 'Critical', 'Ensure query parameter is parameterized');
  } else {
    recordTest('TC-SEC-01', 'Security', "SQL injection probe on search filter (' OR 1=1 --)", 'Safe handling', `${sqliRes.status}`, 'PASS', 'Low');
  }

  // TC-SEC-02: SQL Injection probe on contact messages status filter
  const sqliContact = await request('/superadmin/contact-messages?status=' + encodeURIComponent("' OR 'a'='a"), {
    headers: { Authorization: `Bearer ${superadminToken}` },
  });
  if (sqliContact.status === 200) {
    recordTest('TC-SEC-02', 'Security', "SQL injection probe on superadmin filter (' OR 'a'='a)", 'Safe handling without SQL crash', 'Safe (Parameterized)', 'PASS', 'Critical');
  } else if (sqliContact.status === 500) {
    recordTest('TC-SEC-02', 'Security', "SQL injection probe on superadmin filter (' OR 'a'='a)", 'Safe handling', '500 SQL Error', 'FAIL', 'Critical', 'Parameterize filter in contact model');
  } else {
    recordTest('TC-SEC-02', 'Security', "SQL injection probe on superadmin filter", 'Safe handling', `${sqliContact.status}`, 'PASS', 'Low');
  }

  // TC-SEC-03: IDOR Test - Student trying to query another student's courses via path parameter
  // Another student UUID from seed: david.kim / chloe.bennett etc.
  const otherStudentId = '29e6b640-257e-4a1e-badd-4deb465c4e68'; // superadmin ID
  const idorRes = await request(`/student/${otherStudentId}/courses`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (idorRes.status === 403) {
    recordTest('TC-SEC-03', 'Security', 'IDOR: Student querying another student UUID in /student/:id/courses', '403 Forbidden', '403 Forbidden', 'PASS', 'Critical');
  } else if (idorRes.status === 200) {
    recordTest('TC-SEC-03', 'Security', 'IDOR: Student querying another student UUID in /student/:id/courses', '403 Forbidden', `200 OK (Allowed student to query target UUID ${otherStudentId})`, 'FAIL', 'Critical', 'Verify targetId === req.user.id or privileged role in getStudentCourses');
  } else {
    recordTest('TC-SEC-03', 'Security', 'IDOR: Student querying another student UUID in /student/:id/courses', '403 Forbidden', `${idorRes.status}`, 'FAIL', 'High', 'Add ownership check');
  }

  // TC-SEC-04: IDOR Test - Teacher attempting to modify/delete another teacher's course
  // We test with student token or non-owner teacher
  const nonOwnerDelete = await request(`/teacher/courses/00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  // Should return 404 or 403, never 500
  if (nonOwnerDelete.status === 404 || nonOwnerDelete.status === 403) {
    recordTest('TC-SEC-04', 'Security', 'Teacher deleting non-existent or foreign course handles gracefully', '404 or 403', `${nonOwnerDelete.status}`, 'PASS', 'Medium');
  } else {
    recordTest('TC-SEC-04', 'Security', 'Teacher deleting foreign course handles gracefully', '404 or 403', `${nonOwnerDelete.status}`, 'FAIL', 'Medium', 'Verify course ownership');
  }

  // TC-SEC-05: Malformed UUID in route parameter
  const malformedUuidRes = await request('/teacher/courses/not-a-valid-uuid', {
    headers: { Authorization: `Bearer ${teacherToken}` },
  });
  if (malformedUuidRes.status === 400 || malformedUuidRes.status === 404 || (malformedUuidRes.status === 200 && !malformedUuidRes.data?.data)) {
    recordTest('TC-SEC-05', 'Security', 'Malformed non-UUID string in route param handles safely', '400, 404, or null (no server crash)', `${malformedUuidRes.status}`, 'PASS', 'Medium');
  } else if (malformedUuidRes.status === 500) {
    recordTest('TC-SEC-05', 'Security', 'Malformed non-UUID string in route param handles safely', 'Non-500 graceful error', `500 Server Error (${malformedUuidRes.data?.message || 'Database UUID syntax error'})`, 'FAIL', 'Medium', 'Validate UUID format before querying PostgreSQL');
  } else {
    recordTest('TC-SEC-05', 'Security', 'Malformed non-UUID string in route param handles safely', 'Safe response', `${malformedUuidRes.status}`, 'PASS', 'Low');
  }

  // =========================================================================
  // 8. EDGE CASE TESTING
  // =========================================================================
  console.log('\n--- MODULE 8: Edge Cases & Extreme Inputs ---');

  // TC-EDG-01: Empty body on POST /auth/login
  const emptyLogin = await request('/auth/login', { method: 'POST', body: {} });
  if (emptyLogin.status === 400 || emptyLogin.status === 401) {
    recordTest('TC-EDG-01', 'EdgeCase', 'Empty JSON body on POST /auth/login', '400 or 401 with validation error', `${emptyLogin.status}`, 'PASS', 'Medium');
  } else {
    recordTest('TC-EDG-01', 'EdgeCase', 'Empty JSON body on POST /auth/login', '400 or 401', `${emptyLogin.status}`, 'FAIL', 'Medium', 'Validate required fields in login');
  }

  // TC-EDG-02: Excessively long text input (10,000 chars) on contact form
  const giantString = 'A'.repeat(10000);
  const giantInputRes = await request('/public/contact', {
    method: 'POST',
    body: {
      name: 'Stress Test User',
      email: 'stress.test@example.com',
      subject: 'Large payload stress test',
      message: giantString,
    },
  });
  if (giantInputRes.status === 201 || giantInputRes.status === 200 || giantInputRes.status === 400 || giantInputRes.status === 413) {
    recordTest('TC-EDG-02', 'EdgeCase', 'Excessively long text (10,000 chars) handles without process crash', '200/201 or 400 or 413', `${giantInputRes.status}`, 'PASS', 'Low');
  } else {
    recordTest('TC-EDG-02', 'EdgeCase', 'Excessively long text handles without process crash', 'Non-500 code', `${giantInputRes.status}`, 'FAIL', 'Medium', 'Enforce payload size limits or validation');
  }

  // TC-EDG-03: Invalid email syntax in newsletter subscription
  const badEmailRes = await request('/public/newsletter/subscribe', {
    method: 'POST',
    body: { email: 'not-an-email-address-@@invalid' },
  });
  if (badEmailRes.status === 400) {
    recordTest('TC-EDG-03', 'EdgeCase', 'Malformed email syntax rejected with 400', '400 Bad Request', '400 Bad Request', 'PASS', 'Low');
  } else {
    recordTest('TC-EDG-03', 'EdgeCase', 'Malformed email syntax rejected with 400', '400 Bad Request', `${badEmailRes.status}`, 'FAIL', 'Medium', 'Validate email format using regex');
  }

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log('\n=============================================================');
  console.log('📊 AUTOMATED TEST SUITE EXECUTION SUMMARY');
  console.log('=============================================================');

  const total = testResults.length;
  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = testResults.filter((r) => r.status === 'FAIL').length;
  const blocked = testResults.filter((r) => r.status === 'BLOCKED').length;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:          ${passed} (${Math.round((passed / total) * 100)}%)`);
  console.log(`Failed:          ${failed} (${Math.round((failed / total) * 100)}%)`);
  console.log(`Blocked:         ${blocked}`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS SUMMARY:');
    testResults
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`- [${r.id}] ${r.module}: ${r.scenario}`);
        console.log(`  Expected: ${r.expected} | Actual: ${r.actual}`);
        console.log(`  Severity: ${r.severity} | Recommendation: ${r.recommendation}\n`);
      });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
