# EMAIL & NOTIFICATION SYSTEM — COMPLETE DEVELOPMENT PROMPT

You are developing the Email and Notification System for a professional English Learning Platform with exactly three roles:

- SUPERADMIN
- TEACHER
- STUDENT

The application architecture is:

- Frontend: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Node.js + Express.js + TypeScript
- Database: PostgreSQL + Prisma ORM
- Authentication: JWT access tokens + refresh tokens
- Validation: Zod
- API: REST API under `/api/v1`

The email system must be implemented primarily in the Node.js backend. The Next.js frontend must never directly communicate with the email provider.

---

# 1. OBJECTIVE

Build a professional, secure, reusable and scalable email and notification system.

The system must support:

1. Transactional emails
2. Account verification
3. Password reset
4. Security notifications
5. Enrollment notifications
6. Payment notifications
7. Course notifications
8. Assignment notifications
9. Quiz notifications
10. Teacher feedback notifications
11. Course expiration reminders
12. Course completion notifications
13. Certificate notifications
14. Superadmin announcements
15. In-app notifications
16. Notification preferences
17. Email delivery logging
18. Email retry handling
19. Email templates
20. Scheduled notifications

The system must send important events through both:

```text
In-App Notification
+
Email Notification

```

Email should be an additional communication channel, not a replacement for in-app notifications.

---

# 2. EMAIL ARCHITECTURE

Implement the following architecture:

```text
User Action / System Event
        ↓
Business Service
        ↓
Notification Service
        ↓
Email Service
        ↓
Email Queue
        ↓
Email Provider
        ↓
User Email Inbox

```

Example:

```text
Student submits payment
        ↓
Payment Service
        ↓
Notification Service
        ↓
Create in-app notification
        ↓
Email Service
        ↓
Email Queue
        ↓
Email Provider
        ↓
Student receives email

```

The same event may notify different users.

Example:

```text
Student submits payment
        ↓
Student → "Payment submitted"
Teacher → "New payment requires review"

```

---

# 3. BACKEND EMAIL MODULE

Create a dedicated email module:

```text
backend/
└── src/
    ├── modules/
    │   ├── auth/
    │   ├── students/
    │   ├── teachers/
    │   ├── courses/
    │   ├── enrollments/
    │   ├── payments/
    │   ├── assignments/
    │   ├── quizzes/
    │   └── notifications/
    │
    ├── services/
    │   └── email/
    │       ├── email.service.ts
    │       ├── email.provider.ts
    │       ├── email.types.ts
    │       ├── email.templates.ts
    │       ├── email.renderer.ts
    │       ├── email.queue.ts
    │       └── email.utils.ts
    │
    └── ...

```

Keep email provider logic separate from business logic.

For example, the payment service should not contain provider-specific email code.

Instead:

```text
PaymentService
      ↓
NotificationService
      ↓
EmailService
      ↓
EmailProvider

```

---

# 4. EMAIL PROVIDER ABSTRACTION

Create an email provider interface so the platform can change providers later.

Example architecture:

```text
EmailProvider
     ├── ResendProvider
     ├── SendGridProvider
     ├── PostmarkProvider
     └── DevelopmentProvider

```

The application should communicate with:

```text
EmailProvider.send(...)

```

rather than directly calling a provider throughout the application.

The provider must support:

- recipient
- subject
- HTML content
- plain-text content
- sender
- reply-to
- optional metadata

For development, provide a safe development email provider/logging mode so developers can test email workflows without accidentally sending real emails.

---

# 5. ENVIRONMENT VARIABLES

Create/update:

```text
backend/.env.example

```

Include:

```env
EMAIL_PROVIDER=
EMAIL_FROM=
EMAIL_FROM_NAME=
EMAIL_REPLY_TO=
EMAIL_API_KEY=

EMAIL_ENABLED=true

FRONTEND_URL=
API_URL=

EMAIL_QUEUE_ENABLED=true
EMAIL_MAX_RETRIES=3

EMAIL_VERIFICATION_EXPIRES_MINUTES=30
PASSWORD_RESET_EXPIRES_MINUTES=30

```

Never expose:

```text
EMAIL_API_KEY

```

to the Next.js frontend.

Only the Node.js backend may access email provider credentials.

---

