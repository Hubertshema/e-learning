# AI TEACHING ASSISTANT — COMPLETE DEVELOPMENT PROMPT

Integrate a secure and professional **AI Teaching Assistant** into the existing English Learning Platform.

The AI assistant is designed primarily for the **TEACHER** role.

Its purpose is to help teachers:

- Prepare lessons
- Create learning activities
- Create assignments
- Create quizzes
- Create examinations
- Create assessment questions
- Create answer keys
- Create marking schemes
- Create rubrics
- Generate differentiated learning materials
- Analyze student performance
- Suggest feedback
- Improve existing teaching materials

The AI must function as a **teacher assistant**, not as an autonomous teacher.

The teacher must always be able to:

```text
Generate → Review → Edit → Approve → Save → Publish

```

AI-generated content must never automatically become visible to students.

---

# 1. AI ASSISTANT LOCATION

Add a new section to the Teacher Dashboard:

```text
TEACHER

Dashboard

AI Teaching Assistant
  ├── AI Home
  ├── Lesson Planner
  ├── Activity Generator
  ├── Assessment Generator
  ├── Assignment Generator
  ├── Quiz Generator
  ├── Exam Generator
  ├── Rubric Generator
  ├── Answer Key Generator
  ├── Feedback Assistant
  └── AI History

Teaching
  ├── My Classes
  ├── My Students
  ├── My Courses
  ├── Lessons
  └── Content Library

```

Route:

```text
/teacher/ai

```

---

# 2. AI HOME PAGE

Create:

```text
/teacher/ai

```

The page should provide quick actions.

Example:

```text
AI Teaching Assistant

What would you like to create?

[ Create Lesson ]

[ Create Assessment ]

[ Create Assignment ]

[ Create Quiz ]

[ Create Exam ]

[ Create Activities ]

[ Create Rubric ]

[ Generate Feedback ]

```

Also display recent AI-generated content:

```text
Recent AI Work

A2 Grammar Lesson
Created: Today

B1 Reading Quiz
Created: Yesterday

Present Perfect Assessment
Created: 2 days ago

```

---

# 3. AI LESSON PLANNER

Create:

```text
/teacher/ai/lesson-planner

```

The teacher should provide information such as:

### Basic information

- Course
- CEFR level
- Unit
- Topic
- Lesson title
- Lesson duration

### Learning objectives

Allow the teacher to enter objectives or ask AI to generate them.

Example:

```text
Topic:
Present Perfect Tense

Level:
A2

Duration:
60 minutes

Learning objectives:
[Generate with AI]

```

AI can generate measurable objectives such as:

- Identify the structure of the present perfect tense.
- Form affirmative and negative sentences.
- Use the present perfect to describe experiences.

---

# 4. LESSON PLAN GENERATION

When the teacher clicks:

```text
Generate Lesson Plan

```

The AI should generate a structured lesson plan.

Example structure:

```text
Lesson Title

CEFR Level

Duration

Learning Objectives

Prerequisite Knowledge

Required Materials

Introduction / Warm-up

Presentation

Teacher Explanation

Examples

Guided Practice

Pair/Group Activity

Individual Practice

Assessment

Differentiation

Homework

Lesson Summary

```

The teacher must be able to edit every section.

---

# 5. LESSON PLAN CUSTOMIZATION

Before generation, allow the teacher to configure:

```text
Teaching Style:
[Traditional]
[Communicative]
[Task-Based]
[Project-Based]
[Mixed]

Class Size:
30

Duration:
60 minutes

Difficulty:
Normal

Focus:
Speaking + Grammar

Student Age:
Teenagers

Learning Context:
General English

```

Do not hard-code these options.

Design the system so more teaching strategies can be added later.

---

# 6. AI ACTIVITY GENERATOR

Create:

```text
/teacher/ai/activity-generator

```

Allow teachers to generate:

- Grammar activities
- Vocabulary activities
- Reading activities
- Listening activities
- Speaking activities
- Writing activities
- Pronunciation activities
- Communication activities

