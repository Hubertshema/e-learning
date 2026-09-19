TEACHER SECTION — COMPLETE DEVELOPMENT PROMPT

1. PROJECT OBJECTIVE

Build the complete Teacher Section of the Professional English Learning Platform.



The Teacher Section must function as a complete Teaching Management System and Teacher Workspace, not merely as a dashboard.



The teacher must be able to manage the complete teaching lifecycle:

Teacher Registration
        ↓
Superadmin Approval
        ↓
Teacher Login
        ↓
Teacher Dashboard
        ↓
Create Courses
        ↓
Build Curriculum
        ↓
Create Lessons
        ↓
Create Interactive Activities
        ↓
Create Assignments & Quizzes
        ↓
Publish Course
        ↓
Receive Student Enrollment Requests
        ↓
Review Payments
        ↓
Activate Enrollment
        ↓
Teach Students
        ↓
Track Attendance
        ↓
Grade Work
        ↓
Give Feedback
        ↓
Monitor Progress
        ↓
Generate Reports
        ↓
Manage Course Completion


Implement all functionality using real database operations and real backend APIs.



Do not create fake buttons, fake statistics, hardcoded students, hardcoded payments, mock dashboard data, or frontend-only business logic where real functionality is expected.

2. TECHNOLOGY ARCHITECTURE

Use the existing project architecture:

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


Architecture:

Teacher Browser
      ↓
Next.js Teacher UI
      ↓
HTTPS REST API
      ↓
Node.js + Express
      ↓
Authentication Middleware
      ↓
Authorization/RBAC
      ↓
Teacher Services
      ↓
Repositories
      ↓
Prisma
      ↓
PostgreSQL


The frontend must never connect directly to PostgreSQL.



All important business rules must be enforced by the Node.js backend.

3. ROLE RESTRICTION

There are exactly three roles in the entire platform:

SUPERADMIN
TEACHER
STUDENT


This prompt concerns only the TEACHER role.



Do not create additional teacher-like roles such as:

INSTRUCTOR
LECTURER
MODERATOR
COURSE_MANAGER
CONTENT_CREATOR


A teacher must have:

role = TEACHER


4. TEACHER ACCOUNT REGISTRATION

Create:

/auth/register/teacher


Teacher registration fields:



Full name

Email

Phone number

Password

Confirm password

Country

City

Teaching experience

Qualifications

Specializations

Short biography

Profile photo

Qualification/certificate documents

Languages spoken

CEFR levels taught



Validate all fields with Zod.



Validate:



Required fields

Valid email

Password strength

Password confirmation

File type

File size

Duplicate email

Duplicate phone where applicable



After registration:

Teacher submits registration
        ↓
Account created
        ↓
Account status = PENDING
        ↓
Superadmin reviews


A pending teacher must not be allowed to:



Create paid courses

Publish courses

Manage students

Verify payments

Grade students

Create classes for active teaching



The teacher may only access an appropriate pending-account screen.



Example:

Your teacher account is awaiting approval.

The platform administrator will review your
application before you can begin teaching.


5. TEACHER APPROVAL STATE

Teacher account status should support at least:

PENDING
ACTIVE
REJECTED
SUSPENDED
DEACTIVATED


Only an approved and active teacher can access the complete Teacher Section.



Superadmin controls teacher approval and account status.



Teacher cannot change their own:



Approval status

Account role

Account status

Verification status

6. TEACHER AUTHENTICATION

Use the existing Node.js authentication system.



Implement:



JWT access token

Refresh token

Secure token handling

Password hashing using Argon2 or bcrypt

Token expiration

Refresh token rotation/revocation

Logout

Password change

Forgot password

Reset password



After login:

role === TEACHER
AND
status === ACTIVE


Then redirect to:

/teacher


Unauthorized users must not access teacher routes.

7. TEACHER ROUTE PROTECTION

Protect every teacher frontend route.



Example:

/teacher
/teacher/profile
/teacher/students
/teacher/students/:studentId
/teacher/courses
/teacher/courses/create
/teacher/courses/:courseId
/teacher/classes
/teacher/assignments
/teacher/quizzes
/teacher/attendance
/teacher/progress
/teacher/enrollments
/teacher/payments
/teacher/reports
/teacher/calendar
/teacher/library
/teacher/notifications
/teacher/settings


Backend must independently verify:

Authenticated user
+
Role = TEACHER
+
Teacher account = ACTIVE
+
Resource belongs to that teacher


Never rely only on frontend route protection.

8. TEACHER DASHBOARD

Route:

/teacher


Build a professional teacher dashboard.



The dashboard must use real API data.

Statistics cards

Display:



Total students

Active students

Pending enrollments

Pending payments

Active courses

Active classes

Assignments awaiting grading

Active quizzes

Expiring enrollments



Example:

Total Students       86
Active Students      74
Active Courses        6
Active Classes        4