# 6. DATABASE DESIGN

Use Prisma and PostgreSQL.

Create the necessary models.

## EmailVerificationToken

Fields should include:

```text
id
userId
tokenHash
expiresAt
usedAt
createdAt

```

Rules:

- Store a secure hash of the token rather than the raw token where practical.
- Token must expire.
- Token can only be used once.
- Old/used tokens must not be reusable.

---

# 7. PASSWORD RESET TOKEN

Create:

```text
PasswordResetToken

```

Fields:

```text
id
userId
tokenHash
expiresAt
usedAt
createdAt

```

Password reset workflow:

```text
User clicks Forgot Password
        ↓
Enters email
        ↓
Backend creates secure reset token
        ↓
Backend sends reset email
        ↓
User opens reset link
        ↓
Frontend opens reset page
        ↓
Frontend submits new password to backend
        ↓
Backend validates token
        ↓
Backend hashes new password
        ↓
Token becomes used
        ↓
All appropriate existing sessions/tokens are invalidated
        ↓
Security notification is created
        ↓
Password changed email is sent

```

Do not reveal whether an email address exists in the system when handling forgot-password requests.

---

# 8. NOTIFICATION MODEL

Create a reusable:

```text
Notification

```

model.

Recommended fields:

```text
id
userId
type
title
message
data
isRead
readAt
createdAt

```

Notification types should include:

```text
WELCOME
EMAIL_VERIFICATION
TEACHER_APPROVAL
TEACHER_REJECTION
PASSWORD_RESET
PASSWORD_CHANGED
SECURITY_ALERT

ENROLLMENT_SUBMITTED
ENROLLMENT_APPROVED
ENROLLMENT_REJECTED
ENROLLMENT_SUSPENDED
ENROLLMENT_COMPLETED

PAYMENT_SUBMITTED
PAYMENT_VERIFIED
PAYMENT_REJECTED
PAYMENT_REFUNDED

ASSIGNMENT_CREATED
ASSIGNMENT_SUBMITTED
ASSIGNMENT_GRADED
ASSIGNMENT_FEEDBACK

QUIZ_AVAILABLE
QUIZ_COMPLETED
QUIZ_RESULT

TEACHER_FEEDBACK
COURSE_EXPIRING
COURSE_EXPIRED
COURSE_COMPLETED

CERTIFICATE_ISSUED

ANNOUNCEMENT

```

---

# 9. NOTIFICATION PREFERENCES

Create:

```text
NotificationPreference

```

Each user should be able to control normal notification channels.

Example:

```text
userId

emailEnabled

enrollmentEmails
paymentEmails
assignmentEmails
quizEmails
feedbackEmails
courseExpirationEmails
courseCompletionEmails
announcementEmails

inAppEnabled

createdAt
updatedAt

```

Users should be able to change notification preferences from:

```text
/student/settings
/teacher/settings

```

Superadmin should also be able to configure global notification settings.

---

# 10. SECURITY EMAILS

Certain emails must remain enabled because they are security-related.

These include:

- Email verification
- Password reset
- Password changed
- Important account security alerts

Normal marketing/announcement preferences must not disable critical security messages.

---

# 11. EMAIL LOGGING

Create:

```text
EmailLog

```

Recommended fields:

```text
id
userId
recipient
subject
template
status
provider
providerMessageId
errorMessage
attempts
sentAt
createdAt

```

Possible statuses:

```text
QUEUED
SENDING
SENT
FAILED
RETRYING
CANCELLED

```

This allows Superadmin to monitor email delivery.

Do not store sensitive credentials or password-reset tokens in email logs.

---

# 12. EMAIL TEMPLATES

Create reusable professional email templates.

All templates should have:

- Platform logo/name
- Clear title
- Main message
- Relevant information
- Primary action button where appropriate
- Support/contact information
- Footer
- Responsive HTML design
- Plain-text fallback

Create these templates:

```text
WelcomeEmail
EmailVerificationEmail
TeacherRegistrationEmail
TeacherApprovedEmail
TeacherRejectedEmail

PasswordResetEmail
PasswordChangedEmail
SecurityAlertEmail

EnrollmentSubmittedEmail
EnrollmentApprovedEmail
EnrollmentRejectedEmail
EnrollmentSuspendedEmail

PaymentSubmittedEmail
PaymentVerifiedEmail
PaymentRejectedEmail
PaymentRefundedEmail

AssignmentCreatedEmail
AssignmentSubmittedEmail
AssignmentGradedEmail

QuizAvailableEmail
QuizCompletedEmail
QuizResultEmail

TeacherFeedbackEmail

CourseExpiringEmail
CourseExpiredEmail

CourseCompletedEmail
CertificateIssuedEmail

AnnouncementEmail

```

Templates must use dynamic variables.

Example:

```text
{{studentName}}
{{teacherName}}
{{courseName}}
{{courseLevel}}
{{amount}}
{{currency}}
{{paymentReference}}
{{expiryDate}}
{{assignmentTitle}}
{{quizTitle}}
{{score}}
{{certificateId}}
{{actionUrl}}

```

Never hard-code user-specific information.

---

# 13. STUDENT REGISTRATION EMAIL

When a student registers:

```text
Student Registration
        ↓
Create account
        ↓
Create StudentProfile
        ↓
Create email verification token
        ↓
Send Welcome / Verification email
        ↓
Create in-app notification

```

Email should explain:

- Welcome
- Account creation
- Email verification
- Verification button
- What the student can do after verification

Verification URL should point to the frontend.

Example:

```text
https://frontend-domain/verify-email?token=...

```

The frontend then communicates with the backend to complete verification.

---

# 14. TEACHER REGISTRATION EMAIL

Teacher registration requires Superadmin approval.

Workflow:

```text
Teacher registers
        ↓
Account status = PENDING
        ↓
Teacher receives:
"Your teacher application has been received."
        ↓
Superadmin receives notification
        ↓
Superadmin reviews teacher

```

If approved:

```text
Teacher approved
        ↓
In-app notification
        ↓
Approval email

```

If rejected:

```text
Teacher rejected
        ↓
In-app notification
        ↓
Rejection email
        ↓
Include rejection reason where appropriate

```

---

# 15. PASSWORD EMAILS

Implement:

### Forgot Password

Send:

```text
PasswordResetEmail

```

The email should contain a secure frontend reset link.

### Password Changed

After successful password change:

```text
PasswordChangedEmail

```

Include:

- Date/time
- Security notice
- Advice to contact support if the change was not authorized

---

# 16. ENROLLMENT EMAILS

When a student requests enrollment:

Student:

```text
EnrollmentSubmittedEmail

```

Teacher:

```text
New enrollment request notification

```

When teacher approves:

Student:

```text
EnrollmentApprovedEmail

```

When rejected:

Student:

```text
EnrollmentRejectedEmail

```

When suspended:

Student:

```text
EnrollmentSuspendedEmail

```

When completed:

Student:

```text
EnrollmentCompletedEmail

```

---

# 17. PAYMENT EMAILS

When student submits payment:

Student:

```text
PaymentSubmittedEmail

```

Teacher:

```text
New payment requires verification

```

When payment is verified:

Student:

```text
PaymentVerifiedEmail

```

The email should include:

```text
Course
Amount
Currency
Payment method
Reference
Payment date
Status

```

When rejected:

```text
PaymentRejectedEmail

```

Include rejection reason when provided.

---

# 18. ASSIGNMENT EMAILS

When teacher creates an assignment:

Student receives:

```text
AssignmentCreatedEmail

```

Include:

```text
Assignment title
Course
Due date
Instructions summary
Open assignment button

```

When student submits:

Teacher receives:

```text
AssignmentSubmittedEmail

```

When teacher grades:

Student receives:

```text
AssignmentGradedEmail

```

Include:

```text
Assignment
Score
Teacher feedback
Open result button

```

---

# 19. QUIZ EMAILS

When a quiz becomes available:

```text
QuizAvailableEmail

```

When student completes quiz:

Teacher may receive:

```text
QuizCompletedEmail

```

When results are available:

Student receives:

```text
QuizResultEmail

```

Include:

```text
Quiz title
Score
Percentage
Pass/fail status
Teacher/course information

```

Do not trust scores submitted by the frontend. The backend must calculate or validate scores.

---

# 20. TEACHER FEEDBACK EMAIL

When a teacher provides feedback:

Create:

```text
TEACHER_FEEDBACK

```

