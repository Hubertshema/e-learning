COURSES & MULTI-SKILL LESSONS — COMPLETE DEVELOPMENT PROMPT

Implement a complete, production-ready **Course Management and Multi-Skill Learning System** for the English Learning Platform.

The platform has exactly three roles:

- SUPERADMIN
- TEACHER
- STUDENT

The system must support structured English learning based on **CEFR levels**:

```text
Pre-A1
A1
A2
B1
B2
C1
C2
```

The core learning hierarchy must be:

```text
COURSE
   ↓
UNIT
   ↓
LESSON
   ↓
SKILL SECTIONS
   ↓
ACTIVITIES
   ↓
LESSON ASSESSMENT
   ↓
UNIT ASSESSMENT
   ↓
COURSE ASSESSMENT
   ↓
COMPLETION
   ↓
CERTIFICATE
```

The system must support both:

1. Multi-skill lessons
2. Single-skill lessons

A multi-skill lesson should combine multiple English skills around one topic instead of forcing every skill to become a separate lesson.

---

# 1. COURSE CONCEPT

A Course represents a complete English learning program that a student can enroll in.

Example:

```text
A2 General English — Everyday Communication
```

A course should contain:

- Course title
- Course code
- Description
- Cover image
- Teacher
- CEFR level
- Category
- Learning objectives
- Prerequisites
- Duration
- Price
- Currency
- Skills covered
- Number of units
- Number of lessons
- Completion requirements
- Certificate settings
- Enrollment settings
- Course status

Course statuses:

```text
DRAFT
PENDING_REVIEW
APPROVED
PUBLISHED
ARCHIVED
SUSPENDED
```

Only authorized users can change course status.

---

# 2. COURSE CATEGORIES

Create reusable course categories.

Examples:

```text
General English
Business English
Academic English
English for IT
English for Travel
Conversation English
Grammar
Exam Preparation
English for Beginners
Professional English
```

Superadmin should manage categories.

Teachers select categories when creating courses.

---

# 3. CEFR LEVEL

Every course must have a CEFR level.

Supported levels:

```text
Pre-A1
A1
A2
B1
B2
C1
C2
```

The CEFR level must influence:

- Course difficulty
- Vocabulary
- Grammar
- Reading complexity
- Listening complexity
- Speaking tasks
- Writing tasks
- Assessment difficulty
- AI-generated content

Do not allow AI-generated content to ignore the selected CEFR level.

---

# 4. COURSE LEARNING OBJECTIVES

Every course should have measurable learning objectives.

Example:

```text
By the end of this course, students will be able to:

1. Communicate in common everyday situations.
2. Understand common spoken English.
3. Write short structured texts.
4. Use appropriate grammar and vocabulary.
5. Participate in conversations.
```

Teachers can manually create objectives or use the AI Teaching Assistant to generate suggested objectives.

AI-generated objectives must remain editable.

---

# 5. COURSE SKILLS

Each course should define which skills it covers.

Supported skills:

```text
READING
LISTENING
SPEAKING
WRITING
GRAMMAR
VOCABULARY
PRONUNCIATION
COMMUNICATION
```

Allow the teacher to select:

- Primary skills
- Supporting skills

Example:

```text
Primary:
Speaking

Supporting:
Vocabulary
Grammar
Listening
Pronunciation
Communication
```

---

# 6. COURSE STRUCTURE

A course must contain Units.

Example:

```text
A2 General English

Unit 1 — Introducing Yourself
Unit 2 — Family and Relationships
Unit 3 — Food and Restaurants
Unit 4 — Shopping
Unit 5 — Travel
Unit 6 — Health
Unit 7 — Work
Unit 8 — Everyday Communication
```

Each Unit contains lessons.

---

# 7. UNIT MODEL

A Unit represents a major topic or learning area.

Each Unit should have:

- Unit ID
- Course ID
- Title
- Description
- Cover image
- Learning objectives
- Order
- Estimated duration
- Required lessons
- Unit assessment
- Completion percentage
- Published status

Unit statuses:

```text
DRAFT
PUBLISHED
ARCHIVED
```

---

# 8. UNIT LEARNING OBJECTIVES

Each unit should contain measurable objectives.

Example:

```text
Unit:
Travel

Objectives:

- Describe travel plans.
- Understand travel-related conversations.
- Use travel vocabulary.
- Ask for and give travel information.
```

Objectives can be manually created or AI-generated.

---

# 9. LESSON MODEL

A Lesson is the main learning experience.

Every lesson should have:

- Lesson ID
- Unit ID
- Title
- Description
- CEFR level
- Duration
- Primary skill
- Supporting skills
- Learning objectives
- Prerequisites
- Lesson content
- Activities
- Assessment
- Completion rules
- Order
- Status

Lesson statuses:

```text
DRAFT
PUBLISHED
ARCHIVED
```

---

# 10. MULTI-SKILL LESSON

The system must support lessons that combine several English skills around one topic.

Example:

```text
Lesson:
Planning a Trip

Primary Skill:
Speaking

Supporting Skills:
Vocabulary
Grammar
Reading
Listening
Writing
Pronunciation
Communication
```

The lesson structure should be:

```text
Planning a Trip
│
├── Introduction
├── Vocabulary
├── Grammar
├── Reading
├── Listening
├── Speaking
├── Writing
├── Pronunciation
├── Communication
├── Practice
└── Lesson Assessment
```

Not every lesson must contain every skill.

The teacher chooses which skill sections are required.

---

# 11. LESSON SKILL MAP

Create a configurable skill map.

Example:

```text
Lesson: Planning a Trip

✓ Vocabulary
✓ Grammar
✓ Reading
✓ Listening
✓ Speaking
✓ Writing
✓ Communication
✗ Pronunciation
```

Another lesson:

```text
Lesson: Writing a Formal Email

✓ Writing
✓ Grammar
✓ Vocabulary
✓ Reading
✗ Listening
✗ Speaking
```

The system must support both configurations.

---

# 12. PRIMARY AND SUPPORTING SKILLS

Each lesson must allow:

```text
Primary Skill:
Speaking

Supporting Skills:
Vocabulary
Grammar
Listening
Pronunciation
Communication
```

Primary skill should appear prominently in the lesson information and teacher reports.

---

# 13. LESSON CONTENT SECTIONS

A lesson may contain:

### Introduction

Explain:

- What the lesson is about
- Why it matters
- What the student will learn

### Vocabulary

Include:

- Word
- Definition
- Example
- Pronunciation
- Audio where available
- Image where useful

### Grammar

Include:

- Explanation
- Rules
- Examples
- Common mistakes
- Practice

### Reading

Include:

- Reading text
- Vocabulary support
- Comprehension questions

### Listening

Include:

- Audio
- Transcript
- Listening instructions
- Questions

### Speaking

Include:

- Speaking prompt
- Instructions
- Useful expressions
- Speaking rubric

### Writing

Include:

- Writing prompt
- Instructions
- Word limit
- Rubric

### Pronunciation

Include:

- Target sounds
- Words
- Examples
- Practice

### Communication

Include:

- Real-world scenario
- Role-play
- Conversation task
- Problem-solving activity

---

# 14. ACTIVITY ENGINE

Create a reusable Activity system.

Supported activity types:

```text
MULTIPLE_CHOICE
TRUE_FALSE
FILL_BLANK
MATCHING
ORDERING
SHORT_ANSWER
READING
LISTENING
SPEAKING
WRITING
PRONUNCIATION
FLASHCARDS
DRAG_DROP
ROLE_PLAY
```

Each activity should have:

- Activity ID
- Lesson ID
- Skill
- Title
- Instructions
- Content
- Difficulty
- Marks
- Time limit where applicable
- Order
- Required/optional status

---

# 15. MULTIPLE CHOICE

Support:

```text
Question
Option A
Option B
Option C
Option D
Correct answer
Explanation
Marks
```

Teachers can add more or fewer options where appropriate.

---

# 16. TRUE/FALSE