Teacher selects:

```text
CEFR Level
Topic
Skill
Number of activities
Difficulty
Time available

```

Example:

```text
Level: B1
Topic: Travel
Skill: Speaking
Activities: 5
Duration: 30 minutes

[Generate]

```

---

# 7. QUESTION TYPES

The AI must support the platform's assessment engine.

Generate:

### Multiple Choice

```text
Question
A
B
C
D

Correct Answer
Explanation

```

### True / False

```text
Statement
Correct answer
Explanation

```

### Fill in the Blank

```text
Sentence
Missing word
Correct answer
Explanation

```

### Matching

```text
Items
Matches
Correct answers

```

### Sentence Ordering

```text
Words/sentences
Correct order

```

### Short Answer

```text
Question
Expected answer
Acceptable alternatives
Marking guidance

```

### Essay/Writing

```text
Prompt
Expected skills
Rubric
Suggested marking criteria

```

### Speaking

```text
Speaking prompt
Expected response elements
Rubric
Teacher scoring criteria

```

### Listening

Generate:

- Listening script
- Questions
- Answer key
- Difficulty level

If audio generation is implemented later, the generated script can be sent to a text-to-speech service.

---

# 8. ASSESSMENT GENERATOR

Create:

```text
/teacher/ai/assessment-generator

```

Allow teachers to generate complete assessments.

Input:

```text
Course
CEFR level
Topic
Unit
Skills
Assessment type
Number of questions
Total marks
Duration
Difficulty
Question types

```

Assessment types:

```text
Diagnostic Test
Placement Test
Formative Assessment
Quiz
Assignment
Mid-Term Test
Final Examination
Practice Test
Speaking Assessment
Writing Assessment
Reading Assessment
Listening Assessment
Grammar Test
Vocabulary Test

```

---

# 9. ASSESSMENT BLUEPRINT

Before generating questions, AI should optionally create an assessment blueprint.

Example:

```text
Assessment Blueprint

Grammar:
10 questions — 20 marks

Vocabulary:
5 questions — 10 marks

Reading:
5 questions — 10 marks

Writing:
1 task — 20 marks

Speaking:
1 task — 20 marks

Total:
80 marks

```

Teacher can modify the blueprint before generating the assessment.

This helps prevent poorly balanced assessments.

---

# 10. BLOOM'S TAXONOMY

Where appropriate, allow the teacher to specify cognitive levels:

```text
Remember
Understand
Apply
Analyze
Evaluate
Create

```

The AI should use the selected cognitive distribution when generating assessments.

Example:

```text
Remember: 20%
Understand: 20%
Apply: 30%
Analyze: 20%
Create: 10%

```

The teacher must be able to modify this distribution.

---

# 11. DIFFICULTY CONTROL

Support:

```text
Easy
Medium
Hard
Mixed

```

For CEFR-based English learning, difficulty should also respect:

```text
Pre-A1
A1
A2
B1
B2
C1
C2

```

Do not allow the AI to arbitrarily generate C1-level vocabulary for an A1 assessment unless the teacher explicitly requests it.

---

# 12. ASSESSMENT GENERATION WORKFLOW

Use:

```text
Teacher selects configuration
        ↓
AI creates blueprint
        ↓
Teacher reviews blueprint
        ↓
Teacher clicks Generate Questions
        ↓
AI generates questions
        ↓
AI generates answer key
        ↓
AI generates marking guidance
        ↓
Teacher reviews
        ↓
Teacher edits
        ↓
Teacher saves as Draft
        ↓
Teacher publishes when ready

```

Never automatically publish AI-generated assessments.

---

# 13. ANSWER KEY GENERATOR

Every objective assessment should optionally include an answer key.

Example:

```text
Answer Key

Q1 → B
Q2 → True
Q3 → "have lived"
Q4 → C

```

For open-ended questions, provide:

- Expected response
- Key points
- Acceptable alternatives
- Suggested marking guidance

The teacher must be able to edit the answer key.

---