Send:

```text
In-App Notification
+
Email

```

Email should include:

```text
Teacher name
Course
Lesson/assignment context
Feedback summary
Open feedback button

```

Avoid putting unnecessarily sensitive academic information in email.

---

# 21. COURSE EXPIRATION SYSTEM

The system must automatically notify students before course enrollment expires.

Send reminders:

```text
7 days before expiry
3 days before expiry
1 day before expiry

```

Then:

```text
ACTIVE → EXPIRED

```

Send:

```text
CourseExpiredEmail

```

After expiration:

- Account remains active.
- Student retains history.
- Student retains grades/results.
- Protected course content is blocked.
- Renewal can be offered if supported.

The backend must enforce expiration.

Do not rely on frontend date calculations for access control.

---

# 22. SCHEDULED EMAIL JOBS

Implement a scheduled job system for:

- Course expiry reminders
- Expired course notifications
- Assignment deadline reminders
- Optional quiz reminders
- Optional class reminders

Example:

```text
Scheduler
    ↓
Find eligible records
    ↓
Check whether notification was already sent
    ↓
Create notification
    ↓
Queue email

```

Prevent duplicate reminder emails.

---

# 23. EMAIL QUEUE

Do not make important HTTP requests wait unnecessarily for email delivery.

Implement an email queue abstraction.

Example:

```text
Business Event
      ↓
Queue Email
      ↓
Return API response
      ↓
Worker processes email
      ↓
Provider sends email

```

Support:

- Retry
- Maximum retry count
- Failure logging
- Queue status
- Idempotency
- Duplicate prevention

If a provider temporarily fails, retry automatically.

Example:

```text
Attempt 1 → Failed
Attempt 2 → Failed
Attempt 3 → Success

```

Do not retry indefinitely.

---

# 24. EMAIL API ENDPOINTS

Create appropriate backend endpoints.

Example:

```text
POST /api/v1/auth/send-verification-email
POST /api/v1/auth/verify-email

POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

GET /api/v1/notifications
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all

GET /api/v1/notification-preferences
PATCH /api/v1/notification-preferences

```

Superadmin endpoints:

```text
GET /api/v1/admin/email-logs
GET /api/v1/admin/email-logs/:id

GET /api/v1/admin/notifications
POST /api/v1/admin/notifications/announcement

GET /api/v1/admin/notification-settings
PATCH /api/v1/admin/notification-settings

```

Use:

- JWT authentication
- RBAC
- Zod validation
- Pagination
- Filtering
- Authorization checks

---

# 25. SUPERADMIN EMAIL MANAGEMENT

Add email management to the Superadmin dashboard.

Create:

```text
/admin/notifications
/admin/email-logs
/admin/settings/email

```

Superadmin should be able to:

### Email Overview

Display:

```text
Emails sent
Emails queued
Emails failed
Emails pending
Emails today
Emails this week

```

### Email Logs

Show:

```text
Recipient
Subject
Template
Status
Provider
Created date
Sent date
Failure reason

```

Add filters:

```text
Status
Template
Date
Recipient

```

### Announcements

Superadmin can send announcements to:

```text
All Students
All Teachers
All Users
Selected Students
Selected Teachers

```

Before sending a large announcement:

```text
Show recipient count
Show email preview
Require confirmation

```

Do not allow arbitrary bulk sending without safeguards.

---

# 26. NOTIFICATION CENTER

Create a notification center for both Student and Teacher dashboards.

Example:

```text
🔔 Notifications
------------------------------
Assignment graded
Payment verified
New course available
Teacher feedback received
Course expires in 3 days
------------------------------
Mark all as read

```

Unread notifications should show a badge.

Use backend data.

Do not create fake notifications in the frontend.

---

# 27. STUDENT SETTINGS

Create:

```text
/student/settings

```

Sections:

```text
Account
Security
Notifications

```

Notification preferences:

```text
Email notifications
Enrollment updates
Payment updates
Assignment updates
Quiz updates
Teacher feedback
Course expiration
Course completion
Announcements

```

Include:

```text
Save Changes

```

Changes must be persisted in PostgreSQL.

---

# 28. TEACHER SETTINGS

Create:

```text
/teacher/settings

```

Allow teachers to manage:

```text
Email notifications
Enrollment notifications
Payment notifications
Assignment notifications
Quiz notifications
Student feedback notifications
Announcements

```

Security-related emails cannot be disabled.

---

# 29. SUPERADMIN SETTINGS

Create:

```text
/admin/settings/email

```

Allow authorized Superadmin users to configure:

```text
Email provider
Sender name
Sender email
Reply-to address
Email enabled/disabled
Queue settings
Retry count

```

Never display secret API keys in plain text after saving.

Secrets must remain server-side.

---

# 30. EMAIL VERIFICATION UI

Create frontend page:

```text
/verify-email

```

States:

```text
Verifying...
Email verified successfully
Verification link expired
Verification link invalid
Already verified
Something went wrong

```

Provide appropriate navigation.

Example:

```text
Email verified successfully.

You can now continue to your dashboard.

```

---

# 31. PASSWORD RESET UI

Create:

```text
/forgot-password
/reset-password

```

Forgot password:

```text
Email address
Send reset link

```

Reset password:

```text
New password
Confirm password
Reset password

```

Use frontend validation but always validate again in the backend.

---

# 32. ERROR HANDLING

Implement clear handling for:

```text
Invalid email
Expired token
Used token
Provider failure
Network failure
Invalid notification preference
Unauthorized request
Rate limit exceeded

```

Never expose:

- API keys
- JWT secrets
- internal stack traces
- password-reset tokens
- sensitive database information

---

# 33. RATE LIMITING

Protect email-related endpoints.

Apply rate limits to:

```text
Forgot password
Send verification email
Resend verification email
Bulk announcements

```

Prevent users from repeatedly triggering emails.

For example:

```text
Resend verification:
limited number of attempts within a time window

```

Use appropriate server-side rate limiting.

---

# 34. EMAIL DUPLICATE PREVENTION

The system must prevent accidental duplicate emails.

For example:

If:

```text
Course expiration reminder for 7 days

```

has already been sent, do not send it again every time the scheduled job runs.

Use database records/idempotency keys where appropriate.

Example:

```text
userId + enrollmentId + notificationType + reminderDate

```

must uniquely identify the reminder.

---

# 35. EMAIL CONTENT RULES

Emails should be:

- Professional
- Simple
- Clear
- Mobile responsive
- Accessible
- Consistent with the platform branding
- Short enough to scan easily

Do not place important functionality only inside email.

Every important email should provide an appropriate action link back to the platform.

---

# 36. EMAIL EVENT SERVICE

Create a centralized notification/event system.

Example:

```text
NotificationService.notify({
    userId,
    type,
    title,
    message,
    data
})

```

and:

```text
EmailService.sendTemplate({
    template,
    recipient,
    data
})

```

For combined notifications:

```text
NotificationService.notifyUser({
    userId,
    type,
    emailTemplate,
    data
})

```

This keeps business modules clean.

---

# 37. EXAMPLE EVENT FLOW

Implement this pattern consistently.

### Payment Verification

```text
Teacher approves payment
        ↓
Database transaction
        ↓
Payment = VERIFIED
        ↓
Enrollment = ACTIVE
        ↓
Create student notification
        ↓
Queue student email
        ↓
Create teacher/admin audit log

```

If email fails:

```text
Payment remains VERIFIED
Enrollment remains ACTIVE
Email status = FAILED/RETRYING

```

Email failure must not roll back a successful business transaction unless the business operation explicitly requires email delivery.

---

# 38. EMAIL PROVIDER FAILURE

If the email provider is unavailable:

```text
Business operation succeeds
        ↓
Email queued
        ↓
Email worker attempts delivery
        ↓
Provider failure
        ↓
Retry
        ↓
Log failure

```

The application should remain usable even when email delivery temporarily fails.

---

# 39. DEVELOPMENT MODE

In development:

```env
EMAIL_ENABLED=false

```

may be supported.

When disabled:

- Do not send external emails.
- Log email details safely.
- Allow developers to inspect generated email content.
- Never expose sensitive tokens unnecessarily.

Create a development email provider or email preview mechanism.

---

# 40. TESTING

Create automated tests.

## Unit Tests

Test:

```text
Email template rendering
Email provider
Notification service
Preference service
Token generation
Token expiration
Duplicate prevention
Retry logic

```

