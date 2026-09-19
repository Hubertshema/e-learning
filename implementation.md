# MASTER DEVELOPMENT PROMPT

## English Learning & Teacher Management Platform

Build a complete, production-ready web platform for teaching and learning English.

The platform must support exactly three user roles:

1. SUPERADMIN
2. TEACHER
3. STUDENT

The platform should combine structured English learning, teacher-led education, interactive activities, assessments, student progress tracking, and teacher-controlled paid course access.

Use modern learning-platform patterns inspired by professional language-learning platforms, but DO NOT copy any company's branding, copyrighted content, visual identity, logos, text, or exact UI. Create an original product identity and interface.

---

# 1. TECHNOLOGY STACK

## FRONTEND

Build the frontend as a separate application using:

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Responsive design
* Mobile-first principles

The frontend is responsible for:

* User interface
* Navigation
* Forms
* Dashboards
* Learning interface
* Client-side state
* API communication
* Displaying validation and server responses

The frontend MUST communicate with the backend through REST APIs.

Do NOT place core business logic inside Next.js.

Do NOT use Next.js API routes as the primary backend.

Do NOT use Next.js Route Handlers as the application's backend API.

Next.js is the frontend application only.

---

# 2. BACKEND — NODE.JS

The backend MUST be developed as a completely separate Node.js application.

Use:

* Node.js
* Express.js
* TypeScript
* REST API architecture
* Prisma ORM
* PostgreSQL
* Zod validation
* JWT authentication
* Refresh-token authentication
* Service/repository architecture

Recommended backend structure:

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── validators/
│   ├── utils/
│   ├── types/
│   ├── modules/
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── tests/
├── .env.example
├── package.json
└── tsconfig.json
```

The backend must contain the business logic for:

* Authentication
* Authorization
* Users
* Teachers
* Students
* Courses
* Classes
* Enrollments
* Payments
* Units
* Lessons
* Activities
* Assignments
* Quizzes
* Attendance
* Progress
* Certificates
* Notifications
* Reports
* Audit logs
* Placement tests

---

# 3. FRONTEND + BACKEND ARCHITECTURE

Use this architecture:

```text
english-learning-platform/
│
├── frontend/
│   ├── Next.js
│   ├── React
│   ├── TypeScript
│   ├── Tailwind CSS
│   └── shadcn/ui
│
└── backend/
    ├── Node.js
    ├── Express.js
    ├── TypeScript
    ├── Prisma
    └── PostgreSQL
```

Architecture:

```text
Browser
   │
   ▼
Next.js Frontend
   │
   │ HTTPS REST API
   ▼
Node.js + Express Backend
   │
   ▼
Service Layer
   │
   ▼
Repository / Prisma
   │
   ▼
PostgreSQL
```

The frontend MUST NOT directly access PostgreSQL.

The frontend MUST NOT contain database credentials.

The frontend MUST NOT implement authoritative business rules.

The backend is the single source of truth for:

* Authentication
* Authorization
* Enrollment
* Payment
* Course access
* Progress
* Grades
* Permissions
* Business rules

---

# 4. DATABASE

Use:

* PostgreSQL
* Prisma ORM

The PostgreSQL database must be accessed ONLY by the Node.js backend.

The Next.js frontend must never connect directly to PostgreSQL.

Use Prisma migrations.

Use:

```text
prisma migrate dev
prisma migrate deploy
prisma db seed
```

where appropriate.

Use:

* UUIDs where appropriate
* Foreign keys
* Unique constraints
* Indexes
* Timestamps
* Status enums
* Soft deletion where appropriate

---

# 5. REST API

Create a versioned REST API.

Base URL example:

```text
/api/v1
```

Organize APIs by resource.

Example:

```text
/api/v1/auth
/api/v1/users
/api/v1/teachers
/api/v1/students
/api/v1/courses
/api/v1/classes
/api/v1/enrollments
/api/v1/payments
/api/v1/units
/api/v1/lessons
/api/v1/activities
/api/v1/assignments
/api/v1/quizzes
/api/v1/attendance
/api/v1/progress
/api/v1/certificates
/api/v1/notifications
/api/v1/reports
/api/v1/audit-logs
/api/v1/placement-tests
```

Use proper HTTP methods:

* GET
* POST
* PATCH
* PUT where appropriate
* DELETE where appropriate

Use consistent JSON responses.

Example success response:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

Example error response:

```json
{
  "success": false,
  "message": "Unable to approve payment",
  "code": "PAYMENT_APPROVAL_FAILED"
}
```

Do not expose stack traces or sensitive technical information to clients.

---

# 6. API DOCUMENTATION

Create API documentation using:

* Swagger
* OpenAPI

Document:

* Authentication
* Endpoints
* Request bodies
* Response structures
* Error responses
* Authorization requirements
* Example requests
* Example responses

The backend should expose API documentation in development.

Example:

```text
/api/docs
```

---

# 7. AUTHENTICATION

Do NOT use Auth.js as the backend authentication system.

Authentication must be handled by the Node.js/Express backend.

Implement:

* Email/password registration
* Login
* Logout
* Password hashing
* Email verification architecture
* Password reset
* JWT access tokens
* Refresh tokens
* Token rotation
* Token revocation
* Session management

Use a secure password hashing algorithm such as:

* Argon2
  or
* bcrypt

Recommended token architecture:

```text
Access Token
Short-lived
        +
