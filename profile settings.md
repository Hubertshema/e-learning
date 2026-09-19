# PROFILE & SETTINGS SYSTEM — COMPLETE DEVELOPMENT PROMPT

Implement a complete, production-ready **Profile & Settings System** for the English Learning Platform.

The platform has exactly three roles:

1. SUPERADMIN
2. TEACHER
3. STUDENT

The backend must use:

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* Prisma ORM
* REST API architecture
* JWT or secure session-based authentication
* Zod for validation
* Secure password hashing

The frontend should consume the Node.js REST APIs.

The profile system must enforce role-based permissions on the backend. Never rely only on frontend restrictions.

---

# 1. GENERAL PROFILE ARCHITECTURE

Every authenticated user has a common account profile.

Common fields:

* User ID
* First name
* Last name
* Email
* Phone number
* Profile photo
* Role
* Account status
* Email verification status
* Last login
* Created date
* Updated date

However, each role has additional profile information.

Structure:

```text
User
│
├── Superadmin Profile
│
├── Teacher Profile
│
└── Student Profile
```

Do not create duplicate authentication information in the role-specific tables.

The main `User` entity should contain authentication/account information, while role-specific profile tables contain role-specific information.

---

# 2. COMMON SETTINGS FOR ALL USERS

All three roles should have access to appropriate common settings.

Create:

```text
/Profile
/Settings
```

or role-specific versions:

```text
/superadmin/profile
/superadmin/settings

/teacher/profile
/teacher/settings

/student/profile
/student/settings
```

---

# 3. PERSONAL INFORMATION

Every user should be able to manage permitted personal information.

Fields:

* First name
* Last name
* Profile photo
* Phone number
* Country
* City
* Preferred language
* Timezone

The email address should be displayed but should not simply be changed without verification.

If email change is supported:

```text
Current email
       ↓
New email
       ↓
Verification email
       ↓
User confirms
       ↓
New email becomes active
```

The old email remains active until verification succeeds.

---

# 4. PROFILE PHOTO

Users can upload a profile photo.

Requirements:

* JPG
* JPEG
* PNG
* WebP

Validate:

* File type
* File size
* File dimensions where appropriate

Do not store large image binaries in PostgreSQL.

Use an object-storage architecture such as:

* Cloudinary
* Amazon S3
* S3-compatible storage

Store the resulting file URL/reference in the database.

Provide:

* Upload photo
* Change photo
* Remove photo
* Preview photo

---

# 5. PASSWORD SETTINGS

All users should have:

```text
Settings
→ Security
→ Change Password
```

Fields:

* Current password
* New password
* Confirm new password

Requirements:

* Verify current password
* Validate password strength
* Hash new password
* Invalidate appropriate old sessions/tokens where possible
* Never store plain-text passwords

Show password requirements such as:

* Minimum length
* Uppercase
* Lowercase
* Number
* Special character

Do not reveal whether a submitted password exists in the database.

---

# 6. PASSWORD RESET

Implement:

```text
Forgot Password
      ↓
Enter email
      ↓
Receive reset email
      ↓
Open secure reset link
      ↓
Set new password
      ↓
Password changed
```

Reset tokens must:

* Be cryptographically secure
* Expire
* Be single-use
* Be stored securely
* Never contain the user's password

---

# 7. EMAIL SETTINGS

Email is an important part of this platform.

Users should have an email notification settings section.

Example:

```text
Email Notifications

☑ Account security
☑ Password changes
☑ Important account notifications
☑ Course notifications
☑ Assignment notifications
☑ Payment notifications
☑ Enrollment notifications
☑ Progress notifications
☑ Platform announcements
```

However, critical security emails should not be disableable.

For example:

* Password reset
* Email verification
* Suspicious login/security alerts where implemented

---

# 8. NOTIFICATION SETTINGS

Create notification preferences.

Support:

* In-app notifications
* Email notifications

Example:

```text
Notification Preferences

Enrollment updates       [ON]
Payment updates          [ON]
Assignment notifications [ON]
Quiz notifications       [ON]
Teacher feedback         [ON]
Course expiration        [ON]
System announcements     [ON]
```

Store these preferences in the database.

---

# 9. LANGUAGE SETTINGS

Allow users to select the interface language.

Initial options can include:

* English
* Kinyarwanda

Design the system so additional languages can be added later.

The selected language affects the interface, not necessarily the language being learned.

Example:

```text
Interface Language:
[ English ▼ ]
```

---

# 10. TIMEZONE SETTINGS