## Integration Tests

Test:

```text
Registration → verification email

Forgot password → reset email

Teacher registration → approval email

Enrollment → notification/email

Payment submission → notification/email

Payment approval → notification/email

Assignment creation → notification/email

Assignment grading → notification/email

Quiz completion → notification/email

Teacher feedback → notification/email

Course expiry → reminder email

```

## Security Tests

Verify:

```text
Student cannot access teacher notifications
Teacher cannot access another teacher's email logs
Student cannot access Superadmin email management
Expired verification tokens fail
Used tokens fail
Password reset tokens cannot be reused
Unauthorized bulk email sending fails
Email API keys are never returned by APIs

```

---

# 41. END-TO-END TEST SCENARIO

Run this complete scenario:

```text
1. Register student
2. Verify student email
3. Login
4. Explore course
5. Request enrollment
6. Submit payment
7. Verify payment as teacher
8. Confirm student receives payment verification notification
9. Student accesses course
10. Teacher creates assignment
11. Student receives assignment notification
12. Student submits assignment
13. Teacher receives submission notification
14. Teacher grades assignment
15. Student receives grading notification
16. Teacher gives feedback
17. Student receives feedback notification
18. Student completes quiz
19. Student receives result
20. Course approaches expiration
21. Student receives 7-day reminder
22. Student receives 3-day reminder
23. Student receives 1-day reminder
24. Enrollment expires
25. Student receives expiration email
26. Student loses access to protected course content
27. Student history remains available

```

Verify the entire workflow using real database records.

---

# 42. API RESPONSE CONSISTENCY

Use a consistent API response structure.

Example:

```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {}
}

```

Errors:

```json
{
  "success": false,
  "message": "Unable to process notification",
  "error": {
    "code": "NOTIFICATION_ERROR"
  }
}

```

Never expose internal implementation details.

---

# 43. DATABASE RELATIONSHIPS

Ensure proper relationships:

```text
User
 ├── StudentProfile
 ├── TeacherProfile
 ├── Notification
 ├── NotificationPreference
 ├── EmailLog
 ├── EmailVerificationToken
 └── PasswordResetToken

```

Use foreign keys and appropriate indexes.

Important indexes should include:

```text
Notification.userId
Notification.isRead
Notification.createdAt

EmailLog.userId
EmailLog.recipient
EmailLog.status
EmailLog.createdAt

EmailVerificationToken.userId
EmailVerificationToken.expiresAt

PasswordResetToken.userId
PasswordResetToken.expiresAt

```

---

# 44. ACCESS CONTROL

Implement strict RBAC.

### Student

Can:

```text
View own notifications
Mark own notifications as read
Manage own normal notification preferences
Trigger own password reset

```

Cannot:

```text
View email logs
Send platform announcements
View other users' notifications
Manage global email settings

```

### Teacher

Can:

```text
View own notifications
Manage own notification preferences
Receive student/course/payment notifications

```

Cannot:

```text
View platform-wide email logs
Send global announcements
Change email provider settings

```

### Superadmin

Can:

```text
View email logs
Manage notification settings
Send authorized announcements
Manage global email configuration
Monitor failed emails

```

---

# 45. AUDIT LOGGING

Important administrative email actions must create audit logs.

Examples:

```text
Superadmin changed email settings
Superadmin sent announcement
Superadmin changed notification settings
Superadmin viewed sensitive email log information

```

Audit log should include:

```text
actor
action
target
timestamp
IP where appropriate
metadata

```

Do not store sensitive secrets in audit logs.

---

# 46. FRONTEND INTEGRATION

The Next.js frontend must communicate only with the Node.js REST API.

Create a centralized API client.

Example:

```text
frontend/
└── src/
    ├── services/
    │   ├── api.ts
    │   ├── auth.api.ts
    │   ├── notification.api.ts
    │   └── user.api.ts
    │
    └── components/
        └── notifications/
            ├── NotificationBell.tsx
            ├── NotificationDropdown.tsx
            ├── NotificationList.tsx
            └── NotificationPreferences.tsx

```

Do not place email-provider credentials or provider SDKs in the frontend.

---

# 47. USER EXPERIENCE

Notification bell:

```text
🔔

```