Refresh Token
Long-lived
```

The backend issues the tokens.

The frontend uses the backend authentication API.

Never store passwords in plain text.

Never expose JWT secrets to the frontend.

---

# 8. AUTHENTICATION API

Create endpoints such as:

```text
POST /api/v1/auth/register/student
POST /api/v1/auth/register/teacher

POST /api/v1/auth/login
POST /api/v1/auth/logout

POST /api/v1/auth/refresh

POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

POST /api/v1/auth/verify-email

GET /api/v1/auth/me
```

Superadmin registration must NOT be publicly available.

Create the initial Superadmin through secure seed/setup configuration.

---

# 9. FRONTEND API CLIENT

Create a centralized API client in Next.js.

For example:

```text
frontend/src/lib/api/
```

Create reusable API functions for:

* Authentication
* Courses
* Students
* Teachers
* Payments
* Enrollments
* Lessons
* Assignments
* Quizzes
* Progress
* Certificates
* Notifications

Do NOT scatter raw `fetch()` calls throughout components.

Use a centralized API layer.

Handle:

* Authentication
* Access tokens
* Refresh tokens
* API errors
* Loading states
* Unauthorized responses
* Network errors

---

# 10. THREE USER ROLES

There must be exactly three roles:

```text
SUPERADMIN
TEACHER
STUDENT
```

Implement strict role-based access control in the Node.js backend.

A user must never access another role's protected functionality.

Frontend route protection is helpful for UX but MUST NOT be treated as security.

The backend must verify permissions for every protected operation.

---

# 11. PRODUCT PURPOSE

The platform allows teachers to provide structured English education from beginner to advanced levels.

Support:

* Beginner English
* Intermediate English
* Advanced English

Use CEFR:

* Pre-A1
* A1
* A2
* B1
* B2
* C1
* C2

Teach:

* Grammar
* Vocabulary
* Reading
* Listening
* Speaking
* Writing
* Pronunciation
* Communication
* Real-life English

Combine:

Teacher-led learning
+
Self-paced learning
+
Practice
+
Assignments
+
Assessments
+
Progress tracking

---

# 12. SUPERADMIN

The Superadmin controls the entire platform.

Dashboard:

* Total teachers
* Active teachers
* Pending teachers
* Total students
* Active students
* Total courses
* Active courses
* Total enrollments
* Active enrollments
* Pending payments
* Approved payments
* Revenue
* Expired enrollments
* Recent activities

Charts:

* Student growth
* Teacher growth
* Course enrollments
* Payments
* Revenue
* Learning activity

All dashboard statistics must come from real backend API data.

Do NOT use hardcoded dashboard numbers.

---

# 13. SUPERADMIN TEACHER MANAGEMENT

Superadmin can:

* View teachers
* Search
* Filter
* View profiles
* Approve registrations
* Reject registrations
* Suspend
* Activate
* Deactivate
* Reset accounts
* View classes
* View students
* View courses
* View payments
* View performance

Teacher statuses:

```text
PENDING
APPROVED
REJECTED
SUSPENDED
ACTIVE
INACTIVE
```

Only approved/active teachers can operate normally.

All status changes must be processed by the backend.

---

# 14. SUPERADMIN STUDENT MANAGEMENT

Superadmin can:

* View students
* Search
* Filter
* View profiles
* View courses
* View payments
* View progress
* View assessment results
* View attendance
* Suspend
* Activate
* Deactivate
* Reset accounts

Protect student privacy.

Superadmin access must still be authorized through backend permissions.

---

# 15. SUPERADMIN COURSE MANAGEMENT

Superadmin can:

* Create courses
* Edit courses
* Publish
* Unpublish
* Archive
* Delete where safe
* Assign CEFR level
* Manage objectives
* Manage units
* Manage lessons
* Manage activities
* Manage assessments
* Manage materials

Courses may be:

* Platform courses
* Teacher-created courses

---

# 16. SUPERADMIN PAYMENT MANAGEMENT

Superadmin can:

* View payments
* Search
* Filter
* View payment details
* View proof
* View student
* View teacher
* View course
* View amount
* View payment date
* View payment method
* View transaction/reference number

Payment statuses:

```text
PENDING
SUBMITTED
VERIFIED
REJECTED
REFUNDED
CANCELLED
```

MVP:

Manual payment verification.

Future architecture:

* MTN Mobile Money
* Airtel Money
* Bank payments
* Online payment gateways

Do not make payment gateway integration mandatory for MVP.

---

# 17. TEACHER DASHBOARD

Teacher dashboard:

* My Classes
* My Students
* My Courses
* Pending Payments
* Active Students
* Expiring Students
* Assignments
* Quizzes
* Attendance
* Student Progress
* Reports

All information must come from real backend APIs.

---

# 18. TEACHER CLASS MANAGEMENT

Teacher can create classes.

Fields:

* Class name
* Description
* CEFR level
* Start date
* End date
* Schedule
* Duration
* Maximum students
* Teacher
* Status

Statuses:

```text
DRAFT
OPEN
ACTIVE
COMPLETED
ARCHIVED
```

Teacher can:

* Add students
* Invite students
* Remove students
* View students
* View progress
* Mark attendance
* Assign lessons
* Assign assignments
* Assign quizzes

Backend must verify that the teacher owns the class.

---

# 19. COURSE MANAGEMENT

Teacher can create courses.

Fields:

* Title
* Description
* Level
* Objectives
* Duration
* Course image
* Price
* Currency
* Status

Structure:

```text
Course
  ↓