Allow users to select a timezone.

Default:

```text
Africa/Kigali
```

But do not hard-code Rwanda as the only possible timezone.

Use standard IANA timezone identifiers.

The backend should store dates in UTC and convert them for display according to the user's timezone.

---

# 11. SECURITY SETTINGS

Create a security page.

Display:

* Email verification status
* Password status
* Last login
* Active sessions where supported
* Recent login activity

Allow:

### Log out all other devices

This should invalidate other active sessions.

### Login activity

Display:

```text
Date
Device
Browser
Approximate location where appropriate
IP where legally/operationally appropriate
Status
```

Do not expose unnecessary sensitive information.

---

# 12. SUPERADMIN PROFILE

Create:

```text
/superadmin/profile
```

The Superadmin profile should contain:

* First name
* Last name
* Profile photo
* Email
* Phone
* Country
* City
* Timezone
* Preferred language
* Account creation date
* Last login
* Account status

Display:

```text
Role: SUPERADMIN
Status: ACTIVE
```

The Superadmin should not be able to change their role from the normal profile interface.

---

# 13. SUPERADMIN SETTINGS

Create:

```text
/superadmin/settings
```

Sections:

### Account

* Personal information
* Email
* Phone
* Profile photo

### Security

* Change password
* Active sessions
* Login activity
* Logout other devices

### Notifications

* System notifications
* Teacher registration notifications
* Payment notifications
* Security alerts
* Platform announcements

### Platform Settings

Only Superadmin should have access to these.

Include:

* Platform name
* Logo
* Platform description
* Support email
* Support phone
* Default currency
* Default timezone
* Default language
* Registration settings

### Learning Settings

* CEFR levels
* Course rules
* Passing score
* Certificate requirements
* Enrollment rules
* Course expiration rules

### Payment Settings

* Currency
* Supported payment methods
* Payment instructions
* Manual payment settings
* Payment verification rules

### Email Settings

* Email sender name
* Sender address
* Email templates
* Verification settings
* Password reset settings

### Security Settings

* Password requirements
* Session duration
* Login attempt limits
* Rate limits
* Account lockout configuration

Superadmin settings must be protected by strong authorization.

---

# 14. SUPERADMIN DANGER ZONE

Create a separate:

```text
Danger Zone
```

section.

Potential actions:

* Disable account
* Logout all sessions

Do NOT provide careless permanent deletion controls.

If permanent deletion exists, require:

1. Password confirmation
2. Explicit confirmation
3. Strong warning
4. Audit log

Platform-critical Superadmin operations should require additional protection.

---

# 15. TEACHER PROFILE

Create:

```text
/teacher/profile
```

Teacher profile should contain professional information.

### Personal information

* First name
* Last name
* Profile photo
* Email
* Phone
* Country
* City
* Preferred language
* Timezone

### Professional information

* Biography
* Teaching experience
* Qualifications
* Certifications
* Specializations
* Subjects
* Languages spoken
* CEFR levels taught

Example:

```text
Teacher

Name:
John Doe

Specialization:
English Language Teaching

Experience:
5 years

Levels:
A1, A2, B1, B2

Languages:
English, Kinyarwanda
```

---

# 16. TEACHER PROFESSIONAL PROFILE

Allow teachers to create a profile that students can see where appropriate.

Public/professional information may include:

* Profile photo
* Full name
* Biography
* Qualifications
* Teaching experience
* Specializations
* CEFR levels
* Courses taught

Do NOT expose:

* Password
* Private security information
* Payment details
* Private phone number unless explicitly configured
* Private student information
* Internal Superadmin notes

---

# 17. TEACHER PROFILE VISIBILITY

Create settings:

```text
Profile Visibility

○ Public
○ Students only
○ Private
```

However, platform administrators can override visibility where required for platform operations.

If profile is public, show only information marked as public.

---

# 18. TEACHER TEACHING SETTINGS

Create:

```text
Teacher Settings
→ Teaching Preferences
```

Options:

### Default CEFR levels

Teacher can select:

* Pre-A1
* A1
* A2
* B1
* B2
* C1
* C2

### Teaching specialties

* Grammar
* Vocabulary
* Reading
* Listening
* Speaking
* Writing
* Pronunciation
* Business English
* Academic English
* Interview English
* English for IT

### Default course settings

Allow teacher to define preferred defaults such as:

* Default course duration
* Default currency
* Default class size
* Default passing score
* Default assignment settings

These are defaults only and should not override platform-wide rules.

---