Show unread count.

Clicking it opens:

```text
Recent Notifications

```

Each notification should have:

- Icon
- Title
- Message
- Date/time
- Read/unread state
- Action link if applicable

Provide:

```text
Mark as read
Mark all as read
View all notifications

```

---

# 48. EMAIL DESIGN CONSISTENCY

Create one reusable email layout.

Example:

```text
--------------------------------
English Learning Platform
--------------------------------

[Title]

Hello {{name}},

{{message}}

[Primary Action]

Additional information...

Need help?
Contact support.

--------------------------------
English Learning Platform
© Year
--------------------------------

```

All email templates should use the same visual identity.

---

# 49. IMPLEMENTATION RULES

Do not create fake functionality.

Do not use mock notification data in the completed application.

All notifications must come from real backend events.

All email records must come from real email operations.

All preferences must be persisted.

All email delivery states must be persisted.

All authorization must be performed on the backend.

All sensitive actions must be validated server-side.

---

# 50. FINAL ACCEPTANCE CRITERIA

The Email & Notification System is complete only when:

- Student email verification works.
- Teacher registration emails work.
- Teacher approval/rejection emails work.
- Password reset works securely.
- Password changed notification works.
- Enrollment notifications work.
- Payment notifications work.
- Assignment notifications work.
- Quiz notifications work.
- Feedback notifications work.
- Course expiration reminders work.
- Course expiration notification works.
- Course completion notification works.
- Certificate notification works.
- In-app notifications work.
- Notification preferences work.
- Email logs work.
- Email retries work.
- Duplicate emails are prevented.
- Scheduled reminders work.
- Superadmin can monitor email delivery.
- Superadmin can send authorized announcements.
- RBAC is enforced.
- Sensitive information is protected.
- Email provider credentials remain backend-only.
- APIs are validated with Zod.
- Automated tests pass.
- End-to-end workflow passes.
- No important functionality depends on frontend-only logic.

---

# 51. IMPLEMENTATION ORDER

Implement this feature in the following order:

### Phase 1 — Database

Create:

```text
Notification
NotificationPreference
EmailLog
EmailVerificationToken
PasswordResetToken

```

Run Prisma migrations and verify relationships.

### Phase 2 — Email Infrastructure

Implement:

```text
EmailProvider
EmailService
EmailTemplates
EmailRenderer
EmailQueue
EmailLogger

```

### Phase 3 — Authentication Emails

Implement:

```text
Email verification
Forgot password
Password reset
Password changed
Security notifications

```

### Phase 4 — Notification Service

Implement:

```text
Notification creation
Read/unread
Mark all as read
Notification preferences

```

### Phase 5 — Learning Notifications

Implement:

```text
Enrollment
Payments
Assignments
Quizzes
Feedback
Course completion
Certificates

```

### Phase 6 — Scheduled Notifications

Implement:

```text
Course expiry reminders
Assignment reminders
Quiz reminders where required

```

### Phase 7 — Superadmin

Implement:

```text
Email logs
Email monitoring
Notification settings
Announcement system
Email configuration

```

### Phase 8 — Frontend

Implement:

```text
Notification bell
Notification center
Notification preferences
Email verification page
Forgot password page
Reset password page

```

### Phase 9 — Testing

Run:

```text
Unit tests
Integration tests
Security tests
End-to-end tests

```

Fix every failure before proceeding.

---

# 52. IMPORTANT DEVELOPMENT INSTRUCTION

Implement the system incrementally.

After completing each phase:

1. Run the application.
2. Run database migrations.
3. Run automated tests.
4. Test the APIs.
5. Test the frontend integration.
6. Check authorization.
7. Check error handling.
8. Check database records.
9. Fix all issues.
10. Only then continue to the next phase.

Do not mark a feature as completed merely because its UI exists.

A feature is complete only when:

```text
Frontend
+
Backend
+
Database
+
Validation
+
Authorization
+
Business Logic
+
Email/Notification Processing
+
Error Handling
+
Testing

```

all work together correctly.

At the end, provide a concise implementation report containing:

- Files created
- Files modified
- Database migrations
- API endpoints
- Email templates
- Notification types
- Environment variables
- Tests performed
- Remaining issues, if any

Do not leave TODO placeholders for core email functionality.