Units
  ↓
Lessons
  ↓
Activities
  ↓
Practice
  ↓
Assessment
```

---

# 20. LESSON BUILDER

Teacher can create lessons containing:

* Text
* Images
* Audio
* Video
* Vocabulary
* Grammar
* Examples
* Exercises
* Questions
* Speaking activities
* Listening activities
* Reading activities
* Writing activities

Each lesson:

* Title
* Description
* Objectives
* Level
* Estimated duration
* Content
* Activities
* Resources
* Assessment

Teacher should be able to reorder sections where practical.

---

# 21. ENGLISH SKILLS

Support:

## Reading

* Passages
* Questions
* Vocabulary
* Comprehension

## Listening

* Audio
* Questions
* Multiple choice
* True/false
* Fill blanks

## Speaking

* Conversation prompts
* Role-play
* Picture description
* Question responses
* Pronunciation

## Writing

* Sentences
* Paragraphs
* Guided writing
* Free writing
* Teacher feedback

## Grammar

* Explanations
* Examples
* Exercises
* Quizzes

## Vocabulary

* Word lists
* Flashcards
* Matching
* Definitions
* Sentence creation

## Pronunciation

* Word pronunciation
* Sentence pronunciation
* Listening/repeating
* Teacher feedback

---

# 22. INTERACTIVE ACTIVITIES

Support reusable activity components:

* Multiple choice
* True/False
* Fill in the blank
* Matching
* Drag and drop
* Sentence ordering
* Flashcards
* Vocabulary cards
* Listening quiz
* Reading comprehension
* Spelling
* Word search
* Crossword
* Picture description
* Conversation cards
* Random questions

Save student results through the backend.

---

# 23. PAYMENT AND COURSE ACCESS

A student MUST NOT receive paid-course access merely by registering.

Workflow:

```text
Student registers
        ↓
Views course
        ↓
Requests enrollment
        ↓
Views payment instructions
        ↓
Pays teacher
        ↓
Submits payment information/proof
        ↓
Teacher reviews
        ↓
Teacher approves
        ↓
Payment becomes VERIFIED
        ↓
Enrollment becomes ACTIVE
        ↓
Student receives access
```

The backend must enforce this workflow.

Never allow the frontend to directly activate an enrollment.

---

# 24. ENROLLMENT STATUS

Use:

```text
PENDING_PAYMENT
PAYMENT_SUBMITTED
PENDING_APPROVAL
ACTIVE
SUSPENDED
EXPIRED
REJECTED
COMPLETED
CANCELLED
```

Do NOT use only:

```text
paid = true
```

Enrollment must have a complete lifecycle.

---

# 25. PAYMENT MODEL

Payment contains:

* Student
* Teacher
* Course
* Enrollment
* Amount
* Currency
* Payment method
* Transaction/reference number
* Proof file
* Payment date
* Status
* Verification date
* Verified by
* Rejection reason
* Notes

Payment and Enrollment MUST be separate entities.

Relationship:

```text
Payment
   ↓
Enrollment
   ↓
Course Access
```

---

# 26. PAYMENT APPROVAL

Teacher sees:

* Student
* Course
* Amount
* Method
* Reference
* Proof
* Date
* Status

Actions:

* Approve
* Reject
* Request clarification

When approved:

```text
Payment = VERIFIED
Enrollment = ACTIVE
```

When rejected:

```text
Payment = REJECTED
Enrollment remains inactive
```

Use a backend database transaction so payment verification and enrollment activation remain consistent.

---

# 27. COURSE EXPIRATION

Support:

* Course duration
* Start date
* Expiry date

When enrollment expires:

```text
ACTIVE → EXPIRED
```

Expired students cannot access protected course content.

The student account remains active.

Do not delete the student.

Support renewal.

The backend must enforce expiry even if the frontend attempts to access protected content.

---

# 28. STUDENT INVITATION

Teachers can:

### Option 1

Student requests enrollment.

### Option 2

Teacher sends invitation.

### Option 3

Teacher generates enrollment code.

Example:

```text
A1-2026-AB82
```

The student enters the code and requests enrollment.

Teacher still controls payment approval.

---

# 29. STUDENT DASHBOARD

Display:

* Current level
* Active courses
* Course progress
* Current unit
* Current lesson
* Upcoming assignments
* Assessments
* Results
* Teacher feedback
* Attendance
* Expiry date

Use real API data.

---

# 30. STUDENT LEARNING JOURNEY

Implement:

```text
Placement Test
      ↓