# 14. MARKING SCHEME GENERATOR

Allow AI to create marking schemes.

Example:

```text
Writing Task — 20 Marks

Content: 5
Organization: 4
Grammar: 4
Vocabulary: 4
Mechanics: 3

```

Teacher can edit:

- Criteria
- Marks
- Descriptions
- Performance levels

---

# 15. RUBRIC GENERATOR

Create:

```text
/teacher/ai/rubric-generator

```

Generate rubrics for:

- Speaking
- Writing
- Presentations
- Projects
- Communication
- Reading
- Listening

Example:

```text
Criterion       Excellent   Good   Developing   Beginning

Grammar           4           3        2             1
Vocabulary        4           3        2             1
Fluency           4           3        2             1
Pronunciation     4           3        2             1

```

The teacher can modify all rubric values.

---

# 16. ASSIGNMENT GENERATOR

Create:

```text
/teacher/ai/assignment-generator

```

Teacher provides:

```text
Course
Level
Topic
Skill
Learning objective
Deadline
Marks
Difficulty

```

AI generates:

- Assignment title
- Instructions
- Questions/tasks
- Required submission
- Marking criteria
- Rubric
- Expected learning outcome

Teacher reviews before publishing.

---

# 17. QUIZ GENERATOR

Create:

```text
/teacher/ai/quiz-generator

```

Teacher selects:

```text
Course
Unit
Lesson
Topic
Number of questions
Question types
Time limit
Total marks
Difficulty

```

AI generates:

- Quiz title
- Instructions
- Questions
- Options
- Correct answers
- Explanations
- Marks
- Suggested time limit

Teacher can edit every question.

---

# 18. EXAM GENERATOR

Create:

```text
/teacher/ai/exam-generator

```

Support complete examination generation.

Input:

```text
Exam title
Course
CEFR level
Units covered
Skills
Duration
Total marks
Question distribution
Difficulty

```

AI generates:

```text
Section A — Grammar
Section B — Vocabulary
Section C — Reading
Section D — Listening
Section E — Writing
Section F — Speaking

```

The teacher can remove, reorder, modify, or regenerate sections.

---

# 19. REGENERATE FUNCTION

Every generated section should have:

```text
[Edit]
[Regenerate]
[Delete]

```

For a question:

```text
Regenerate this question

```

Options:

```text
Make easier
Make harder
Change question type
Create another question
Improve wording
Change context

```

The AI must preserve the teacher's selected learning objective when regenerating.

---

# 20. AI CHAT ASSISTANT

Add an AI chat interface:

```text
/teacher/ai/chat

```

The teacher can ask:

> Create a 45-minute B1 lesson about reported speech.

Or:

> Give me five speaking activities for A2 students learning about travel.

Or:

> Improve this assessment question.

Or:

> Make this activity suitable for A1 learners.

The assistant should maintain conversation context within the current session.

Example:

```text
Teacher:
Create a B1 lesson about job interviews.

AI:
[Lesson plan]

Teacher:
Add a speaking activity.

AI:
[Speaking activity]

Teacher:
Make it suitable for a class of 40 students.

AI:
[Updated activity]

```

---

# 21. CONTEXT-AWARE AI

The AI should understand the platform's existing data when authorized.

For example, when a teacher generates content from:

```text
Course
→ Unit
→ Lesson

```

the AI should receive relevant information such as:

- Course title
- CEFR level
- Unit title
- Existing lesson objectives
- Previous lesson content
- Learning skills
- Course vocabulary
- Course grammar topics

This reduces duplicate or inappropriate content.

Do not send unrelated private student data to the AI.

---

# 22. STUDENT PERFORMANCE-BASED ASSISTANCE

Allow teachers to ask AI for teaching recommendations based on aggregated student performance.

Example:

```text
Class performance:

Grammar: 82%
Reading: 75%
Listening: 61%
Speaking: 55%
Writing: 70%

```

AI can provide:

```text
Suggested teaching focus:

1. Speaking practice
2. Listening comprehension
3. Pronunciation activities

```