Support:

```text
Statement
Correct answer
Explanation
Marks
```

---

# 17. FILL-IN-THE-BLANK

Support:

```text
Sentence
Blank
Correct answer
Acceptable alternatives
Explanation
```

---

# 18. MATCHING

Support:

```text
Items
Matches
Correct pairs
Marks
```

---

# 19. ORDERING

Allow students to arrange:

- Words
- Sentences
- Steps
- Events

Store the correct order securely on the backend.

---

# 20. READING ACTIVITIES

A reading activity should support:

```text
Title
Reading passage
Vocabulary assistance
Questions
Answer key
Marks
Difficulty
```

Track:

- Attempts
- Score
- Completion
- Time where appropriate

---

# 21. LISTENING ACTIVITIES

Support:

```text
Audio file
Transcript
Instructions
Questions
Answer key
Marks
```

Audio should be stored through secure object storage.

Do not expose private storage credentials to the frontend.

---

# 22. SPEAKING ACTIVITIES

A speaking activity should contain:

```text
Prompt
Instructions
Expected skills
Preparation time
Response duration
Rubric
```

The first version may allow students to submit:

- Audio recording
- Text response where appropriate

Future versions may integrate speech recognition.

---

# 23. WRITING ACTIVITIES

Support:

```text
Writing prompt
Instructions
Minimum words
Maximum words
Required structure
Rubric
Submission type
```

Teacher can review and grade the submission.

---

# 24. PRONUNCIATION ACTIVITIES

Support:

```text
Target word
Target sound
Example
Audio
Student recording
Teacher evaluation
```

Design the database so automatic pronunciation analysis can be added later.

---

# 25. COMMUNICATION ACTIVITIES

Support realistic English situations.

Examples:

```text
Ordering food
Checking into a hotel
Job interview
Asking for directions
Making an appointment
Shopping
Travel planning
Customer service
Meeting someone
Making a complaint
```

These activities should encourage practical communication.

---

# 26. LESSON ASSESSMENT

Each lesson can have an assessment.

Example:

```text
Lesson Assessment

Vocabulary       5 marks
Grammar          5 marks
Reading          5 marks
Listening        5 marks
Total           20 marks
```

The teacher defines:

- Questions
- Marks
- Passing score
- Required/optional
- Attempts
- Time limit

---

# 27. LESSON COMPLETION

Do not mark a lesson complete merely because the student opens it.

The teacher should configure completion requirements.

Example:

```text
Required:

✓ View lesson
✓ Complete vocabulary
✓ Complete grammar
✓ Complete reading
✓ Complete listening
✓ Submit speaking task
✓ Submit writing task
✓ Pass lesson assessment with ≥70%
```

The backend calculates completion.

The student cannot manually mark a lesson complete.

---

# 28. UNIT ASSESSMENT

Each Unit can have an assessment.

Example:

```text
Unit 2 — Travel

Lessons:
1. Planning a Trip
2. Airport English
3. Hotel Reservations
4. Travel Problems

Unit Assessment
```

The assessment can combine:

- Grammar
- Vocabulary
- Reading
- Listening
- Speaking
- Writing

The teacher chooses the assessment structure.

---

# 29. COURSE ASSESSMENT

Courses can have:

### Mid-course assessment

and:

### Final assessment

Example:

```text
Course
│
├── Unit 1
├── Unit 2
├── Unit 3
├── Mid-Course Assessment
├── Unit 4
├── Unit 5
├── Unit 6
└── Final Assessment
```

---

# 30. COURSE COMPLETION

Course completion must be calculated by backend rules.

Possible requirements:

```text
Required lessons completed
Required activities completed
Required assignments submitted
Required quizzes completed
Minimum assessment score
Minimum attendance
Final assessment completed
```

Example:

```text
Course Completion Requirements

Lessons: 100%
Assignments: 80%
Quizzes: 70%
Final assessment: ≥70%
Attendance: ≥75%
```

The teacher can configure allowed requirements within platform rules.

---

# 31. STUDENT PROGRESS