Recommended Level
      ↓
Course Enrollment
      ↓
Unit
      ↓
Lesson
      ↓
Practice
      ↓
Teacher Activity
      ↓
Assignment
      ↓
Assessment
      ↓
Feedback
      ↓
Progress
      ↓
Next Lesson
```

---

# 31. PLACEMENT TEST

Assess:

* Grammar
* Vocabulary
* Reading
* Listening

Future support:

* Speaking
* Writing

After completion:

* Score
* Suggested CEFR level
* Skill breakdown
* Recommended course

The placement result is a recommendation.

Teacher determines actual starting course.

---

# 32. STUDENT PROGRESS

Track:

* Course progress
* Unit progress
* Lesson completion
* Activity completion
* Quiz results
* Assignment results
* Attendance
* Skill performance
* Learning time
* Assessment history

Skills:

* Reading
* Listening
* Speaking
* Writing
* Grammar
* Vocabulary
* Pronunciation

Progress must be persisted in PostgreSQL through the Node.js backend.

---

# 33. TEACHER STUDENT PROFILE

Teacher can view:

* Student information
* Current level
* Courses
* Payment status
* Enrollment status
* Progress
* Assignment results
* Quiz results
* Attendance
* Skill performance
* Notes
* Feedback

Teacher actions:

* Assign lesson
* Assign assignment
* Assign quiz
* Mark attendance
* Give feedback
* Extend access
* Suspend access
* Renew enrollment

Backend must verify that the teacher has permission to manage that student.

---

# 34. ASSIGNMENTS

Types:

* Writing
* Reading
* Vocabulary
* Grammar
* Listening
* Speaking

Fields:

* Title
* Description
* Instructions
* Course
* Lesson
* Due date
* Maximum score
* Attachments

Student:

* View
* Submit text
* Upload file
* Submit answer
* View status

Teacher:

* Review
* Grade
* Feedback
* Return

Statuses:

```text
NOT_STARTED
IN_PROGRESS
SUBMITTED
GRADED
LATE
```

---

# 35. QUIZ SYSTEM

Support:

* Multiple choice
* True/False
* Fill blank
* Matching
* Ordering

Fields:

* Title
* Instructions
* Time limit
* Attempts
* Passing score
* Questions
* Correct answers

Student receives:

* Score
* Percentage
* Pass/fail
* Feedback where appropriate

---

# 36. ATTENDANCE

Statuses:

```text
PRESENT
ABSENT
LATE
EXCUSED
```

Track:

* Student
* Class
* Date
* Lesson

Student can see attendance history.

---

# 37. CERTIFICATES

Generate certificates when requirements are met.

Certificate:

* Student name
* Course
* Level
* Completion date
* Teacher
* Certificate number
* Platform name
* Verification mechanism

Verification:

```text
/verify/certificate/ABC123
```

Certificate verification must be publicly accessible only for verification information that is intended to be public.

---

# 38. NOTIFICATIONS

In-app notifications.

Teacher:

* Enrollment request
* Payment submitted
* Assignment submitted
* Quiz completed
* Course expiring

Student:

* Enrollment approved
* Payment approved
* Lesson assigned
* Assignment created
* Assignment graded
* Feedback received
* Course expiring

Notifications must be created through backend services.

---

# 39. EMAIL ARCHITECTURE

Keep email services separate from business logic.

Support future events:

* Welcome
* Verification
* Password reset
* Teacher approval
* Enrollment approval
* Payment submission
* Payment approval
* Payment rejection
* Assignment notification
* Expiration warning
* Certificate issued

Use a dedicated email service layer.

Possible future provider:

* Resend
* SMTP
* Other transactional email provider

---

# 40. AI — FUTURE READY

Do not make AI the first core feature.

Prepare modular architecture for:

* AI conversation
* AI writing assistant
* AI vocabulary practice
* AI study recommendations
* AI pronunciation

AI functionality must be isolated from core learning/payment/authentication modules.

---

# 41. PROFESSIONAL ENGLISH

Support:

* Business English
* English for Teachers
* English for Students
* English for IT
* English for Healthcare
* English for Hospitality
* Interview English
* Academic English
* Communication English

Use the same course architecture.

---

# 42. ENGLISH FOR RWANDA

Support an optional category:

English for Rwanda

Potential content:

* Everyday communication
* School English
* Workplace English
* Customer service
* Business communication
* Job interviews
* Academic communication

Do not hard-code the system exclusively for Rwanda.

---

# 43. DATABASE MODELS

At minimum:

```text
User
TeacherProfile
StudentProfile
Course
CourseLevel
Class
Enrollment
Payment
Unit
Lesson
LessonSection
Activity
ActivityQuestion
Assignment
AssignmentSubmission
Quiz
QuizQuestion
QuizAttempt
Attendance
Progress
SkillProgress
TeacherFeedback
Notification
Certificate
CertificateVerification
File
AuditLog
PlacementTest
PlacementQuestion
PlacementAttempt
```

Add supporting models when necessary.

Use appropriate relations.

---

# 44. DATABASE RELATIONSHIPS

Implement relationships similar to:

```text
User
├── TeacherProfile
└── StudentProfile

