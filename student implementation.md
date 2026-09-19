STUDENT MODULE — COMPLETE DEVELOPMENT PROMPT

1. ROLE AND OBJECTIVE

You are developing the STUDENT module only of a professional English Learning Platform.



The platform has exactly three roles:



SUPERADMIN

TEACHER

STUDENT



For this task, focus exclusively on the STUDENT role.



Do not implement Superadmin or Teacher dashboards unless a small integration is required for student functionality.



The Student module must provide a complete learning experience from:



Registration → Profile → Placement Test → CEFR Recommendation → Course Discovery → Enrollment → Payment → Teacher Approval → Course Access → Lessons → Activities → Assignments → Quizzes → Attendance → Feedback → Progress → Course Completion → Certificate → Renewal



The system must be production-ready, responsive, secure, accessible, maintainable, and connected to the real backend.

2. TECHNOLOGY ARCHITECTURE

Frontend

Use:



Next.js

React

TypeScript

Tailwind CSS

shadcn/ui

React Hook Form

Zod

Responsive/mobile-first design



The frontend must NOT connect directly to PostgreSQL.



All student data must be retrieved and modified through the backend API.

Backend

Use:



Node.js

Express.js

TypeScript

REST API

Prisma ORM

PostgreSQL

Zod validation

JWT authentication

Refresh tokens

Argon2 or bcrypt password hashing



Base API:

/api/v1


API documentation:

/api/docs


3. STUDENT AUTHENTICATION

Create a complete student authentication system.

Student Registration

Route:

/auth/register/student


Registration fields:



Full name

Email

Phone number

Password

Confirm password

Country

City

Date of birth where required

Learning goals

English learning experience

Preferred learning schedule

Optional profile photo



Validate all fields using Zod.



The backend must:



Validate the request.

Check whether the email already exists.

Hash the password.

Create the user.

Assign role STUDENT.

Create StudentProfile.

Create necessary default settings.

Return a safe authentication response.



Never return the password.

Login

Create:

POST /api/v1/auth/login


Student logs in using:



Email

Password



After successful authentication:

Student → Student Dashboard


Authentication Security

Implement:



JWT access token

Refresh token

Token expiration

Refresh-token rotation

Logout

Password hashing

Rate limiting

Account protection

Secure cookies where appropriate

Role verification



A student must never access:

/admin/*
/teacher/*


4. STUDENT DASHBOARD

Route:

/student


Create a professional dashboard.

Dashboard Header

Display:

Good morning, [Student Name]
Continue your English learning journey.


Show profile avatar.



Display notification icon.



Display account menu.

Dashboard Statistics

Show real backend data:



Current CEFR level

Active courses

Overall progress

Lessons completed

Pending assignments

Pending quizzes

Average assessment score

Attendance percentage

Courses expiring soon



Do not use fake statistics.

Continue Learning

Show the most recently active course.



Display:



Course title

CEFR level

Current unit

Current lesson

Progress

Last activity

Continue button



Example:

Business English — B1

Unit 3
Meetings and Communication

Progress: 62%

[Continue Learning]


Upcoming Activities

Display:



Upcoming assignments

Upcoming quizzes

Scheduled classes

Deadlines

Recent Activity

Show:



Completed lesson

Quiz result

Assignment submission

Teacher feedback

Payment status

Enrollment updates

5. STUDENT PROFILE

Route:

/student/profile


Allow the student to view and edit permitted profile information.

Profile Information

Fields:



Profile photo

Full name

Email

Phone

Country

City

Biography

Learning goals

Preferred schedule

Languages

English experience

Account Information

Display:



Student ID

Account status

Registration date

Current CEFR level



The student must NOT be able to modify:



Role

Account status

Grades

Payment verification

Enrollment status

Teacher feedback

Attendance records

Profile API

GET   /api/v1/students/me
PATCH /api/v1/students/me


6. PLACEMENT TEST

Route:

/student/placement-test


Create a professional English placement test.



The test should help determine the student's English level.



Supported CEFR levels:

Pre-A1
A1
A2
B1
B2
C1
C2


Test Areas

Assess:



Grammar

Vocabulary

Reading

Listening

Communication/English usage



Speaking can be added when appropriate technology is available.

Placement Test Flow

Start Test
↓
Instructions
↓
Questions
↓
Submit
↓
Calculate Score
↓
Determine CEFR Level
↓
Show Recommendation
↓
Save Result


Placement Test Result

Display:

Your Recommended Level

B1 — Intermediate

Grammar: 78%
Vocabulary: 72%
Reading: 81%
Listening: 69%

Recommended learning path:
B1 English courses


The recommendation must be based on actual backend scoring rules.



Do not allow the frontend to determine or modify the final level.

APIs

GET  /api/v1/students/placement-test
POST /api/v1/students/placement-test/start
POST /api/v1/students/placement-test/submit


Store every completed attempt.

7. CEFR LEVEL SYSTEM

Use:

Pre-A1
A1
A2
B1
B2
C1
C2


Display the student's current level throughout the platform.



Example:

Current Level: B1


The student's level should be supported by placement tests and/or approved assessments.



Do not automatically promote students based only on lesson completion.



Maintain level history where appropriate.



Example:

A2 → B1


Store:



Previous level

New level

Assessment used

Score

Date

Source

8. COURSE DISCOVERY

Route:

/student/courses


Create a course marketplace/discovery page.



Students can:



Browse courses

Search courses

Filter courses

View course details

Request enrollment

Course Filters

Support:



CEFR level

Course category

Teacher

Price

Duration

Skill

Course status

Course Categories

Support:



General English

Business English

Academic English

English for IT

Interview English

English for Teachers

English for Rwanda

Course Card

Display:



Course image

Course title

Description

CEFR level

Teacher

Duration

Number of lessons

Price

Enrollment status

View Course button

9. COURSE DETAILS

Route:

/student/courses/:courseId


Display:

Course Overview

Course title

Description

Teacher

CEFR level

Duration

Price

Learning objectives

Skills covered

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

Curriculum Preview

Display:

Unit 1
 ├── Lesson 1
 ├── Lesson 2
 └── Lesson 3

Unit 2
 ├── Lesson 1
 ├── Lesson 2
 └── Lesson 3


Only content intended for public preview should be visible before enrollment.



Protected course content must remain inaccessible.

10. COURSE ENROLLMENT

When a student selects:

Enroll Now


create an enrollment request.



Initial status:

PENDING_PAYMENT


The student must NOT immediately receive full course access.



Flow:

View Course
↓
Enroll
↓
PENDING_PAYMENT
↓
View Payment Instructions
↓
Make Payment
↓
Submit Payment Information
↓
Teacher Reviews
↓
Payment VERIFIED
↓
Enrollment ACTIVE
↓
Course Access Granted


11. PAYMENT SUBMISSION

Route:

/student/payments


Students can submit payment information.



Fields:



Course

Enrollment

Amount

Currency

Payment method

Transaction/reference number

Payment date

Payment proof

Additional note



Supported payment methods should be configurable by the platform.



Do not hard-code payment providers into the student interface.

Payment Status

Use:

PENDING
SUBMITTED
VERIFIED
REJECTED
REFUNDED
CANCELLED


The student can view the payment status.



Example:

Payment Submitted

Course: Business English B1
Amount: 25,000 RWF
Reference: TXN12345
Status: Pending Verification


Payment proof must be securely stored and accessible only to authorized users.

12. ENROLLMENT STATUS

Use:

PENDING_PAYMENT
PAYMENT_SUBMITTED
PENDING_APPROVAL
ACTIVE
SUSPENDED
EXPIRED
REJECTED
COMPLETED
CANCELLED


The frontend must display the correct state from the backend.



Examples:

Pending payment

Payment Required


Pending approval

Waiting for Teacher Verification


Active

Course Active


Expired

Course Expired


Suspended

Access Suspended


13. MY COURSES

Route:

/student/my-courses


Organize courses into:

Active
Pending
Completed
Expired
Suspended


Each course card should display:



Course title

Teacher

CEFR level

Progress

Enrollment status

Start date

Expiration date

Continue button

View details

14. COURSE ACCESS CONTROL

Protected course content must require:

Authenticated Student
+
Correct Student Role
+
Valid Enrollment
+
ACTIVE Enrollment


The backend must verify ownership.



The student must not access another student's course.



The student must not access a course after expiration.



The student must not bypass payment approval by changing frontend requests.



Never trust frontend access checks.

15. LEARNING JOURNEY

Implement this complete learning flow:

Course
↓
Unit
↓
Lesson
↓
Activity
↓
Practice
↓
Assessment
↓
Feedback
↓
Progress
↓
Next Lesson


The system should remember where the student stopped.



When the student returns:

Continue Learning


should take them to the appropriate unfinished activity or lesson.

16. COURSE LEARNING PAGE

Route:

/student/learn/:courseId


Create a focused learning interface.

Layout

Desktop:

------------------------------------------------
Course / Unit / Lesson
------------------------------------------------
Sidebar          Main Learning Area
Lessons          Lesson Content
                 Activities
                 Practice
------------------------------------------------
Progress         Previous | Next
------------------------------------------------


Mobile should provide a simplified navigation drawer.

Sidebar

Show:

Unit 1
 ✓ Lesson 1
 ✓ Lesson 2
 → Lesson 3
 ○ Lesson 4

Unit 2
 ○ Lesson 1
 ○ Lesson 2


Use real completion status.

17. LESSON SYSTEM

A lesson may contain:



Text

Images

Audio

Video

Vocabulary

Grammar

Examples

Reading

Listening

Speaking

Writing

Interactive activities



Lesson information:



Title

Description

Learning objectives

CEFR level

Estimated duration

Content

Activities

Resources

18. INTERACTIVE ACTIVITIES

Support:

Multiple Choice

What is the correct answer?

A
B
C
D


True/False

True
False


Fill in the Blank

She ___ to school every day.


Matching

Match:

Word → Meaning


Sentence Ordering

Allow students to arrange words into the correct sentence.

Listening Quiz

Student listens to audio and answers questions.

Vocabulary Activity

Practice word meanings and usage.

Speaking Activity

Provide speaking prompts where supported.

Writing Activity

Allow students to submit written responses.

19. ACTIVITY ATTEMPTS

Every interactive activity submission should be stored.



Store:



Student ID

Activity ID

Course ID

Attempt number

Answer

Score

Correct/incorrect

Started time

Submitted time



The backend calculates the score.



Do not trust a score submitted by the browser.

20. VOCABULARY LEARNING

Create vocabulary cards containing:



Word

Pronunciation

Meaning

Example sentence

Audio where available

Image where appropriate



Example:

COMMUNICATE

Pronunciation:
...

Meaning:
To share information or ideas.

Example:
Good communication is important at work.


Track vocabulary activity where appropriate.

21. GRAMMAR LEARNING

Structure grammar lessons as:

Grammar Topic
↓
Explanation
↓
Rules
↓
Examples
↓
Practice
↓
Quiz


Example topics:



Present Simple

Past Simple

Present Perfect

Modal verbs

Conditionals

Passive voice

Reported speech

Articles

Prepositions



Content should be appropriate to the course CEFR level.

22. ASSIGNMENTS

Route:

/student/assignments


Assignment categories:



Writing

Reading

Vocabulary

Grammar

Listening

Speaking



Assignment status:

ASSIGNED
IN_PROGRESS
SUBMITTED
LATE
GRADED


Display:



Assignment title

Course

Unit

Lesson

Instructions

Due date

Maximum score

Status

Teacher

23. ASSIGNMENT SUBMISSION

Route:

/student/assignments/:id


Students may submit:



Text answers

Documents

Images

Audio/speaking submissions where supported



Before final submission show confirmation:

Are you sure you want to submit?

You may not be able to edit this submission afterward.

[Cancel]
[Submit]


Store:



Student

Assignment

Submission

Files

Submission date

Status

Late status



Teacher feedback and grading should appear after grading.

24. QUIZZES

Route:

/student/quizzes


Display:



Quiz title

Course

Unit

Lesson

Number of questions

Time limit

Passing score

Attempts remaining

Status

Quiz Types

Support:



Multiple choice

True/false

Fill blank

Matching

Sentence ordering

Quiz Experience

Flow:

Quiz Instructions
↓
Start Quiz
↓
Questions
↓
Timer
↓
Submit
↓
Backend Scoring
↓
Result


Backend must validate:



Student enrollment

Quiz access

Attempt limit

Time limit

Quiz availability

25. QUIZ RESULTS

After submission display:

Quiz Complete

Score: 82%

Status: PASSED

Correct: 41
Incorrect: 9

[Review Results]


Depending on teacher/course settings, correct answers may be shown immediately or later.



Store every attempt.

26. STUDENT PROGRESS

Route:

/student/progress


Display real progress.

Overall Progress

Show:



Overall course progress

Completed lessons

Completed activities

Assignments

Quizzes

Attendance

Average assessment score

Skill Performance

Track:

Reading
Listening
Speaking
Writing
Grammar
Vocabulary
Pronunciation
Communication


Example:

Reading       78%
Listening     69%
Speaking      72%
Writing       81%
Grammar       75%
Vocabulary    84%


These values must come from real backend data.



Do not allow students to manually modify them.

27. ATTENDANCE

Route:

/student/attendance


Students have view-only access.



Statuses:

PRESENT
ABSENT
LATE
EXCUSED


Display:



Course/class

Date

Lesson/class

Status

Attendance percentage



The student cannot change attendance.

28. TEACHER FEEDBACK

Route:

/student/feedback


Display feedback provided by teachers.



Feedback categories:



Lesson feedback

Assignment feedback

Speaking feedback

Writing feedback

Pronunciation feedback

Overall feedback



Each feedback record should contain:



Teacher

Course

Context

Feedback

Date

Score where applicable



Student access is read-only.

29. RESULTS

Create:

/student/results


Display academic results including:



Assignment scores

Quiz scores

Assessment scores

Skill performance

Average scores

Pass/fail status



Students cannot modify results.

30. NOTIFICATIONS

Route:

/student/notifications


Notify students about:



Enrollment updates

Payment submitted

Payment verified

Payment rejected

Course activation

New lesson

New assignment

Assignment graded

New quiz

Quiz result

Teacher feedback

Course expiration

Course completion

Certificate availability



Notification fields:



Title

Message

Type

Created date

Read status



APIs:

GET   /api/v1/students/notifications
PATCH /api/v1/students/notifications/:id/read


31. CALENDAR

Route:

/student/calendar


Display:



Classes

Lessons

Assignment deadlines

Quiz dates

Scheduled activities

Course expiration dates



Use different visual indicators for different activity types.

32. COURSE EXPIRATION

Every paid enrollment may have an expiration date.



Example:

Course expires in 7 days


Provide warnings:

7 days before expiration
3 days before expiration
1 day before expiration


When the expiration date is reached:

ACTIVE → EXPIRED


The student account remains active.



Do NOT delete:



Progress

Results

Assignments

Feedback

Attendance

Payment history

Certificate history



However, protected course learning content must become inaccessible.



Display:

Your course access has expired.

Your learning history and results are still available.

[Renew Course]


33. COURSE RENEWAL

If renewal is enabled:

Expired Course
↓
Renew
↓
Payment Instructions
↓
Payment Submission
↓
Teacher Verification
↓
ACTIVE


Do not automatically reactivate the enrollment after a student submits payment.



Verification must happen according to the payment workflow.

34. COURSE COMPLETION

A course should be marked complete only when the backend determines that the required completion criteria have been met.



Possible criteria:



Required lessons completed

Required activities completed

Required assignments submitted

Required quizzes passed

Required attendance achieved

Final assessment passed



Do not allow the student to manually mark the course as completed.



Status:

ACTIVE → COMPLETED


35. CERTIFICATES

Route:

/student/certificates


After course completion, generate or expose a certificate.



Certificate should contain:



Student name

Course name

CEFR level

Teacher

Completion date

Certificate ID

Verification code

QR verification where supported



Actions:

View
Download
Verify


Certificate data must be generated from backend records.



Students must not be able to edit certificates.

36. PAYMENT HISTORY

Route:

/student/payments


Display:



Course

Amount

Currency

Payment method

Reference

Payment date

Status



Allow students to view their own payment history only.



Never expose another student's payments.

37. ENROLLMENT HISTORY

Route:

/student/enrollments


Display:



Course

Teacher

Enrollment date

Status

Start date

Expiration date

Completion date



Statuses should be clearly displayed.

38. STUDENT SIDEBAR

Create the following navigation:

STUDENT

Dashboard

Learning
 ├── My Courses
 ├── Explore Courses
 ├── Placement Test
 └── Progress

Activities
 ├── Lessons
 ├── Assignments
 └── Quizzes

Performance
 ├── Results
 ├── Attendance
 └── Feedback

Enrollment & Payments
 ├── My Enrollments
 └── Payment History

Certificates

Calendar

Notifications

Account
 ├── Profile
 └── Settings


On mobile, convert this into a responsive navigation drawer/bottom navigation where appropriate.

39. STUDENT SETTINGS

Route:

/student/settings


Allow:



Change password

Notification preferences

Email notification settings

Learning preferences

Language preferences

Profile preferences



The student cannot change:

Role
Account approval status
Grades
Enrollment status
Payment verification
Teacher records


40. DATABASE ENTITIES

Implement the necessary Prisma models.



At minimum consider:

User
StudentProfile

PlacementTest
PlacementTestAttempt
PlacementQuestion
PlacementAnswer

Course
CourseUnit
Lesson
LessonActivity
ActivityAttempt

Enrollment
Payment

Assignment
AssignmentSubmission

Quiz
QuizQuestion
QuizAttempt
QuizAnswer

Attendance

Progress
SkillPerformance

Feedback

Notification

Certificate


Use proper relationships, indexes, timestamps, constraints, and foreign keys.

41. IMPORTANT DATABASE RELATIONSHIPS

Example:

User
 └── StudentProfile

Student
 ├── PlacementTestAttempt
 ├── Enrollment
 ├── Payment
 ├── ActivityAttempt
 ├── AssignmentSubmission
 ├── QuizAttempt
 ├── Attendance
 ├── Progress
 ├── Feedback
 ├── Notification
 └── Certificate

Course
 ├── CourseUnit
 │    └── Lesson
 │         └── LessonActivity
 ├── Enrollment
 ├── Payment
 ├── Assignment
 └── Quiz


Use transactions for critical operations.

42. STUDENT API

Implement student APIs such as:

GET    /api/v1/students/me
PATCH  /api/v1/students/me

GET    /api/v1/students/dashboard

GET    /api/v1/students/courses
GET    /api/v1/students/courses/:courseId
POST   /api/v1/students/courses/:courseId/enroll

GET    /api/v1/students/my-courses

GET    /api/v1/students/enrollments
GET    /api/v1/students/enrollments/:id

GET    /api/v1/students/payments
POST   /api/v1/students/payments
GET    /api/v1/students/payments/history

GET    /api/v1/students/placement-test
POST   /api/v1/students/placement-test/start
POST   /api/v1/students/placement-test/submit

GET    /api/v1/students/courses/:courseId/progress

GET    /api/v1/students/lessons/:lessonId
POST   /api/v1/students/lessons/:lessonId/complete

GET    /api/v1/students/activities/:activityId
POST   /api/v1/students/activities/:activityId/submit

GET    /api/v1/students/assignments
GET    /api/v1/students/assignments/:id
POST   /api/v1/students/assignments/:id/submit

GET    /api/v1/students/quizzes
GET    /api/v1/students/quizzes/:id
POST   /api/v1/students/quizzes/:id/start
POST   /api/v1/students/quizzes/:id/submit

GET    /api/v1/students/progress
GET    /api/v1/students/results

GET    /api/v1/students/attendance
GET    /api/v1/students/feedback

GET    /api/v1/students/notifications
PATCH  /api/v1/students/notifications/:id/read

GET    /api/v1/students/certificates

GET    /api/v1/students/enrollments/history
GET    /api/v1/students/payments/history


Use consistent response structures and error handling.

43. STUDENT AUTHORIZATION

Every protected endpoint must verify:

Authenticated
+
Role = STUDENT
+
Resource ownership
+
Enrollment permission where required
+
Enrollment status where required


For example:

Student A requests Student B's assignment.


The backend must return:

403 Forbidden


or an appropriate authorization response.



Never rely only on hidden frontend buttons.

44. PROGRESS SECURITY

Progress must be calculated from real events.



For example:

Lesson completed
Activity completed
Quiz submitted
Assignment graded


The student should not be able to send:

progress: 100


and make the backend accept it.



The backend must calculate authoritative progress.

45. FILE UPLOAD SECURITY

For assignment submissions, profile photos, payment proof, and supported learning submissions:



Implement:



File type validation

File size limits

Secure storage

Unique filenames

Authorization checks

Private storage for sensitive files

Virus/malware scanning where available

No executable uploads



Never expose private payment proofs publicly.

46. RESPONSIVE DESIGN

The Student module must work on:



Desktop

Laptop

Tablet

Mobile phone



Test at common screen widths.



Mobile learning should remain comfortable.



Use:



Responsive sidebar

Mobile navigation

Responsive cards

Responsive tables

Touch-friendly buttons

Readable typography

Appropriate spacing

47. ACCESSIBILITY

Implement:



Semantic HTML

Keyboard navigation

Visible focus states

Proper labels

Accessible forms

Alt text for images

Accessible dialogs

Sufficient contrast

Screen-reader-friendly navigation



Do not rely on color alone to communicate status.

48. UX REQUIREMENTS

The student interface should feel professional and simple.



Prioritize:

Clarity
Consistency
Speed
Accessibility
Easy navigation
Learning focus


Avoid unnecessary animations.



Use clear states:

Loading
Empty
Success
Error
Pending
Locked
Expired
Completed


Every important action must provide feedback.

49. ERROR HANDLING

Create clear student-friendly error messages.



Examples:

Unable to load your course.
Please try again.

Your payment has already been submitted.

This course is no longer available.

Your enrollment has expired.

You do not have permission to access this content.

This assignment deadline has passed.

You have reached the maximum number of quiz attempts.


Never expose stack traces or sensitive backend errors.

50. LOADING STATES

Use skeleton loaders for:



Dashboard

Courses

Lessons

Assignments

Quizzes

Progress

Notifications



Avoid blank screens.

51. EMPTY STATES

Create useful empty states.



Example:

You haven't enrolled in a course yet.

Explore courses and start your English learning journey.

[Explore Courses]


For assignments:

No assignments available.
You're all caught up!


52. STUDENT DASHBOARD DATA

All dashboard information must come from the backend.



Do not use:

Hard-coded students
Fake courses
Fake progress
Fake payment status
Fake quiz scores
Fake notifications


Mock data may only be used during initial development/testing and must be clearly separated from production data.

53. API CLIENT

Create a centralized frontend API client.



Example architecture:

frontend/
├── app/
├── components/
├── features/
│   └── student/
├── lib/
│   ├── api/
│   ├── auth/
│   └── validation/
├── hooks/
├── types/
└── services/


Do not scatter raw fetch() calls throughout components.



Centralize:



Authentication

Headers

Token refresh

Error handling

API responses

54. STUDENT COMPONENTS

Create reusable components such as:

StudentSidebar
StudentHeader
ProfileCard
CourseCard
ProgressCard
LessonCard
AssignmentCard
QuizCard
NotificationItem
PaymentStatusBadge
EnrollmentStatusBadge
ProgressBar
SkillProgressCard
LessonSidebar
ActivityRenderer
QuizQuestion
AssignmentSubmissionForm
FeedbackCard
CertificateCard


Keep components reusable and maintainable.

55. STUDENT ROUTE STRUCTURE

Recommended frontend structure:

/student
├── page.tsx
├── profile/
├── settings/
├── courses/
│   └── [courseId]/
├── my-courses/
├── learn/
│   └── [courseId]/
├── placement-test/
├── progress/
├── assignments/
│   └── [id]/
├── quizzes/
│   └── [id]/
├── results/
├── attendance/
├── feedback/
├── enrollments/
├── payments/
├── certificates/
├── calendar/
└── notifications/


Protect all student routes with authentication and role checks.

56. STUDENT WORKFLOW

Implement the complete workflow:

REGISTER
↓
LOGIN
↓
COMPLETE PROFILE
↓
TAKE PLACEMENT TEST
↓
RECEIVE CEFR RECOMMENDATION
↓
EXPLORE COURSES
↓
VIEW COURSE
↓
REQUEST ENROLLMENT
↓
PENDING PAYMENT
↓
MAKE PAYMENT
↓
SUBMIT PAYMENT PROOF
↓
PENDING APPROVAL
↓
TEACHER VERIFIES PAYMENT
↓
ENROLLMENT ACTIVE
↓
ACCESS COURSE
↓
OPEN UNIT
↓
OPEN LESSON
↓
COMPLETE ACTIVITIES
↓
COMPLETE PRACTICE
↓
SUBMIT ASSIGNMENTS
↓
TAKE QUIZZES
↓
RECEIVE GRADES
↓
RECEIVE TEACHER FEEDBACK
↓
TRACK PROGRESS
↓
ATTEND CLASSES
↓
COMPLETE REQUIRED COURSE CONTENT
↓
PASS REQUIRED ASSESSMENTS
↓
COURSE COMPLETED
↓
CERTIFICATE
↓
RENEW / ENROLL IN NEXT COURSE


57. SECURITY TESTING

Test that a student cannot:



Access Superadmin pages

Access Teacher pages

Access another student's profile

Access another student's assignments

Access another student's payments

Change grades

Change quiz scores

Change attendance

Change progress

Approve payments

Activate enrollment

Change course content

Change teacher feedback

Access expired protected content

Bypass payment verification

Upload dangerous files

Manipulate IDs to access another student's resources



Test both frontend and backend authorization.

58. STUDENT FUNCTIONAL TESTING

Test:

Authentication

Registration

Login

Logout

Invalid password

Duplicate email

Password validation

Token expiration

Profile

View profile

Edit profile

Upload photo

Change password

Placement

Start test

Answer questions

Submit

Calculate result

Save attempt

Show CEFR recommendation

Courses

Browse

Search

Filter

View details

Enroll

Payment

Submit payment

Upload proof

View status

View history

Enrollment

Pending payment

Pending approval

Active

Suspended

Expired

Completed

Learning

Open course

Open unit

Open lesson

Complete lesson

Complete activity

Save progress

Resume learning

Assignments

View assignment

Start

Submit

Submit late where allowed

View grade

View feedback

Quizzes

Start

Answer

Timer

Submit

Score

Attempt limits

Results

Progress

Course progress

Unit progress

Skill progress

Assessment results

Attendance

View records

View percentage

Notifications

Receive

Read

Mark as read

Certificate

Course completion

Certificate generation

Certificate display

Download/verification where implemented

59. TESTING TOOLS

Use:

Backend

Jest
Supertest


Test:



Authentication

Authorization

Student APIs

Enrollment

Payments

Progress

Assignments

Quizzes

Frontend

Use:

Playwright


Test complete student journeys.

60. END-TO-END TEST

Create at least one complete end-to-end student scenario:

Register student
↓
Login
↓
Complete profile
↓
Take placement test
↓
Receive CEFR level
↓
Browse course
↓
Enroll
↓
Submit payment
↓
Simulate teacher verification
↓
Confirm enrollment ACTIVE
↓
Open course
↓
Complete lesson
↓
Complete activity
↓
Submit assignment
↓
Take quiz
↓
Receive result
↓
View progress
↓
View attendance
↓
View feedback
↓
Complete course
↓
View certificate


The complete flow must work using real database records.

61. PERFORMANCE

Optimize:



API requests

Database queries

Course loading

Lesson loading

Images

Audio/video loading

Dashboard queries

Progress calculations



Use pagination for large lists.



Avoid unnecessary API calls.

62. DATA PRIVACY

A student should only receive data they are authorized to see.



Never expose:



Other students' personal information

Other students' payments

Other students' grades

Teacher private information beyond intended profile data

Internal administrative information

Private payment proofs



Apply authorization on every backend resource.

63. AUDITABILITY

Important student actions should be logged where appropriate:



Login

Logout

Enrollment request

Payment submission

Assignment submission

Quiz submission

Profile changes

Course completion

Certificate generation



Audit logs must not be editable by the student.

64. IMPLEMENTATION RULES

Follow these rules strictly:



Do not build only the UI.

Connect every feature to the real backend.

Do not use fake data in production.

Do not allow frontend-only authorization.

Do not allow students to modify protected academic records.

Do not allow access to courses without valid enrollment.

Do not allow access after expiration.

Validate all API input with Zod.

Use Prisma for database access.

Use transactions for payment/enrollment state changes.

Keep Student functionality isolated from Teacher and Superadmin functionality.

Follow REST API conventions.

Use TypeScript throughout frontend and backend.

Handle loading, error, empty, pending, locked, expired, and success states.

Make the entire Student module responsive.

Test every major workflow before considering it complete.

65. FINAL STUDENT ACCEPTANCE CRITERIA

The Student module is complete only when a student can successfully:

✓ Register
✓ Login
✓ Manage profile
✓ Take placement test
✓ Receive CEFR recommendation
✓ Explore courses
✓ View course details
✓ Request enrollment
✓ Submit payment
✓ View payment status
✓ View enrollment status
✓ Access active courses
✓ Navigate units
✓ Study lessons
✓ Complete activities
✓ Track learning progress
✓ Submit assignments
✓ Take quizzes
✓ View results
✓ View attendance
✓ Receive teacher feedback
✓ Receive notifications
✓ View calendar
✓ Handle course expiration
✓ Renew eligible courses
✓ Complete courses
✓ Receive certificates
✓ View payment history
✓ View enrollment history
✓ Change allowed settings
✓ Use the platform on mobile and desktop


The backend must enforce all permissions and business rules.



The final Student module must behave as a real production learning platform, not as a static demo.