# 19. TEACHER PAYMENT SETTINGS

Create:

```text
Teacher Settings
→ Payment Information
```

This is different from student payment history.

The teacher can configure payment information that students may need to make payments.

Depending on the platform business model, this may include:

* Payment method
* Mobile money instructions
* Bank information
* Payment account name
* Payment reference instructions

Sensitive payment information must be protected.

Never expose teacher payment information to unauthorized users.

If the platform later integrates payment gateways, move sensitive gateway information into a secure payment-provider configuration rather than ordinary profile fields.

---

# 20. TEACHER NOTIFICATION SETTINGS

Teacher-specific notifications:

```text
New student enrollment       ON/OFF
Payment submitted            ON/OFF
Payment rejected             ON/OFF
Assignment submitted         ON/OFF
Quiz completed               ON/OFF
Student inactive             ON/OFF
Course expiring              ON/OFF
Student feedback             ON/OFF
System announcements         ON/OFF
```

Critical system notifications remain enabled.

---

# 21. TEACHER ACCOUNT STATUS

Teacher should be able to see their account status.

Possible statuses:

```text
PENDING
APPROVED
ACTIVE
INACTIVE
SUSPENDED
REJECTED
```

The teacher cannot change these statuses themselves.

Only authorized Superadmin operations can change them.

Example:

```text
Account Status
ACTIVE

Your account is currently active.
```

If suspended:

```text
Account Status
SUSPENDED

Your account has been suspended.
Please contact platform support.
```

Do not reveal sensitive internal administrative reasons unless the platform has explicitly configured a user-facing explanation.

---

# 22. STUDENT PROFILE

Create:

```text
/student/profile
```

Student profile should contain:

### Personal information

* First name
* Last name
* Profile photo
* Email
* Phone
* Country
* City
* Preferred language
* Timezone

### Learning information

* Current CEFR level
* Placement-test result
* Learning goals
* Preferred learning schedule
* Preferred learning style where supported
* Languages spoken
* Target skills

---

# 23. STUDENT LEARNING GOALS

Allow students to select goals.

Examples:

```text
My English Goals

☑ Improve speaking
☑ Improve grammar
☑ Improve vocabulary
☐ Prepare for an interview
☐ Prepare for academic studies
☐ Improve workplace English
☐ Improve pronunciation
☐ Prepare for an English exam
```

Allow students to add a custom goal.

Example:

> I want to communicate confidently with international clients.

These goals can later be used by the recommendation system.

---

# 24. STUDENT PREFERRED STUDY SETTINGS

Create:

```text
Learning Preferences
```

Allow:

* Preferred study time
* Preferred days
* Daily learning target
* Reminder preference

Example:

```text
Daily learning target:
30 minutes

Preferred study days:
Monday
Tuesday
Wednesday
Thursday
Friday

Preferred study time:
18:00 – 20:00
```

These settings should help generate reminders and future personalized recommendations.

---

# 25. STUDENT NOTIFICATION SETTINGS

Student can control non-critical notifications.

Examples:

```text
New lesson                    ON
Assignment reminder           ON
Assignment graded             ON
Quiz reminder                 ON
Teacher feedback              ON
Course expiration warning     ON
Payment updates               ON
Enrollment updates            ON
Certificate issued            ON
Platform announcements       ON
```

---

# 26. STUDENT PRIVACY SETTINGS

Create:

```text
Privacy
```

Possible options:

### Profile visibility

```text
Private
Teacher only
```

Students should never have a public profile by default.

### Learning data

Students should understand that teachers can see learning information required for teaching, such as:

* Course progress
* Assignment results
* Quiz results
* Attendance
* Teacher feedback

Do not allow students to hide information that teachers need for legitimate course management.

---

# 27. STUDENT ACCOUNT SECURITY

Provide:

* Change password
* Forgot password
* Email verification
* Active sessions
* Logout all devices
* Login activity

Student should also be able to see:

```text
Email:
Verified ✓

Phone:
Verified / Not verified
```

where phone verification is implemented.

---

# 28. STUDENT PAYMENT HISTORY

Profile settings should not replace the dedicated payment section.

Create a link:

```text
Settings
→ Payment History
```

Students can view:

* Course
* Amount
* Currency
* Payment method
* Transaction/reference number
* Date
* Status

Possible statuses:

* PENDING
* SUBMITTED
* VERIFIED
* REJECTED
* REFUNDED
* CANCELLED

Students cannot modify verified payment records.

---

# 29. STUDENT ENROLLMENT INFORMATION