Track progress at multiple levels.

### Course

```text
Course:
64%
```

### Unit

```text
Unit 1: 100%
Unit 2: 80%
Unit 3: 45%
```

### Lesson

```text
Lesson:
75%
```

### Skill

```text
Vocabulary: 90%
Grammar: 82%
Reading: 75%
Listening: 64%
Speaking: 58%
Writing: 71%
Pronunciation: 60%
Communication: 65%
```

Progress must be calculated from real activity and assessment records.

Students cannot directly modify their progress.

---

# 32. SKILL PERFORMANCE

Create a separate skill-performance system.

Supported skills:

```text
READING
LISTENING
SPEAKING
WRITING
GRAMMAR
VOCABULARY
PRONUNCIATION
COMMUNICATION
```

Store:

- Student
- Course
- Skill
- Score
- Number of attempts
- Assessment evidence
- Last updated
- Trend where supported

Example:

```text
Speaking
Current: 68%
Previous: 61%
Trend: Improving
```

---

# 33. TEACHER COURSE BUILDER

Create:

```text
/teacher/courses
/teacher/courses/create
/teacher/courses/:courseId/edit
```

Teacher should have a visual curriculum builder:

```text
Course
│
├── Unit 1
│   ├── Lesson 1
│   ├── Lesson 2
│   └── Lesson 3
│
├── Unit 2
│   ├── Lesson 4
│   └── Lesson 5
│
└── Unit 3
```

Support:

- Create
- Edit
- Duplicate
- Delete
- Reorder
- Preview
- Publish
- Unpublish

Use drag-and-drop where appropriate.

---

# 34. LESSON BUILDER

Create a multi-step lesson builder.

```text
Step 1 — Basic Information
Step 2 — Objectives
Step 3 — Skills
Step 4 — Content
Step 5 — Activities
Step 6 — Assessment
Step 7 — Completion Rules
Step 8 — Preview
Step 9 — Save/Publish
```

Allow autosaving drafts.

---

# 35. AI LESSON GENERATION

Integrate the existing AI Teaching Assistant.

Add:

```text
[Generate Lesson with AI]
```

The teacher provides:

```text
Course
CEFR Level
Unit
Topic
Duration
Primary Skill
Supporting Skills
Student Age
Class Size
Teaching Style
Learning Objectives
```

AI generates a structured lesson.

Example:

```text
Lesson:
Planning a Trip

Objectives:
...

Vocabulary:
...

Grammar:
...

Reading:
...

Listening:
...

Speaking:
...

Writing:
...

Communication:
...

Assessment:
...

Rubric:
...
```

The teacher must review and edit before saving/publishing.

AI-generated content must never automatically become visible to students.

---

# 36. AI ACTIVITY GENERATION

Inside every lesson activity section, provide:

```text
[Create Activity]
[Generate with AI]
```

Example:

```text
Generate 5 B1 vocabulary questions
Generate a listening comprehension activity
Generate a speaking role-play
Generate a writing assignment
Generate grammar exercises
```

AI must follow the lesson's:

- CEFR level
- Topic
- Objectives
- Selected skill
- Difficulty
- Existing content

Avoid generating duplicate questions where possible.

---

# 37. AI ASSESSMENT GENERATION

Teachers should be able to select:

```text
[Generate Assessment with AI]
```

AI workflow:

```text
Assessment requirements
       ↓
Assessment blueprint
       ↓
Teacher review
       ↓
Question generation
       ↓
Answer key
       ↓
Marking scheme
       ↓
Teacher review
       ↓
Save
       ↓
Publish
```

Support:

- Diagnostic tests
- Formative assessments
- Quizzes
- Assignments
- Mid-term tests
- Final exams
- Speaking assessments
- Writing assessments
- Reading assessments
- Listening assessments
- Grammar tests
- Vocabulary tests

---

# 38. TEACHER AI CONTROL

The teacher must be able to:

```text
Edit
Regenerate
Delete
Reorder
Duplicate
Change difficulty
Change question type
Change marks
Change answer
Change instructions
```