Pending Payments     12
Pending Enrollments   8
To Grade              9
Expiring Soon         5


Analytics

Display useful charts for:



Student enrollment

Course progress

Assignment completion

Quiz performance

Attendance

Course completion

Payment statistics



Do not display invented data.

Recent activity

Display real events:

Alice submitted Assignment 4
David completed Quiz 3
Sarah submitted a payment
John's enrollment expires in 7 days
New enrollment request received


Quick actions

Provide:

Create Course
Create Assignment
Create Quiz
View Students
Review Payments
View Enrollment Requests
Mark Attendance
View Reports


9. TEACHER SIDEBAR

Create a professional responsive sidebar:

TEACHER

Dashboard

Teaching
  ├── My Classes
  ├── My Students
  ├── My Courses
  ├── Lessons
  └── Content Library

Assessment
  ├── Assignments
  ├── Quizzes
  ├── Attendance
  └── Progress

Enrollment & Payments
  ├── Enrollment Requests
  ├── Payments
  └── Expiring Students

Reports
  ├── Student Reports
  ├── Class Reports
  ├── Course Reports
  └── Payment Reports

Communication
  ├── Notifications
  └── Feedback

Account
  ├── Profile
  └── Settings


On mobile, convert the sidebar into an appropriate drawer/navigation system.

10. TEACHER PROFILE

Route:

/teacher/profile


Display:



Profile photo

Full name

Email

Phone

Country

City

Biography

Qualifications

Teaching experience

Specializations

CEFR levels taught

Languages

Courses

Classes



Teacher can edit permitted profile information.



Teacher can:



Change profile photo

Update phone

Update biography

Update qualifications

Update experience

Update specializations

Update languages

Change password

Configure notifications



Teacher cannot change:



Role

Approval status

Account status

Superadmin-controlled verification fields

11. MY STUDENTS

Route:

/teacher/students


Only show students the teacher is authorized to manage.



Provide:



Search

Pagination

Sorting

Filters



Filters:

CEFR Level
Course
Class
Enrollment Status
Progress


Student list should show:

Student
Level
Course
Class
Progress
Enrollment
Expiry
Status
Actions


Actions:

View
Assign Lesson
Assign Assignment
Assign Quiz
Attendance
Feedback
Progress
Extend
Suspend
Renew


The backend must prevent IDOR attacks.



A teacher must not access another teacher's private student data by manually changing:

/studentId


12. INDIVIDUAL STUDENT PROFILE

Route:

/teacher/students/:studentId


Display:

Student overview

Name

Photo

Email

CEFR level

Active courses

Enrollment status

Expiry date

Overall progress

Skills

Display:

Reading
Listening
Speaking
Writing
Grammar
Vocabulary
Pronunciation
Communication


Use real calculated results.

Learning history

Display:



Completed lessons

Completed activities

Assignments

Quiz attempts

Assessments

Attendance

Feedback

Course progress

Teacher actions

Assign Lesson
Assign Assignment
Assign Quiz
Mark Attendance
Give Feedback
Extend Enrollment
Suspend Enrollment
Renew Enrollment


Every action must be authorized by the backend.

13. COURSE MANAGEMENT

Route:

/teacher/courses


Display only courses owned/created by the authenticated teacher.



Each course should show:



Image

Title

CEFR level

Course type

Number of units

Number of lessons

Number of students

Price

Duration

Status

Completion statistics



Course statuses:

DRAFT
SUBMITTED_FOR_REVIEW
APPROVED
PUBLISHED
UNPUBLISHED
ARCHIVED
REJECTED


Teacher actions:

Create
Edit
Preview
Submit
Publish
Unpublish
Archive
Duplicate
View Students
View Analytics


If platform policy requires Superadmin review, teacher-created courses must not become publicly available until approved.

14. CREATE COURSE

Route:

/teacher/courses/create


Fields:

Basic information

Course title

Description

CEFR level

Course image

Learning objectives

Duration

Price

Currency

Maximum students

Start date

End date

Course type

Support:

General English
Business English
Academic English
English for IT
Interview English
English for Teachers
English for Rwanda


Skills

Teacher selects:

Reading
Listening
Speaking
Writing
Grammar
Vocabulary
Pronunciation
Communication


Validate everything on the backend.

15. CURRICULUM BUILDER

Create an interactive curriculum builder.



Hierarchy:

COURSE
 │
 ├── UNIT 1
 │    ├── LESSON 1
 │    ├── LESSON 2
 │    └── LESSON 3
 │
 ├── UNIT 2
 │    ├── LESSON 1
 │    ├── LESSON 2
 │    └── LESSON 3
 │
 └── UNIT 3
      ├── LESSON 1
      └── LESSON 2


Teacher can:



Create unit

Edit unit

Delete unit

Reorder units

Create lesson

Edit lesson

Delete lesson

Reorder lessons

Publish/unpublish lessons



Use drag-and-drop where appropriate.