Teacher
├── Classes
├── Courses
├── Students
└── Payments

Student
├── Enrollments
├── Payments
├── Assignments
├── QuizAttempts
├── Attendance
└── Progress

Course
├── Units
├── Lessons
├── Activities
├── Assignments
└── Quizzes

Enrollment
├── Student
├── Teacher
├── Course
└── Payment History
```

Use proper foreign-key constraints.

---

# 45. SECURITY

Implement production-level backend security.

Requirements:

* Password hashing
* JWT authentication
* Refresh-token security
* Token rotation
* Token revocation
* Role-based authorization
* Server-side authorization
* Zod validation
* Rate limiting
* CORS configuration
* Secure HTTP headers
* Secure cookies where applicable
* Input sanitization where appropriate
* Secure file uploads
* File type validation
* File size limits
* Protection against unauthorized course access
* Protection against IDOR
* Protection against unauthorized student data access
* Protection against unauthorized teacher data access

Use middleware such as:

```text
authenticate()
authorize()
validate()
```

Never rely only on frontend authorization.

---

# 46. CORS

Because frontend and backend are separate applications, configure CORS correctly.

Example:

```text
Frontend:
https://your-frontend-domain.com

Backend:
https://your-api-domain.com
```

Only trusted frontend origins should be allowed.

Do not use unrestricted:

```text
Access-Control-Allow-Origin: *
```

for authenticated production APIs.

---

# 47. COURSE ACCESS SECURITY

For a request such as:

```text
GET /api/v1/courses/:courseId/learning
```

the backend must verify:

1. Student is authenticated.
2. Student has enrollment.
3. Enrollment belongs to the authenticated student.
4. Enrollment status is ACTIVE.
5. Enrollment has not expired.
6. Course is available.
7. Student has permission to access the requested content.

If any condition fails:

Do not return protected course content.

Never rely on frontend button visibility.

---

# 48. FILE MANAGEMENT

Teachers can upload:

* PDFs
* Images
* Audio
* Video
* Documents

Backend must implement:

* File validation
* File size limits
* MIME validation
* Secure storage
* Ownership
* Access control

Use Cloudinary or S3-compatible storage for large files.

Do not store large media directly in PostgreSQL.

Students can access only authorized files.

---

# 49. UI/UX

Create a modern professional education platform.

Principles:

* Clean
* Modern
* Friendly
* Educational
* Professional
* Accessible
* Responsive
* Fast

Use:

* Cards
* Tables
* Tabs
* Modals
* Dropdowns
* Progress bars
* Charts
* Badges
* Alerts
* Toasts
* Empty states
* Loading states
* Skeleton loaders

Avoid clutter.

---

# 50. PUBLIC WEBSITE

Create:

```text
/
/about
/courses
/levels
/teachers
/pricing
```

Hero:

> Learn English. Build Confidence. Communicate Better.

Buttons:

* Start Learning
* Become a Teacher

Display:

Pre-A1 → C2

Skills:

* Reading
* Listening
* Speaking
* Writing
* Grammar
* Vocabulary
* Pronunciation

How it works:

```text
Create account
↓
Find course
↓
Enroll
↓
Complete payment
↓
Teacher activates access
↓
Start learning
↓
Track progress
```

---

# 51. AUTHENTICATION PAGES

Frontend:

```text
/login
/register
/forgot-password
/reset-password
/verify-email
```

Registration options:

```text
Register as Teacher
Register as Student
```

Superadmin registration must not be publicly available.

---

# 52. ROUTE STRUCTURE

Frontend routes:

```text
/
/about
/courses
/levels
/teachers
/pricing

/auth/login
/auth/register
/auth/forgot-password
/auth/reset-password
/auth/verify-email

/superadmin
/superadmin/teachers
/superadmin/students
/superadmin/courses
/superadmin/payments
/superadmin/enrollments
/superadmin/reports
/superadmin/settings
/superadmin/audit-logs

/teacher
/teacher/classes
/teacher/students
/teacher/courses
/teacher/lessons
/teacher/assignments
/teacher/quizzes
/teacher/attendance
/teacher/payments
/teacher/progress
/teacher/reports
/teacher/settings