Every AI-generated component must remain editable.

---

# 39. STUDENT COURSE EXPERIENCE

Student route:

```text
/student/my-courses
/student/courses/:courseId
/student/learn/:courseId
```

Course page:

```text
Course title
Teacher
CEFR level
Description
Objectives
Progress
Units
Certificate requirements
```

Example:

```text
B1 General English

Progress: 46%

Unit 1 ✓
Unit 2 75%
Unit 3 20%
Unit 4 🔒
```

---

# 40. STUDENT LESSON EXPERIENCE

When a student opens a lesson:

```text
Planning a Trip
B1 | 90 minutes

Progress: 45%

1. Introduction
2. Vocabulary
3. Grammar
4. Reading
5. Listening
6. Speaking
7. Writing
8. Communication
9. Practice
10. Assessment
```

Show clear navigation:

```text
Previous
Next
```

Save progress automatically.

---

# 41. LESSON RESUME

If the student leaves halfway through:

```text
Continue Learning
```

should return them to the appropriate location.

Example:

```text
You stopped at:
Listening Activity 2
```

---

# 42. ACCESS CONTROL

Course and lesson content must be protected by backend authorization.

A student must have:

```text
Authenticated
+
Role = STUDENT
+
Enrollment belongs to student
+
Enrollment status = ACTIVE
+
Enrollment not expired
```

Only then can protected course content be accessed.

Do not trust frontend route protection alone.

---

# 43. COURSE EXPIRATION

If an enrollment expires:

```text
ACTIVE
   ↓
EXPIRED
```

The student cannot access protected learning content.

However, preserve:

- Progress
- Grades
- Assignments
- Feedback
- Certificates
- Learning history

The student can see:

```text
Course Expired

Your access expired on:
10 December 2026

[Renew Course]
```

if renewal is supported.

---

# 44. COURSE PREVIEW

Before enrollment, students can see:

- Course title
- Teacher
- CEFR level
- Description
- Objectives
- Skills
- Duration
- Price
- Course curriculum preview

But protected lesson content should remain inaccessible.

Example:

```text
Unit 1
✓ Lesson titles visible
🔒 Lesson content locked
```

---

# 45. TEACHER PREVIEW

Teachers should be able to preview their course exactly as a student would see it.

Provide:

```text
[Preview as Student]
```

This should not grant unauthorized access to student-only data.

---

# 46. COURSE PUBLISHING WORKFLOW

Teacher creates:

```text
DRAFT
```

Then:

```text
Submit for Review
```

Course becomes:

```text
PENDING_REVIEW
```

Superadmin reviews:

```text
APPROVED
```

Then course can become:

```text
PUBLISHED
```

Only published courses appear in public course discovery.

---

# 47. SUPERADMIN COURSE MANAGEMENT

Superadmin should be able to:

- View all courses
- Search courses
- Filter by teacher
- Filter by CEFR
- Filter by category
- Review pending courses
- Approve courses
- Reject courses
- Suspend courses
- Archive courses
- Manage categories
- Manage CEFR levels
- View course performance

Superadmin should not need to manually create every teacher's lesson.

---

# 48. COURSE DATABASE MODELS

Use Prisma/PostgreSQL.

Recommended core models:

```text
Course
CourseCategory
CEFRLevel
CourseSkill
CourseUnit

Lesson
LessonSkill
LessonObjective
LessonContent
LessonActivity
ActivityQuestion

LessonAssessment
Assessment
AssessmentQuestion
AssessmentOption

UnitAssessment
CourseAssessment

Enrollment
LessonProgress
ActivityAttempt
AssessmentAttempt
AssessmentResult
SkillPerformance
```

Use proper relationships and foreign keys.

---

# 49. IMPORTANT DATA RELATIONSHIP

Use this relationship:

```text
Course
  1
  │
  └── *
CourseUnit
       1
       │
       └── *
Lesson
       1
       │
       ├── *
LessonSkill
       │
       ├── *
LessonContent
       │
       ├── *
LessonActivity
       │
       └── 1
LessonAssessment
```