Persist ordering in PostgreSQL.

16. LESSON BUILDER

Route:

/teacher/courses/:courseId/lessons/create


Support:

Text

Introduction

Explanation

Examples

Instructions

Notes

Images

Illustrations

Vocabulary images

Educational diagrams

Audio

Pronunciation

Listening passages

Dialogues

Video

Teacher explanations

Educational content

Grammar

Support:



Grammar topic

Explanation

Rules

Examples

Exercises

Vocabulary

Example:

Word:
Beautiful

Meaning:
Attractive or pleasing

Example:
She has a beautiful voice.


17. LESSON ACTIVITIES

Allow multiple activities inside one lesson.



Example:

1. Introduction
2. Vocabulary
3. Grammar
4. Reading
5. Listening
6. Speaking
7. Writing
8. Practice
9. Mini Quiz


Teacher can:



Add activity

Edit activity

Delete activity

Duplicate activity

Reorder activity

Preview activity

18. INTERACTIVE ACTIVITY BUILDER

Support:

Multiple Choice

Fields:



Question

Options

Correct answer

Explanation

Score

True/False

Fields:



Statement

Correct answer

Explanation

Fill in the Blank

Fields:



Sentence

Blank

Accepted answers

Case sensitivity

Matching

Create:

Word → Meaning
Question → Answer


Sentence Ordering

Teacher enters correctly ordered sentence and system generates/reorders items for the student.

Listening Activity

Teacher uploads/selects audio and creates questions.

Speaking Activity

Teacher provides:



Prompt

Instructions

Expected response

Optional rubric

Vocabulary Cards

Support:



Word

Pronunciation

Meaning

Example

Image

Audio

19. ASSIGNMENT MANAGEMENT

Route:

/teacher/assignments


Teacher can create:

Writing
Reading
Vocabulary
Grammar
Listening
Speaking


Assignment fields:



Title

Instructions

Course

Unit

Lesson

Class

Selected students

Due date

Maximum score

Attachments

Submission type

Rubric where applicable



Assignment can target:

Entire class
Selected students
All enrolled students in a course


20. ASSIGNMENT SUBMISSIONS

Route:

/teacher/assignments/submissions


Display:

Student
Assignment
Submitted
Due Date
Late
Status
Score


Teacher can open a submission.



Display:



Student answer

Uploaded files

Submission date

Late status

Previous feedback



Teacher enters:

Score
Feedback


Save through Node.js API.



After grading:

Submission
      ↓
Graded
      ↓
Student notification
      ↓
Student sees score + feedback


21. QUIZ MANAGEMENT

Route:

/teacher/quizzes


Teacher can create quizzes.



Settings:



Quiz title

Course

Unit

Lesson

Number of questions

Time limit

Passing score

Maximum attempts

Randomize questions

Show answers

Availability dates



Question types:

Multiple Choice
True/False
Fill Blank
Matching
Ordering
Listening


Teacher can:



Create

Edit

Duplicate

Publish

Unpublish

Preview

Delete

22. QUIZ ANALYTICS

Teacher can see:



Total attempts

Average score

Highest score

Lowest score

Pass rate

Question performance

Individual student attempts



Example:

Average Score: 78%
Pass Rate: 82%
Attempts: 146


All statistics must be calculated from real database data.

23. CLASS MANAGEMENT

Route:

/teacher/classes


Teacher can create classes.



Fields:



Class name

CEFR level

Course

Description

Schedule

Start date

End date

Maximum students

Status



Teacher actions:

Create
Edit
Add students
Invite students
Remove students
View students
Attendance
Assignments
Quizzes
Progress


24. STUDENT INVITATION

Allow teachers to generate enrollment/invitation codes.



Example:

A1-2026-AB82


Student enters the code.



Backend validates:



Code exists

Code is active

Course is available

Teacher owns course

Student is not already enrolled

Enrollment rules are satisfied



Then create:

Enrollment = PENDING_PAYMENT


or the appropriate configured state.



Never activate course access merely because an invitation code was entered.

25. ENROLLMENT MANAGEMENT

Route:

/teacher/enrollments


Statuses:

PENDING_PAYMENT
PAYMENT_SUBMITTED
PENDING_APPROVAL
ACTIVE
SUSPENDED
EXPIRED
REJECTED
COMPLETED
CANCELLED


Teacher can view:



Student

Course

Class

Enrollment date

Payment status

Enrollment status

Expiry date



Actions:

Approve
Reject
Suspend
Extend
Renew


All transitions must be validated by backend business rules.

26. PAYMENT MANAGEMENT

Route:

/teacher/payments


Display:



Student

Course

Enrollment

Amount

Currency

Payment method

Reference

Payment date

Proof

Status



Payment statuses:

PENDING
SUBMITTED
VERIFIED
REJECTED
REFUNDED
CANCELLED


Teacher can review payments associated with their own courses.

27. PAYMENT VERIFICATION