/student
/student/courses
/student/learning
/student/assignments
/student/quizzes
/student/progress
/student/results
/student/certificates
/student/payments
/student/settings
```

Backend routes should use:

```text
/api/v1/...
```

and should NOT mirror frontend page routes unnecessarily.

---

# 53. REPORTING

Superadmin:

* Students
* Teachers
* Enrollments
* Courses
* Payments
* Revenue
* Completion
* Teacher activity

Teacher:

* Student progress
* Class performance
* Attendance
* Assignments
* Quizzes
* Completion
* Payment status

Student:

* Course progress
* Skills
* Quiz results
* Assignment results
* Attendance
* Certificates

Reports must use optimized backend queries.

---

# 54. AUDIT LOG

Record:

* Teacher approval
* Teacher suspension
* Student suspension
* Course creation
* Course publication
* Payment approval
* Payment rejection
* Enrollment activation
* Enrollment suspension
* Enrollment extension
* Grade changes

Audit record:

* User
* Action
* Entity
* Entity ID
* Timestamp
* IP where appropriate
* Metadata

Audit logging must happen server-side.

---

# 55. RESPONSIVE DESIGN

Support:

* Desktop
* Laptop
* Tablet
* Mobile

Student learning pages should be optimized especially for mobile.

---

# 56. ACCESSIBILITY

Implement:

* Keyboard navigation
* Semantic HTML
* Proper labels
* Focus states
* Accessible forms
* Screen-reader support
* Accessible errors
* Sufficient contrast

---

# 57. PERFORMANCE

Optimize:

* PostgreSQL queries
* Prisma queries
* API response sizes
* Pagination
* Indexes
* Server rendering
* Images
* Audio/video
* Lazy loading
* Caching where appropriate

Use pagination for:

* Teachers
* Students
* Payments
* Courses
* Activities
* Audit logs

Never return thousands of records unnecessarily.

---

# 58. ERROR HANDLING

Backend must have centralized error handling.

Create:

```text
errorHandler()
```

Use consistent API errors.

Technical errors should be logged server-side.

Users should receive friendly messages.

Example:

Instead of:

```text
PrismaClientKnownRequestError
```

return:

```text
Unable to approve this payment. Please try again.
```

---

# 59. SEED DATA

Create development seed data.

One:

```text
SUPERADMIN
```

Two:

```text
TEACHER
```

Three:

```text
STUDENT
```

Courses:

* Pre-A1 Starter English
* A1 Beginner English
* A2 Elementary English
* B1 Intermediate English
* B2 Upper Intermediate English
* C1 Advanced English

Include sample:

* Units
* Lessons
* Vocabulary
* Grammar
* Reading
* Listening
* Speaking
* Writing
* Quizzes

Seed data must be created through Prisma.

---

# 60. TESTING

Testing is mandatory.

## Backend unit tests

Test:

* Authentication services
* Enrollment services
* Payment services
* Course access rules
* Progress calculations
* Assignment grading
* Quiz scoring

Use:

* Jest

## Backend API tests

Use:

* Supertest

Test:

* Authentication
* Authorization
* API validation
* Payment workflow
* Enrollment workflow
* Course access
* Student privacy
* Teacher ownership

## Frontend tests

Test important UI components and API integration.

## E2E tests

Use:

* Playwright

Test real workflows across frontend + backend.

---

# 61. CRITICAL WORKFLOW TESTS

### Authentication

Test:

* Student registration
* Teacher registration
* Login
* Logout
* Password reset
* Invalid login
* Email verification architecture

### Authorization

Test:

Student cannot access Teacher dashboard.

Student cannot access Superadmin API.

Teacher cannot access Superadmin API.

Teacher cannot access another teacher's private resources.

Student cannot access another student's data.

### Payment

Test:

```text
Student requests enrollment
↓
Student submits payment
↓
Teacher sees payment
↓
Teacher approves
↓
Payment = VERIFIED
↓
Enrollment = ACTIVE
↓
Student gets access
```

Also test rejection.

### Expiration

Verify:

```text
ACTIVE → EXPIRED
```

Verify protected content is blocked.

Verify student account remains active.

### Learning

Test:

```text
Course
↓
Unit
↓
Lesson
↓
Activity
↓
Quiz
↓
Progress
```

### Assignment

Test:

```text
Teacher creates
↓
Student submits
↓
Teacher grades
↓
Student sees grade
```

### Attendance

Test:

```text
Teacher marks attendance
↓
Student sees attendance
```

### Certificate

Test:

```text
Student completes requirements
↓
Certificate generated
↓
Verification works
```

---

# 62. DEVELOPMENT PHASES

Implement sequentially.

Do not jump randomly between phases.

## PHASE 1 — FOUNDATION

### Frontend

Implement:

* Next.js
* React
* TypeScript
* Tailwind
* shadcn/ui
* Basic layouts
* Authentication pages
* API client
* Protected frontend routes
* Basic dashboards

### Backend

Implement:

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* Prisma
* Database schema foundation
* JWT authentication
* Refresh tokens
* Password hashing
* Authentication APIs
* User model
* Role model
* RBAC middleware
* Error handling
* Validation
* CORS
* Rate limiting foundation
* API documentation

Test completely before continuing.

---

# 63. PHASE 2 — SUPERADMIN

Implement backend APIs and frontend interfaces for:

* Superadmin dashboard
* Teacher management
* Student management
* Course management
* Payment management
* Enrollment management
* Settings
* Audit logs
* Reports

Test completely before continuing.

---

# 64. PHASE 3 — TEACHER

Implement:

* Teacher dashboard
* Class management
* Course creation
* Lesson builder
* Student management
* Payment approval
* Enrollment activation
* Attendance
* Assignments
* Quizzes

Build both:

```text
Node.js API
+
Next.js interface
```

Test completely before continuing.

---

# 65. PHASE 4 — STUDENT

Implement:

* Student dashboard
* Course browsing
* Enrollment requests
* Payment submission
* Course access
* Learning journey
* Lessons
* Activities
* Assignments
* Quizzes
* Results
* Progress

Test completely before continuing.

---

# 66. PHASE 5 — LEARNING SYSTEM

Implement:

* CEFR levels
* Skills
* Placement tests
* Interactive activities
* Progress tracking
* Skill tracking
* Teacher feedback
* Reports

Test completely before continuing.

---

# 67. PHASE 6 — CERTIFICATES & NOTIFICATIONS

Implement:

* Certificates
* Verification
* Notifications
* Email architecture
* Expiration notifications

Test completely before continuing.

---

# 68. PHASE 7 — ADVANCED FEATURES

Only after the core platform is stable:

* AI conversation
* AI writing assistance
* AI pronunciation
* Personalized recommendations
* Advanced analytics
* Live classes
* Payment gateway integrations
* Mobile application

---

# 69. DEVELOPMENT RULE

After every phase:

1. Run frontend.
2. Run backend.
3. Check database.
4. Run migrations.
5. Run automated tests.
6. Run API tests.
7. Test important workflows manually.
8. Test frontend/backend communication.
9. Test responsive design.
10. Test authorization.
11. Check database integrity.
12. Check browser console.
13. Check backend logs.
14. Fix errors.
15. Re-test existing functionality.
16. Only then move to the next phase.

Never proceed to the next phase when critical functionality is broken.

---

# 70. CODE QUALITY

## Frontend

Use:

* TypeScript strict mode
* Reusable components
* API service layer
* Proper loading states
* Proper error states
* Form validation
* Clean component architecture

## Backend

Use:

* TypeScript strict mode
* Controllers
* Services
* Repositories
* Validators
* Middleware
* DTO/request validation
* Centralized errors
* Reusable utilities
* Modular architecture

Recommended flow:

```text
Route
 ↓