Students should be able to see their current enrollment information.

Example:

```text
A1 Beginner English

Teacher:
John Doe

Status:
ACTIVE

Started:
01 September 2026

Expires:
01 December 2026

Progress:
64%
```

The student should also see:

* Course level
* Course duration
* Enrollment date
* Expiry date
* Completion status

---

# 30. STUDENT DANGER ZONE

Create:

```text
Danger Zone
```

Possible actions:

### Logout all devices

Safe and reversible.

### Request account deletion

Do NOT immediately delete the account.

Instead:

```text
Student requests deletion
        ↓
Confirmation
        ↓
Request sent
        ↓
Account enters DELETION_REQUESTED
        ↓
Platform processes request
```

Keep academic/payment records according to applicable retention requirements and platform policy.

Do not destroy financial/audit records simply because a student requests account deletion.

---

# 31. EMAIL VERIFICATION

Implement email verification for all users.

Workflow:

```text
Register
 ↓
Verification email
 ↓
User clicks verification link
 ↓
Email verified
 ↓
Account continues
```

Show status:

```text
Email:
user@example.com

✓ Verified
```

If unverified:

```text
⚠ Email not verified

[Resend verification email]
```

Prevent excessive resend requests using rate limiting.

---

# 32. ACCOUNT DEACTIVATION

Users should generally not be able to deactivate accounts that require administrative handling without a defined workflow.

For example:

Student:

```text
Request account closure
```

Teacher:

```text
Request account deactivation
```

Superadmin can manage account status.

The backend must distinguish:

* User requested deactivation
* Admin suspension
* Platform deactivation
* Permanent deletion

Do not represent all of these with one boolean.

---

# 33. AUDIT LOGGING

Record important profile/security changes.

Examples:

```text
User changed password
User changed email
User uploaded profile photo
Teacher updated professional profile
Teacher changed course preferences
Student changed learning goals
Superadmin changed platform settings
Superadmin suspended teacher
```

Audit record:

```text
Actor
Action
Target
Timestamp
IP where appropriate
Metadata
```

Never store passwords or sensitive authentication secrets in audit logs.

---

# 34. ROLE-BASED SETTINGS PERMISSIONS

Implement strict backend permissions.

### SUPERADMIN

Can:

* Manage own profile
* Manage own security
* Manage platform settings
* Manage users
* Manage teacher/student statuses
* Manage learning settings
* Manage payment configuration
* Manage notification configuration

### TEACHER

Can:

* Manage own profile
* Manage own professional information
* Manage own teaching preferences
* Manage own notification preferences
* Manage own security
* Manage permitted payment information

Cannot:

* Change platform settings
* Change their role
* Change another teacher's profile
* Change Superadmin settings
* Change student authentication data

### STUDENT

Can:

* Manage own profile
* Manage learning goals
* Manage learning preferences
* Manage notification preferences
* Manage security
* View payment history
* View enrollment information

Cannot:

* Change CEFR result assigned by authorized staff
* Change enrollment status
* Change payment verification status
* Change teacher information
* Access another student's information
* Access teacher/private administration settings

---

# 35. API ARCHITECTURE

Build role-specific REST APIs using Node.js/Express.

Example:

```text
GET    /api/v1/profile
PATCH  /api/v1/profile

POST   /api/v1/profile/photo
DELETE /api/v1/profile/photo

PATCH  /api/v1/profile/personal

POST   /api/v1/profile/change-password

POST   /api/v1/profile/change-email

GET    /api/v1/profile/notifications
PATCH  /api/v1/profile/notifications

GET    /api/v1/profile/security/sessions
POST   /api/v1/profile/security/logout-all
```

Teacher-specific:

```text
GET    /api/v1/teacher/profile
PATCH  /api/v1/teacher/profile

GET    /api/v1/teacher/preferences
PATCH  /api/v1/teacher/preferences

GET    /api/v1/teacher/payment-settings
PATCH  /api/v1/teacher/payment-settings
```

Student-specific:

```text
GET    /api/v1/student/profile
PATCH  /api/v1/student/profile

GET    /api/v1/student/preferences
PATCH  /api/v1/student/preferences

GET    /api/v1/student/learning-goals
PATCH  /api/v1/student/learning-goals

GET    /api/v1/student/payment-history
GET    /api/v1/student/enrollments
```

Superadmin-specific:

```text
GET    /api/v1/superadmin/profile
PATCH  /api/v1/superadmin/profile

GET    /api/v1/superadmin/settings
PATCH  /api/v1/superadmin/settings

GET    /api/v1/superadmin/security
PATCH  /api/v1/superadmin/security
```

Use middleware such as:

```text
authenticate
requireRole('SUPERADMIN')
requireRole('TEACHER')
requireRole('STUDENT')
```

---

# 36. DATABASE DESIGN

Use Prisma and PostgreSQL.

Create or extend models such as:

```text
User
TeacherProfile
StudentProfile
SuperadminProfile

UserPreference
NotificationPreference
SecuritySession
EmailVerificationToken
PasswordResetToken

TeacherTeachingPreference
StudentLearningPreference
StudentLearningGoal

TeacherPaymentSetting

AuditLog
```

Use relationships rather than duplicating data.

Example:

```text
User
 |
 +--- TeacherProfile
 |
 +--- StudentProfile
 |
 +--- SuperadminProfile
 |
 +--- UserPreference
 |
 +--- NotificationPreference
 |
 +--- SecuritySession
```

---

# 37. VALIDATION

Use Zod schemas for every profile-related request.

Validate:

* Names
* Phone numbers
* Email
* Timezone
* Language
* Biography
* Qualifications
* Teaching experience
* Learning goals
* Notification settings

Reject invalid data on the server.

Do not trust frontend validation.

---

# 38. PROFILE UI

Use a consistent settings interface.

Example sidebar:

```text
Settings

Account
  ├── Profile
  ├── Personal Information
  └── Preferences

Security
  ├── Password
  ├── Login Activity
  └── Active Sessions

Notifications
  ├── Email Notifications
  └── In-App Notifications

Role-specific
  ├── Teaching Preferences     ← Teacher
  ├── Payment Settings         ← Teacher
  └── Learning Preferences    ← Student

Privacy
  └── Privacy Settings

Danger Zone
```

Superadmin gets additional:

```text
Platform
  ├── General
  ├── Learning
  ├── Payments
  ├── Email
  └── Security
```

---

# 39. UX REQUIREMENTS

Every settings page must include:

* Loading state
* Form validation
* Success message
* Error message
* Save button
* Cancel/reset option where appropriate
* Unsaved changes warning where useful

After saving:

```text
✓ Changes saved successfully.
```

Do not reload the entire application unnecessarily.

Use optimistic UI only where it is safe.

---

# 40. SECURITY REQUIREMENTS

The profile system must follow strong security practices.

Never:

* Return password hashes to frontend
* Allow users to modify their role
* Allow students to modify enrollment status
* Allow students to verify their own payments
* Allow teachers to modify platform settings
* Allow users to access another user's settings
* Store passwords in plain text
* Store reset tokens in plain text where avoidable
* Expose private uploaded documents publicly

Every request must verify:

```text
Authentication
+
Role
+
Resource ownership
+
Permission
```

---

# 41. FINAL ACCEPTANCE CRITERIA

The profile/settings system is complete only when:

### Superadmin

* Can manage own profile
* Can manage security
* Can configure platform settings
* Can configure learning settings
* Can configure payment settings
* Can configure notification settings
* Can view security activity
* Cannot accidentally change own role

### Teacher

* Can manage personal profile
* Can manage professional profile
* Can manage teaching preferences
* Can configure notifications
* Can manage permitted payment information
* Can change password
* Can manage sessions
* Cannot access Superadmin settings

### Student

* Can manage personal profile
* Can manage learning goals
* Can manage learning preferences
* Can configure notifications
* Can view enrollment information
* Can view payment history
* Can change password
* Can manage sessions
* Cannot modify academic/payment authorization data

---

# 42. IMPLEMENTATION RULE

Implement this system using the existing architecture of the English Learning Platform.

Backend:

```text
Node.js
Express.js
TypeScript
PostgreSQL
Prisma
REST APIs
```

Frontend:

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
```

Do not implement profile settings as static frontend pages.

Every form must communicate with the Node.js backend and persist real data in PostgreSQL.

Test:

1. Authentication
2. Role authorization
3. Profile updates
4. Photo upload
5. Password change
6. Password reset
7. Email verification
8. Notification preferences
9. Teacher preferences
10. Student learning preferences
11. Superadmin platform settings
12. Session management
13. Audit logging
14. Unauthorized access attempts
15. Responsive behavior

The final result must provide a professional, secure and role-specific profile/settings experience for **Superadmin, Teacher, and Student**, while keeping common account functionality centralized and preventing users from modifying information that they are not authorized to control.