When teacher approves a valid payment:

Payment:
SUBMITTED → VERIFIED

Enrollment:
PENDING_APPROVAL → ACTIVE


Use a database transaction.



The transaction must ensure that payment verification and enrollment activation cannot become inconsistent.



When rejected:

Payment:
SUBMITTED → REJECTED

Enrollment:
remains inactive


Teacher should provide a rejection reason where required.



Never allow a teacher to verify a payment belonging to another teacher.

28. PAYMENT PROOF SECURITY

Payment proof files must be private.



Do not expose them through public URLs.



Use protected file access.



Backend must verify:

Authenticated teacher
+
Teacher owns the related course/payment


before returning the file.



Validate:



File type

File size

Filename

Storage permissions

29. EXPIRING ENROLLMENTS

Create:

/teacher/expiring-students


Show students whose active enrollment is approaching expiration.



Example:

Alice
A1 Beginner
Expires in 7 days

[Send Reminder] [Extend]


Allow configured expiration windows such as:

7 days
3 days
1 day


Teacher can send reminders.



Teacher can extend access only when allowed by platform rules.



Record:



Old expiry

New expiry

Teacher

Reason

Timestamp



Create an audit log.

30. EXPIRATION RULE

When enrollment expires:

ACTIVE
   ↓
EXPIRED


Do not delete the student's account.



Do not automatically suspend the student's entire platform account.



Backend must block access to the expired course.



Student can still:



Login

View account

View previous history

Renew enrollment where supported

31. ATTENDANCE

Route:

/teacher/attendance


Teacher selects:

Class
↓
Date
↓
Lesson


Display students.



Attendance states:

PRESENT
ABSENT
LATE
EXCUSED


Teacher can:



Mark attendance

Edit attendance

View attendance history



Prevent duplicate attendance records for the same student/class/date/session unless explicitly editing the existing record.



Students should be able to view their attendance history through the Student Section.

32. PROGRESS MONITORING

Route:

/teacher/progress


Display:



Overall course progress

Lesson completion

Activity completion

Assignment performance

Quiz performance

Attendance

Skill performance



Skills:

Reading
Listening
Speaking
Writing
Grammar
Vocabulary
Pronunciation
Communication


Provide filters:

Course
Class
CEFR Level
Student
Date Range


Provide drill-down views.

33. TEACHER FEEDBACK

Teacher can provide feedback for:



Lesson

Assignment

Speaking

Writing

Pronunciation

Quiz

Overall progress



Feedback fields:

Student
Teacher
Course
Context
Feedback
Date


Example:

Your vocabulary has improved significantly.

Continue practicing speaking and pronunciation
to improve your communication skills.


Store feedback in PostgreSQL.



Notify the student.

34. TEACHER REPORTS

Route:

/teacher/reports


Create:

Student Report

Include:



Student information

Course

CEFR level

Overall progress

Skill performance

Attendance

Assignment scores

Quiz scores

Teacher feedback

Class Report

Include:



Class

Number of students

Average progress

Completion rate

Attendance

Assessment performance



Do not expose unnecessary private student information.

Course Report

Include:



Total enrollments

Active students

Completion

Average progress

Assessment performance

Expired enrollments

Payment Report

Include:



Total submitted

Verified

Rejected

Pending

Refunds

Revenue attributable to teacher-owned courses



Provide appropriate exports:

PDF
CSV
Excel


35. TEACHER CALENDAR

Route:

/teacher/calendar


Display:



Classes

Lessons

Assignment deadlines

Quiz dates

Student activities

Enrollment expiration reminders



Provide:

Month
Week
Day


views where practical.

36. CONTENT LIBRARY

Route:

/teacher/library


Teacher can upload and manage:

PDF
DOC/DOCX
Images
Audio
Video
Other permitted educational files


Features:



Upload

Search

Filter

Preview

Delete

Rename where supported

Attach to lesson

Attach to assignment



Files must be owned by the teacher unless explicitly designated as shared platform content.



Implement secure storage.

37. COURSE PREVIEW

Teacher must be able to preview a course before publishing.



Preview should simulate the student experience:

Course Overview
↓
Units
↓
Lessons
↓
Activities
↓
Practice
↓
Quiz


Preview mode must not accidentally create:



Enrollment

Student progress

Student grades

Payment

Attendance

38. COURSE PUBLISHING

Recommended workflow:

DRAFT
   ↓
Teacher completes course
   ↓
PREVIEW
   ↓
SUBMITTED_FOR_REVIEW
   ↓
Superadmin reviews
   ↓
APPROVED
   ↓
PUBLISHED


If Superadmin review is not enabled, use:

DRAFT
 ↓
PREVIEW
 ↓
PUBLISHED


Make this behavior configurable.



A published course becomes discoverable according to the platform's public course rules.

39. TEACHER NOTIFICATIONS

Route:

/teacher/notifications


Notifications may include:

New enrollment request
New payment submitted
Payment requires review
Student submitted assignment
Student completed quiz
Student requested clarification
Student enrollment expiring
Course approved
Course rejected
Course published


Support:



Read/unread

Mark as read

Mark all as read

Delete/archive where supported



Use backend APIs.

40. TEACHER SETTINGS

Route:

/teacher/settings


Sections:

Account

Email

Phone

Password

Notifications

Allow teacher to configure:



Enrollment notifications

Payment notifications

Assignment notifications

Quiz notifications

Expiration notifications

Platform notifications

Security

Change password

Active sessions where supported

Logout from sessions where supported



Teacher cannot change their role.

41. TEACHER API

Implement REST APIs under:

/api/v1


Teacher APIs should include at minimum:

GET    /teachers/me
PATCH  /teachers/me

GET    /teachers/dashboard

GET    /teachers/students
GET    /teachers/students/:studentId

GET    /teachers/courses
POST   /teachers/courses
GET    /teachers/courses/:courseId
PATCH  /teachers/courses/:courseId
DELETE /teachers/courses/:courseId

POST   /teachers/courses/:courseId/submit
POST   /teachers/courses/:courseId/publish
POST   /teachers/courses/:courseId/unpublish
POST   /teachers/courses/:courseId/archive

GET    /teachers/courses/:courseId/units
POST   /teachers/courses/:courseId/units
PATCH  /teachers/units/:unitId
DELETE /teachers/units/:unitId

GET    /teachers/units/:unitId/lessons
POST   /teachers/units/:unitId/lessons
PATCH  /teachers/lessons/:lessonId
DELETE /teachers/lessons/:lessonId

GET    /teachers/lessons/:lessonId/activities
POST   /teachers/lessons/:lessonId/activities
PATCH  /teachers/activities/:activityId
DELETE /teachers/activities/:activityId

GET    /teachers/classes
POST   /teachers/classes
GET    /teachers/classes/:classId
PATCH  /teachers/classes/:classId
DELETE /teachers/classes/:classId

GET    /teachers/enrollments
GET    /teachers/enrollments/:id
POST   /teachers/enrollments/:id/approve
POST   /teachers/enrollments/:id/reject
POST   /teachers/enrollments/:id/suspend
POST   /teachers/enrollments/:id/extend
POST   /teachers/enrollments/:id/renew

GET    /teachers/payments
GET    /teachers/payments/:id
POST   /teachers/payments/:id/approve
POST   /teachers/payments/:id/reject
POST   /teachers/payments/:id/request-clarification

GET    /teachers/assignments
POST   /teachers/assignments
GET    /teachers/assignments/:id
PATCH  /teachers/assignments/:id
DELETE /teachers/assignments/:id

GET    /teachers/submissions
GET    /teachers/submissions/:id
POST   /teachers/submissions/:id/grade

GET    /teachers/quizzes
POST   /teachers/quizzes
GET    /teachers/quizzes/:id
PATCH  /teachers/quizzes/:id
DELETE /teachers/quizzes/:id

GET    /teachers/attendance
POST   /teachers/attendance
PATCH  /teachers/attendance/:id

GET    /teachers/progress
GET    /teachers/students/:studentId/progress

POST   /teachers/students/:studentId/feedback
GET    /teachers/students/:studentId/feedback

GET    /teachers/reports/students
GET    /teachers/reports/classes
GET    /teachers/reports/courses
GET    /teachers/reports/payments

GET    /teachers/notifications
PATCH  /teachers/notifications/:id/read
POST   /teachers/notifications/read-all

GET    /teachers/library
POST   /teachers/library/upload
DELETE /teachers/library/:fileId


Use appropriate REST conventions if the existing backend has a different established structure.

42. BACKEND STRUCTURE

Implement teacher functionality using modular Node.js architecture.



Example:

backend/
└── src/
    ├── modules/
    │   └── teacher/
    │       ├── teacher.controller.ts
    │       ├── teacher.service.ts
    │       ├── teacher.repository.ts
    │       ├── teacher.routes.ts
    │       ├── teacher.validator.ts
    │       └── teacher.types.ts
    │
    ├── modules/
    │   ├── courses/
    │   ├── lessons/
    │   ├── activities/
    │   ├── assignments/
    │   ├── quizzes/
    │   ├── enrollments/
    │   ├── payments/
    │   ├── attendance/
    │   ├── progress/
    │   ├── feedback/
    │   ├── notifications/
    │   ├── reports/
    │   └── files/
    │
    ├── middleware/
    │   ├── auth.ts
    │   ├── roleGuard.ts
    │   └── errorHandler.ts
    │
    └── ...


Keep controllers thin.



Business logic belongs in services.



Database operations belong in repositories where appropriate.

43. DATABASE REQUIREMENTS

Use PostgreSQL through Prisma.



Teacher-related entities should support at minimum:

User
TeacherProfile
Course
CourseUnit
Lesson
LessonActivity
ActivityQuestion
Class
ClassStudent
Enrollment
Payment
Assignment
AssignmentSubmission
Quiz
QuizQuestion
QuizAttempt
Attendance
Progress
SkillPerformance
Feedback
Notification
File
AuditLog


Use proper:



Primary keys

Foreign keys

Unique constraints

Indexes

Created timestamps

Updated timestamps

Appropriate cascade/restrict behavior



Do not duplicate information unnecessarily.

44. OWNERSHIP AND AUTHORIZATION

Every teacher-owned resource must have an ownership relationship.



Examples:

Course.teacherId
Class.teacherId
Assignment.teacherId
Quiz.teacherId
Feedback.teacherId
File.teacherId


Before modifying a resource:

authenticate()
        ↓
verifyRole(TEACHER)
        ↓
verifyTeacherStatus(ACTIVE)
        ↓
verifyOwnership(resource, teacher)
        ↓
performAction()


A teacher must never be able to manipulate another teacher's:



Courses

Students

Payments

Classes

Grades

Assignments

Quizzes

Private files

45. BUSINESS RULES

Implement these rules on the backend.

Rule 1

Only approved active teachers can teach.

Rule 2

Teacher can manage only their own courses.

Rule 3

Teacher can access only students connected to their teaching relationships.

Rule 4

Teacher can verify only payments belonging to their courses.

Rule 5

Payment verification and enrollment activation must use a transaction.

Rule 6

Expired enrollment blocks course access.

Rule 7

Expired enrollment does not delete the student account.

Rule 8

Teacher cannot change global platform configuration.

Rule 9

Teacher cannot modify another teacher's grades.

Rule 10

Teacher cannot change their own role.

Rule 11

Teacher cannot approve themselves.

Rule 12

Teacher cannot access Superadmin functionality.

46. SECURITY REQUIREMENTS

Implement:



JWT authentication

Refresh token security

Password hashing

RBAC

Resource ownership checks

Zod validation

Rate limiting

Secure HTTP headers

CORS restrictions

Input sanitization where appropriate

SQL injection protection through Prisma

IDOR prevention

Secure file uploads

Private payment proof storage

Audit logs for sensitive actions



Sensitive operations include:

Payment approval
Payment rejection
Enrollment activation
Enrollment suspension
Enrollment extension
Course publishing
Course archiving
Grade changes
Account-sensitive changes


47. AUDIT LOGGING

Record important teacher actions.



Example:

Teacher approved payment
Teacher rejected enrollment
Teacher extended enrollment
Teacher published course
Teacher graded assignment
Teacher changed student score
Teacher suspended enrollment


Audit record should include:

Actor
Action
Resource type
Resource ID
Timestamp
Relevant metadata
IP/device information where permitted


Do not allow teachers to modify audit logs.

48. FRONTEND UX REQUIREMENTS

The Teacher Section must look like a professional modern educational SaaS platform.



Use:



Next.js

TypeScript

Tailwind CSS

shadcn/ui

Responsive layouts

Accessible components

Clear typography

Consistent spacing

Loading states

Skeleton loaders

Empty states

Error states

Confirmation dialogs

Toast notifications

Pagination

Search

Filters

Sort controls



Do not overcrowd pages.



Use reusable components.

49. DATA STATES

Every teacher page that loads backend data must support:

Loading
Success
Empty
Error
Unauthorized
Forbidden


Example empty state:

You don't have any courses yet.

Create your first English course to begin teaching.

[Create Course]


Do not show blank screens.

50. FORM VALIDATION

Use:

Zod
+
React Hook Form


Validate on both:

Frontend
Backend


Frontend validation improves UX.



Backend validation is authoritative.

51. API ERROR HANDLING

Use consistent API responses.



Example:

{
  "success": false,
  "message": "You are not authorized to access this course.",
  "code": "FORBIDDEN"
}


Use appropriate HTTP statuses:

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Internal Server Error


Do not expose sensitive internal errors to users.

52. TEACHER DASHBOARD API RESPONSE

The dashboard API should return real aggregated information such as:

student counts
course counts
class counts
pending enrollments
pending payments
grading workload
expiring enrollments
recent activities
analytics


Avoid loading hundreds of records just to calculate simple dashboard counts.



Use efficient database queries.

53. PERFORMANCE

Optimize teacher pages.



Implement:



Pagination

Server-side filtering

Efficient Prisma queries

Database indexes

Select only required fields

Avoid N+1 queries

Lazy loading where appropriate

Cached/aggregated analytics where appropriate



Large student lists must not load all students into the browser.

54. FILE MANAGEMENT

For profile images, certificates, course images, lesson resources and payment proofs, use the project's configured storage provider.



Possible providers:

Cloudinary
S3-compatible storage


Do not store large binary files directly inside PostgreSQL.



Store metadata such as:

filename
storageKey
mimeType
size
ownerId
resourceType
createdAt