Middleware
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
Prisma
 ↓
PostgreSQL
```

Controllers should remain thin.

Business logic belongs primarily in services.

Database access belongs in repositories/services rather than being scattered through route handlers.

Avoid:

* Massive files
* Duplicate code
* Hardcoded business rules
* Hardcoded users
* Frontend-only authorization
* Plain-text passwords
* Direct frontend database access
* Large media in PostgreSQL
* Secrets in source code

---

# 71. ENVIRONMENT VARIABLES

## Frontend `.env.example`

Include:

```text
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_URL=
```

Do not put backend secrets in the frontend environment.

## Backend `.env.example`

Include:

```text
NODE_ENV=
PORT=
DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

ACCESS_TOKEN_EXPIRES_IN=
REFRESH_TOKEN_EXPIRES_IN=

FRONTEND_URL=

STORAGE_PROVIDER=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

EMAIL_SERVER=
EMAIL_FROM=
```

Never commit real secrets.

---

# 72. DEPLOYMENT ARCHITECTURE

Prepare for separate deployment.

## Frontend

Deploy Next.js to:

* Vercel

## Backend

Deploy Node.js/Express to:

* Render
* Railway
* Fly.io
* or another suitable Node.js hosting provider

## Database

Use:

* Supabase
* Neon
* PostgreSQL hosting

## File storage

Use:

* Cloudinary
* S3-compatible storage

Architecture:

```text
User
 ↓
Vercel
 ↓
Next.js Frontend
 ↓ HTTPS
Node.js + Express API
 ↓
Prisma
 ↓
PostgreSQL
```

---

# 73. DOCUMENTATION

Create:

```text
README.md
```

Document:

* Project overview
* Architecture
* Frontend setup
* Backend setup
* Database setup
* Environment variables
* Prisma commands
* API setup
* API documentation
* Development commands
* Seed instructions
* Testing
* Deployment

Also document:

* Authentication
* JWT architecture
* Roles
* RBAC
* Course access
* Payment workflow
* Enrollment lifecycle
* Frontend/backend communication
* File storage
* Email architecture

---

# 74. API SECURITY RULE

The backend is authoritative.

For every protected API request:

```text
Request
 ↓