Do not duplicate course information unnecessarily inside lessons.

---

# 50. API DESIGN

Create REST APIs.

### Courses

```text
GET    /api/v1/courses
GET    /api/v1/courses/:id
POST   /api/v1/teachers/courses
PATCH  /api/v1/teachers/courses/:id
DELETE /api/v1/teachers/courses/:id
POST   /api/v1/teachers/courses/:id/submit-review
POST   /api/v1/admin/courses/:id/approve
POST   /api/v1/admin/courses/:id/reject
POST   /api/v1/admin/courses/:id/suspend
```

### Units

```text
GET    /api/v1/courses/:courseId/units
POST   /api/v1/teachers/courses/:courseId/units
PATCH  /api/v1/teachers/units/:id
DELETE /api/v1/teachers/units/:id
```

### Lessons

```text
GET    /api/v1/units/:unitId/lessons
POST   /api/v1/teachers/units/:unitId/lessons
GET    /api/v1/lessons/:id
PATCH  /api/v1/teachers/lessons/:id
DELETE /api/v1/teachers/lessons/:id
```

### Activities

```text
POST   /api/v1/teachers/lessons/:lessonId/activities
PATCH  /api/v1/teachers/activities/:id
DELETE /api/v1/teachers/activities/:id

GET    /api/v1/students/lessons/:lessonId/activities
POST   /api/v1/students/activities/:id/submit
```

### Progress

```text
GET /api/v1/students/courses/:courseId/progress
GET /api/v1/students/lessons/:lessonId/progress
GET /api/v1/students/skills
```

---

# 51. SECURITY

Backend must verify:

```text
Authentication
+
Role
+
Course ownership
+
Enrollment
+
Lesson ownership
+
Access status
```

Teacher A must not modify Teacher B's courses.

Student A must not access Student B's progress.

Student must not access unpublished courses.

Student must not modify:

- Course progress
- Assessment score
- Grade
- Skill performance
- Lesson completion status
- Enrollment status

---

# 52. VALIDATION

Use Zod.

Validate:

- Course title
- Description
- CEFR level
- Price
- Duration
- Objectives
- Unit order
- Lesson order
- Activity type
- Marks
- Assessment configuration
- Completion requirements

Reject invalid data on the backend.

---

# 53. RESPONSIVE UI

The entire course and lesson system must work on:

- Desktop
- Laptop
- Tablet
- Mobile

Teacher course builder should be usable on smaller screens.

Student lessons should provide an excellent mobile learning experience.

Use:

- Responsive cards
- Progress bars
- Sticky lesson navigation where appropriate
- Collapsible skill sections
- Mobile-friendly activities
- Accessible buttons

---

# 54. ACCESSIBILITY

Support:

- Keyboard navigation
- Proper labels
- Semantic HTML
- Screen readers
- Accessible forms
- Sufficient contrast
- Captions/transcripts for audio/video
- Alternative text for images

Do not make color the only way to communicate lesson status.

---

# 55. NOTIFICATIONS

Integrate course and lesson events with the existing notification/email system.

Examples:

```text
New course enrollment
Course approved
Course rejected
New lesson published
Assignment available
Quiz available
Assessment available
Course expiring
Course completed
Certificate issued
```

Use both:

- In-app notification
- Email where appropriate

Respect notification preferences except for critical security notifications.

---

# 56. ANALYTICS

Teacher should be able to see:

```text
Course students
Course completion
Lesson completion
Skill performance
Assessment performance
Average scores
Most difficult lessons
Most difficult activities
Student engagement
```

Example:

```text
B1 General English

Students: 42

Course completion: 67%

Strongest skill:
Vocabulary — 84%

Weakest skill:
Speaking — 58%

Most difficult lesson:
Lesson 7 — Hotel Reservations
```

These values must come from actual database records.

---

# 57. AI + ANALYTICS

Integrate AI with aggregated course performance.

Example:

```text
Teacher:
"Which skills should I focus on next?"

System provides anonymized performance data.

AI:
Based on the available class performance data,
speaking and listening have lower average scores than
the other measured skills. Consider adding additional
speaking and listening practice.
```

The teacher remains responsible for deciding what to teach.

---

# 58. TESTING

Test:

### Course

- Create course
- Edit course
- Submit course
- Approve course
- Publish course
- Suspend course
- Archive course

### Units

- Create
- Edit
- Reorder
- Delete

### Lessons

- Create
- Edit
- Duplicate
- Reorder
- Publish
- Preview

### Multi-skill lessons

Test every supported skill.

### Activities

Test:

- MCQ
- True/False
- Fill blank
- Matching
- Ordering
- Reading
- Listening
- Speaking
- Writing
- Pronunciation
- Communication

### Progress

Verify progress is calculated correctly.

### Security

Test:

- IDOR
- Unauthorized course access
- Unauthorized lesson access
- Teacher ownership
- Expired enrollment
- Suspended enrollment
- Unpublished content

---

# 59. END-TO-END TEST

The following complete flow must work:

```text
Teacher Login
      ↓
Create Course
      ↓
Select CEFR Level
      ↓
Add Course Objectives
      ↓
Create Unit
      ↓
Create Multi-Skill Lesson
      ↓
Select Skills
      ↓
Add Lesson Content
      ↓
Add Activities
      ↓
Create Lesson Assessment
      ↓
Configure Completion Rules
      ↓
Preview Lesson
      ↓
Save Lesson
      ↓
Submit Course for Review
      ↓
Superadmin Reviews
      ↓
Course Approved
      ↓
Course Published
      ↓
Student Finds Course
      ↓
Student Requests Enrollment
      ↓
Payment Process
      ↓
Teacher Verifies Payment
      ↓
Enrollment ACTIVE
      ↓
Student Opens Course
      ↓
Student Opens Unit
      ↓
Student Opens Lesson
      ↓
Completes Multiple Skills
      ↓
Completes Activities
      ↓
Completes Lesson Assessment
      ↓
Lesson Progress Updated
      ↓
Skill Performance Updated
      ↓
Unit Progress Updated
      ↓
Course Progress Updated
      ↓
Course Assessment
      ↓
Course Completed
      ↓
Certificate Issued
```

---

# 60. FINAL ARCHITECTURE

The final learning system should follow:

```text
                         COURSE
                            │
                     ┌──────┴──────┐
                     │             │
                   UNIT          UNIT
                     │
                ┌────┴────┐
                │         │
             LESSON     LESSON
                │
       ┌────────┼─────────────┐
       │        │             │
  Vocabulary  Grammar      Reading
       │        │             │
  Activities Activities   Activities
       │        │             │
       └────────┼─────────────┘
                │
        Listening / Speaking
        Writing / Pronunciation
        Communication
                │
                ▼
        LESSON ASSESSMENT
                │
                ▼
          LESSON PROGRESS
                │
                ▼
         SKILL PERFORMANCE
                │
                ▼
          UNIT PROGRESS
                │
                ▼
        UNIT ASSESSMENT
                │
                ▼
         COURSE PROGRESS
                │
                ▼
        COURSE ASSESSMENT
                │
                ▼
           COMPLETION
                │
                ▼
          CERTIFICATE
```

# FINAL RULE

Do not treat the course system as a collection of static pages.

Build it as a **real learning management and language-learning engine** where:

```text
Course
→ Unit
→ Multi-Skill Lesson
→ Skill Content
→ Interactive Activity
→ Assessment
→ Student Attempt
→ Result
→ Skill Performance
→ Progress
→ Completion
→ Certificate
```

All important calculations, access control, progress, completion, grades, assessment results, and permissions must be handled by the **Node.js backend**, not trusted to the frontend.

AI-generated lessons, activities, assessments, rubrics, answer keys, and feedback must always enter a **teacher-review workflow** before they can become student-facing content.

Implement this system phase-by-phase, test each phase completely, and only proceed to the next phase after the previous phase passes its frontend, backend, database, authorization, business-logic, and end-to-end tests.