55. NOTIFICATION FLOW

Example:

Student submits payment
        ↓
Backend creates notification
        ↓
Teacher receives:
"New payment submitted by Alice."


Another:

Student submits assignment
        ↓
Teacher notification
        ↓
Teacher grades
        ↓
Student notification


Another:

Enrollment expires soon
        ↓
Teacher notification
        ↓
Teacher sends reminder


56. TEACHER ANALYTICS

Provide meaningful analytics.

Student analytics

Total students
Active students
New students
Completed students
Expired students


Learning analytics

Average progress
Lesson completion
Assignment completion
Quiz completion
Course completion


Skill analytics

Reading
Listening
Speaking
Writing
Grammar
Vocabulary
Pronunciation
Communication


Payment analytics

Pending
Submitted
Verified
Rejected
Refunded


Do not create misleading analytics or unsupported calculations.

57. RESPONSIVE DESIGN

Teacher Section must work on:

Desktop
Laptop
Tablet
Mobile


Desktop:

Sidebar + Main Content


Tablet:

Collapsible Sidebar


Mobile:

Mobile Navigation
+ Bottom/Drawer navigation where appropriate


Tables should become responsive cards or horizontally scrollable structures where necessary.

58. ACCESSIBILITY

Implement:



Semantic HTML

Keyboard navigation

Visible focus states

Accessible labels

Form error messages

Adequate contrast

Screen-reader-friendly controls

Accessible dialogs

Accessible tables



Do not rely on color alone to communicate status.

59. TESTING

Create comprehensive tests.

Backend unit tests

Test:



Teacher services

Course ownership

Enrollment rules

Payment verification

Assignment grading

Quiz creation

Attendance

Expiration

Permissions

Backend integration tests

Use:

Jest
Supertest


Test API endpoints.

Frontend tests

Test:



Teacher navigation

Forms

Course creation

Lesson builder

Assignment grading

Payment approval

Enrollment management

Student profile

Dashboard states

End-to-end tests

Use:

Playwright


Test complete workflows.

60. CRITICAL END-TO-END TEST

The following scenario must work:

1. Teacher registers
2. Account becomes PENDING
3. Superadmin approves teacher
4. Teacher logs in
5. Teacher sees dashboard
6. Teacher creates course
7. Teacher creates Unit 1
8. Teacher creates Lesson 1
9. Teacher adds activities
10. Teacher creates quiz
11. Teacher previews course
12. Course is submitted/approved according to workflow
13. Course becomes published
14. Student requests enrollment
15. Student submits payment
16. Teacher receives notification
17. Teacher views payment
18. Teacher views payment proof
19. Teacher approves payment
20. Payment becomes VERIFIED
21. Enrollment becomes ACTIVE
22. Student gets course access
23. Teacher sees student in My Students
24. Teacher assigns assignment
25. Student submits assignment
26. Teacher receives notification
27. Teacher grades assignment
28. Student sees grade and feedback
29. Teacher marks attendance
30. Teacher views student progress
31. Teacher views analytics
32. Teacher generates student report
33. Enrollment approaches expiration
34. Teacher receives expiration notification
35. Teacher extends enrollment
36. Audit log records extension


Every step must work using real APIs and database data.

61. NO MOCK FUNCTIONALITY

During implementation, do not leave placeholder functionality such as:

TODO
Coming Soon
Fake Data
Mock Students
Mock Payments
Mock Analytics
alert("implemented")


unless a feature is explicitly designated as future functionality.



If a button is displayed, it should perform its intended action.



If a feature cannot yet be implemented, do not pretend it is complete.

62. TEACHER PERMISSIONS SUMMARY

The final authorization model must enforce:

TEACHER

✓ View own dashboard
✓ Manage own profile
✓ Manage own courses
✓ Manage own curriculum
✓ Manage own lessons
✓ Manage own activities
✓ Manage own classes
✓ View assigned/connected students
✓ Create assignments
✓ Grade own students
✓ Create quizzes
✓ View quiz results
✓ Mark attendance
✓ Monitor progress
✓ Give feedback
✓ Review payments for own courses
✓ Manage permitted enrollments
✓ Extend permitted enrollments
✓ Generate own reports
✓ Manage own content files
✓ Receive notifications

✗ Manage Superadmin
✗ Create Superadmin
✗ Change user roles
✗ Approve own teacher account
✗ Modify global platform settings
✗ Access another teacher's private students
✗ Access another teacher's private payments
✗ Modify another teacher's courses
✗ Modify another teacher's grades
✗ Change global CEFR configuration
✗ Access platform-wide audit administration


63. TEACHER PAGE MAP

Implement the following pages:

/auth/register/teacher

/teacher
/teacher/profile
/teacher/settings

/teacher/students
/teacher/students/:studentId

/teacher/courses
/teacher/courses/create
/teacher/courses/:courseId
/teacher/courses/:courseId/edit
/teacher/courses/:courseId/preview
/teacher/courses/:courseId/units