Authentication
 ↓
Identify user
 ↓
Check role
 ↓
Check ownership
 ↓
Check business rules
 ↓
Perform operation
 ↓
Return response
```

Example:

A teacher calls:

```text
POST /api/v1/payments/:id/approve
```

The backend must verify:

1. User is authenticated.
2. User is a teacher.
3. Payment exists.
4. Payment belongs to a course managed by that teacher.
5. Payment is in an approvable state.
6. Enrollment exists.
7. Business rules permit approval.
8. Payment is marked VERIFIED.
9. Enrollment becomes ACTIVE.
10. Notification is created.
11. Audit log is recorded.

Use a database transaction for related state changes.

---

# 75. FINAL PRODUCT EXPERIENCE

## TEACHER

```text
Register
↓
Superadmin approves
↓
Login
↓
Create course/class
↓
Set price
↓
Invite students
↓
Student submits payment
↓
Teacher verifies payment
↓
Student becomes active
↓
Teach
↓
Assign activities
↓
Evaluate
↓
Monitor progress
↓
Give feedback
↓
Student completes course
```

## STUDENT

```text
Register
↓
Complete profile
↓
Placement test
↓
Find course
↓
Request enrollment
↓
Make payment
↓
Submit payment information
↓
Wait for approval
↓
Receive access
↓
Study
↓
Practice
↓
Submit assignments
↓
Take quizzes
↓
Receive feedback
↓
Track progress
↓
Complete course
↓
Receive certificate
```

## SUPERADMIN

```text
Manage platform
↓
Approve teachers
↓
Manage students
↓
Manage courses
↓
Monitor enrollments
↓
Monitor payments
↓
Monitor platform activity
↓
Manage settings
↓
View reports
↓
Maintain security
```

---

# 76. MOST IMPORTANT PRINCIPLE

Build this as a real learning platform, not a collection of dashboard mockups.

Every interface must connect to real:

* Node.js backend APIs
* PostgreSQL records
* Authentication
* Authorization
* Enrollment
* Payment
* Course access
* Lessons
* Activities
* Assessments
* Progress
* Notifications
* Certificates

Do NOT create fake buttons.

If a button says:

```text
Approve Payment
```

it must call the Node.js API and actually process the payment according to business rules.

If a button says:

```text
Start Lesson
```

it must open a real lesson retrieved from the backend.

If a student completes an activity, the backend must record the result.

If a teacher grades an assignment, the backend must save the grade and the student must be able to retrieve it.

If an enrollment expires, the backend must prevent access to protected course content.

---

# 77. FINAL ANTIGRAVITY INSTRUCTION

First analyze the entire specification.

Then create the project architecture:

```text
english-learning-platform/
├── frontend/
└── backend/
```

The frontend MUST use:

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
```

The backend MUST use:

```text
Node.js
Express.js
TypeScript
Prisma
PostgreSQL
JWT
Zod
```

The frontend and backend MUST remain separate applications.

The frontend communicates with the backend exclusively through REST APIs.

The backend communicates with PostgreSQL through Prisma.

Do NOT implement the backend using Next.js.

Do NOT use Next.js API routes as the main backend.

Do NOT use Auth.js as the backend authentication system.

Implement backend authentication using Node.js/Express with JWT access tokens and refresh tokens.

Implement the phases sequentially:

```text
PHASE 1
Foundation
        ↓
PHASE 2
Superadmin
        ↓
PHASE 3
Teacher
        ↓
PHASE 4
Student
        ↓
PHASE 5
Learning System
        ↓
PHASE 6
Certificates & Notifications
        ↓
PHASE 7
Advanced Features
```

After every phase:

* Test frontend
* Test backend
* Test APIs
* Test database
* Test authentication
* Test authorization
* Test workflows
* Test responsive design
* Fix errors
* Re-test existing functionality

Do not move forward while critical functionality is broken.

Do not remove working functionality when adding new features.

Do not replace real functionality with mock functionality.

Use clean architecture, secure Node.js APIs, PostgreSQL relationships, Prisma migrations, reusable React components, responsive UI, production-quality TypeScript, proper error handling, API documentation, automated testing, and strict role-based authorization.

The final result must be a complete three-role English learning platform:

```text
SUPERADMIN
+
TEACHER
+
STUDENT
```

with:

```text
Node.js + Express Backend
+
Next.js Frontend
+
PostgreSQL Database
+
Prisma ORM
+
JWT Authentication
+
REST APIs
```

and:

* Teacher-controlled paid course access
* CEFR-based English learning
* Interactive lessons
* Assignments
* Assessments
* Progress tracking
* Payments
* Certificates
* Notifications
* Teacher management
* Student management
* Course management
* Secure course access
* Production-ready architecture
* Future-ready AI learning capabilities