The AI should explain that these are recommendations based on the supplied performance data, not unquestionable conclusions.

---

# 23. AI FEEDBACK ASSISTANT

Create:

```text
/teacher/ai/feedback

```

Teacher can provide:

- Student answer
- Assignment
- Rubric
- Score if available

AI can suggest feedback.

Example:

```text
Strengths:
- Good vocabulary usage
- Clear organization

Areas to improve:
- Verb tense consistency
- Sentence structure

Suggested next step:
Practice past and present perfect usage.

```

The teacher must approve feedback before sending it to the student.

---

# 24. AI GRADING ASSISTANCE

AI may assist with open-ended work where appropriate.

For example:

```text
Student submission
        ↓
Rubric
        ↓
AI analysis
        ↓
Suggested score
        ↓
Suggested feedback
        ↓
Teacher reviews
        ↓
Teacher confirms/modifies
        ↓
Final grade saved

```

IMPORTANT:

The AI must **never automatically finalize a student's grade** unless a future explicitly approved automated-grading feature is enabled.

The teacher remains responsible for the final academic grade.

---

# 25. AI CONTENT SAFETY

Implement content filtering and validation.

The AI should avoid generating:

- Unsafe content
- Hate or discriminatory material
- Sexually explicit content
- Inappropriate content for minors
- Dangerous instructions
- Biased assessment questions
- Personally identifying student information unnecessarily

For educational content, encourage:

- Age-appropriate examples
- Inclusive examples
- Respectful language
- Clear instructions
- Educational relevance

---

# 26. AI PRIVACY

Do not send unnecessary personal student information to the AI provider.

When analyzing student performance, prefer anonymized data.

Instead of:

```text
John Doe scored 55%.

```

send:

```text
Student A scored 55%.

```

unless the AI feature genuinely requires identifiable information.

Never send:

- Passwords
- Authentication tokens
- Payment credentials
- Private security information
- Unnecessary personal data

---

# 27. AI PROVIDER ARCHITECTURE

Do not call an AI provider directly from the frontend.

Use:

```text
Teacher
   ↓
Next.js Frontend
   ↓
Node.js API
   ↓
AI Service
   ↓
AI Provider

```

Create:

```text
backend/src/modules/ai/
├── ai.controller.ts
├── ai.service.ts
├── ai.repository.ts
├── ai.routes.ts
├── ai.validator.ts
├── ai.types.ts
├── ai.prompts.ts
├── ai.schemas.ts
└── providers/
    ├── ai.provider.ts
    └── provider implementation

```

The provider should be abstracted so the platform can change AI providers later.

Do not hard-code the entire application around one AI provider.

---

# 28. AI API ENDPOINTS

Create endpoints such as:

```text
POST /api/v1/ai/chat

POST /api/v1/ai/lessons/generate
POST /api/v1/ai/activities/generate

POST /api/v1/ai/assessments/blueprint
POST /api/v1/ai/assessments/generate

POST /api/v1/ai/assignments/generate
POST /api/v1/ai/quizzes/generate
POST /api/v1/ai/exams/generate

POST /api/v1/ai/rubrics/generate
POST /api/v1/ai/answer-keys/generate

POST /api/v1/ai/feedback/generate
POST /api/v1/ai/grading/suggest

GET /api/v1/ai/history
GET /api/v1/ai/history/:id

DELETE /api/v1/ai/history/:id

```

Protect every endpoint with:

```text
Authentication
+
TEACHER role
+
Rate limiting

```

---

# 29. AI GENERATION DATABASE

Store AI generation history.

Create:

```text
AIGeneration

```

Fields:

```text
id
teacherId
type
title
prompt
inputContext
output
status
model
tokensUsed
createdAt
updatedAt

```

Types:

```text
LESSON
ACTIVITY
ASSIGNMENT
QUIZ
EXAM
ASSESSMENT
RUBRIC
ANSWER_KEY
FEEDBACK
GRADING_SUGGESTION
CHAT

```