/teacher/courses/:courseId/lessons/create
/teacher/lessons/:lessonId/edit
/teacher/lessons/:lessonId/preview

/teacher/classes
/teacher/classes/create
/teacher/classes/:classId

/teacher/assignments
/teacher/assignments/create
/teacher/assignments/:assignmentId
/teacher/assignments/:assignmentId/submissions

/teacher/quizzes
/teacher/quizzes/create
/teacher/quizzes/:quizId
/teacher/quizzes/:quizId/analytics

/teacher/attendance
/teacher/progress

/teacher/enrollments
/teacher/payments
/teacher/expiring-students

/teacher/reports
/teacher/reports/students
/teacher/reports/classes
/teacher/reports/courses
/teacher/reports/payments

/teacher/calendar
/teacher/library
/teacher/notifications
/teacher/feedback


64. DEVELOPMENT ORDER

Implement the Teacher Section in this order:

Phase 1 — Teacher Authentication

Implement:



Teacher registration

Teacher login integration

Teacher approval state

Role protection

Profile



Test completely.

Phase 2 — Teacher Dashboard

Implement:



Dashboard

Statistics

Recent activity

Analytics

Notifications



Test real data.

Phase 3 — Courses

Implement:



Course CRUD

Course image

Course settings

Course ownership

Course publishing



Test ownership/security.

Phase 4 — Curriculum

Implement:



Units

Lessons

Ordering

Lesson content

Activities



Test curriculum creation.

Phase 5 — Assignments & Quizzes

Implement:



Assignment creation

Submission management

Grading

Quiz creation

Quiz attempts/results

Analytics



Test full assessment workflow.

Phase 6 — Classes & Students

Implement:



Classes

Student lists

Student profile

Invitations

Student assignment



Test authorization.

Phase 7 — Enrollment & Payments

Implement:



Enrollment requests

Payment submission visibility

Payment proof

Approval/rejection

Enrollment activation

Expiration

Renewal



Test database transactions carefully.

Phase 8 — Attendance & Progress

Implement:



Attendance

Progress

Skill analytics

Student performance



Test calculations.

Phase 9 — Feedback & Communication

Implement:



Feedback

Notifications

Calendar



Test notification flows.

Phase 10 — Reports

Implement:



Student reports

Class reports

Course reports

Payment reports

PDF/CSV/Excel export



Test report accuracy.

Phase 11 — Security & Quality

Perform:



RBAC testing

IDOR testing

Input validation testing

File security testing

API testing

Performance testing

Responsive testing

Accessibility testing

Phase 12 — End-to-End Testing

Run the complete teacher lifecycle from:

Registration
→ Approval
→ Course creation
→ Teaching
→ Enrollment
→ Payment verification
→ Assessment
→ Grading
→ Feedback
→ Progress
→ Reports
→ Expiration/Renewal


Do not mark the Teacher Section complete until the entire workflow works.

65. FINAL ACCEPTANCE CRITERIA

The Teacher Section is complete only when:



Teacher registration works.

Superadmin approval state works.

Teacher authentication works.

Teacher authorization works.

Dashboard uses real data.

Teacher profile works.

Course CRUD works.

Course ownership is enforced.

Curriculum builder works.

Lesson builder works.

Interactive activities work.

Assignments work.

Assignment submissions work.

Grading works.

Quizzes work.

Quiz results work.

Classes work.

Student management works.

Enrollment workflow works.

Payment verification works.

Payment proof is private.

Enrollment activation works.

Enrollment expiration works.

Enrollment extension works.

Attendance works.

Progress tracking works.

Skill performance works.

Feedback works.

Notifications work.

Calendar works.

Content library works.

Reports work.

Exports work.

Audit logging works for sensitive actions.

Backend authorization prevents cross-teacher access.

No frontend-only security is relied upon.

No fake/mock production functionality remains.

Responsive design works.

Accessibility requirements are addressed.

Backend tests pass.

Frontend tests pass.

End-to-end tests pass.

FINAL PRINCIPLE

Build the Teacher Section as a real production-ready Teacher Management and English Teaching Workspace.



The teacher must be able to manage the complete lifecycle:

CREATE
→ ORGANIZE
→ TEACH
→ ENROLL
→ VERIFY PAYMENT
→ ASSIGN
→ ASSESS
→ GRADE
→ GIVE FEEDBACK
→ TRACK
→ REPORT
→ RENEW


All important operations must be backed by:

Next.js Frontend
        ↓
Node.js + Express REST API
        ↓
Prisma
        ↓
PostgreSQL


The backend is the final authority for authentication, authorization, ownership, enrollment, payment, course access, grades, progress, and all teacher business rules.



Do not copy the branding, copyrighted content, or proprietary UI of any existing English-learning platform. Use existing platforms only as general inspiration for educational functionality and usability.