Do not store unnecessary sensitive student information in AI history.

---

# 30. AI USAGE LIMITS

Implement usage controls.

Possible limits:

```text
Teacher
├── Daily AI generations
├── Monthly AI generations
└── Token/usage limit

```

Superadmin should be able to configure:

```text
AI enabled: ON/OFF

Maximum generations per teacher
Maximum monthly usage
Allowed AI features

```

Display remaining usage to teachers.

Example:

```text
AI Usage

Today:
8 / 20 generations

This month:
142 / 500 generations

```

---

# 31. AI COST CONTROL

Do not send unnecessarily large prompts.

Implement:

- Context limits
- Token limits
- Maximum output limits
- Request throttling
- Duplicate request prevention
- Usage tracking

For repeated content generation, consider caching where appropriate.

---

# 32. AI OUTPUT VALIDATION

Do not blindly trust AI-generated JSON.

Require structured AI output.

Example:

```text
{
  "title": "...",
  "objectives": [],
  "activities": [],
  "assessment": []
}

```

Validate the result using Zod before saving it.

If validation fails:

```text
AI output
   ↓
Zod validation
   ↓
Invalid
   ↓
Retry/repair

```

Never save malformed AI output directly into production tables.

---

# 33. AI → PLATFORM CONTENT WORKFLOW

AI-generated content should initially be a draft.

Example:

```text
AI
 ↓
AI Draft
 ↓
Teacher Review
 ↓
Teacher Edit
 ↓
Save Draft
 ↓
Teacher Publish
 ↓
Students Access

```

For an assessment:

```text
AI generates assessment
        ↓
Teacher reviews questions
        ↓
Teacher reviews answer key
        ↓
Teacher reviews marks
        ↓
Teacher publishes
        ↓
Student receives assessment

```

---

# 34. AI HISTORY

Create:

```text
/teacher/ai/history

```

Display:

- Generation type
- Title
- Date
- Status
- Course
- CEFR level

Actions:

```text
View
Continue Editing
Reuse
Duplicate
Delete

```

---

# 35. AI CONTENT VERSIONING

When a teacher regenerates or significantly edits AI content, preserve versions where appropriate.

Example:

```text
Lesson Plan
Version 1 — AI generated
Version 2 — Teacher edited
Version 3 — Teacher revised

```

Allow the teacher to restore an earlier version where practical.

---

# 36. SUPERADMIN AI MANAGEMENT

Add:

```text
Superadmin
→ System
→ AI Settings

```

Superadmin can configure:

- Enable/disable AI
- AI provider
- Default model
- Usage limits
- Teacher permissions
- Allowed generation types
- Maximum generation length
- AI feature availability
- Cost/usage monitoring

Display statistics:

```text
AI Usage

Total generations
Active AI teachers
Most used feature
Daily usage
Monthly usage
Estimated AI usage cost

```

Superadmin should not automatically see private teacher conversations unless the platform's privacy policy and feature design explicitly permit it.

---

# 37. AI TEACHING ASSISTANT UI

Use a professional interface.

Recommended layout:

```text
┌──────────────────────────────────────────────┐
│ AI Teaching Assistant                       │
│                                              │
│ What would you like to create?              │
│                                              │
│ [Lesson] [Quiz] [Assignment] [Exam]          │
│ [Activity] [Rubric] [Feedback]               │
│                                              │
│ ─────────────────────────────────────────── │
│                                              │
│ Recent AI Work                               │
│                                              │
│ A2 Grammar Lesson       [Open]               │
│ B1 Reading Quiz        [Open]               │
└──────────────────────────────────────────────┘

```

For generation pages, use a two-panel layout:

```text
LEFT
Generation Settings

RIGHT
AI Generated Content

```

On mobile, stack the panels vertically.

---

# 38. AI GENERATION UX

While generating:

```text
AI is preparing your lesson...

```

Do not freeze the entire application.

Support:

- Loading state
- Cancel where technically possible
- Retry
- Error handling
- Regenerate
- Edit
- Save

If AI fails:

```text
We couldn't generate this content.
Please try again.

```

Do not expose raw provider errors or API keys.

---

# 39. IMPORTANT ACADEMIC RULE

The AI is an assistant.

The teacher remains responsible for:

- Lesson quality
- Assessment quality
- Accuracy
- Fairness
- Final grading
- Published content
- Student feedback

Therefore:

```text
AI Generated ≠ Automatically Approved

```

Every AI-generated educational artifact must have a teacher review stage before publication.

---

# 40. TESTING REQUIREMENTS

Test the entire AI system.

### Authentication

Verify unauthenticated users cannot access AI APIs.

### Authorization

Verify:

```text
STUDENT → denied
TEACHER → allowed
SUPERADMIN → management access

```

### Lesson generation

Test:

- Valid input
- Missing input
- Invalid CEFR
- Invalid duration
- AI failure
- Malformed output

### Assessment generation

Test:

- MCQ
- True/False
- Fill blank
- Matching
- Reading
- Listening
- Writing
- Speaking

### Security

Test:

- Prompt injection attempts
- IDOR
- Unauthorized AI history access
- Excessive requests
- Token leakage
- Sensitive data leakage

### Data integrity

Verify AI output cannot create:

- Invalid questions
- Invalid answer keys
- Invalid marks
- Invalid course IDs
- Invalid teacher ownership

---

# 41. END-TO-END TEST

The following flow must work:

```text
Teacher Login
      ↓
Teacher Dashboard
      ↓
AI Teaching Assistant
      ↓
Lesson Planner
      ↓
Select B1
      ↓
Enter topic
      ↓
Generate lesson
      ↓
AI returns structured lesson
      ↓
Teacher edits lesson
      ↓
Save Draft
      ↓
Create Assessment
      ↓
Select lesson
      ↓
Generate assessment
      ↓
AI creates questions
      ↓
Teacher reviews questions
      ↓
Teacher edits answer key
      ↓
Teacher saves assessment
      ↓
Teacher publishes
      ↓
Student receives assessment
      ↓
Student completes assessment
      ↓
Teacher reviews results
      ↓
AI optionally suggests feedback
      ↓
Teacher approves feedback
      ↓
Student receives feedback

```

---

# 42. FINAL IMPLEMENTATION PRINCIPLE

Build the AI Teaching Assistant as a **separate modular service inside the Node.js backend**, integrated with:

```text
Users
Teachers
Students
Courses
Units
Lessons
Activities
Assignments
Quizzes
Assessments
Attendance
Progress
Feedback
Notifications
Email
Reports

```

The AI should use existing platform data where authorized, but must respect role permissions and privacy.

The final architecture should be:

```text
                    ┌───────────────────┐
                    │      TEACHER      │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Next.js Frontend  │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Node.js / Express │
                    └─────────┬─────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
          ┌──────────┐ ┌───────────┐ ┌──────────┐
          │ AI Module│ │ Course    │ │Assessment│
          │          │ │ Module    │ │ Module   │
          └────┬─────┘ └───────────┘ └──────────┘
               │
               ▼
        ┌───────────────┐
        │  AI Provider  │
        └───────────────┘
               │
               ▼
        Structured Output
               │
               ▼
        Zod Validation
               │
               ▼
        Teacher Review
               │
               ▼
        Save / Publish
               │
               ▼
            Students

```

Build the feature incrementally:

**Phase 1:** AI infrastructure and provider abstraction
**Phase 2:** AI chat
**Phase 3:** Lesson planner
**Phase 4:** Activity generator
**Phase 5:** Assignment generator
**Phase 6:** Quiz generator
**Phase 7:** Assessment/exam generator
**Phase 8:** Rubric and answer-key generator
**Phase 9:** AI feedback assistant
**Phase 10:** Performance-based teaching assistance
**Phase 11:** AI history, usage limits and analytics
**Phase 12:** Security, privacy, testing and production optimization

Do not move to the next phase until the previous phase has been implemented, tested, and verified end-to-end.