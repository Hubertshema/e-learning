import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../config/database.js';

export async function runComprehensiveSeed() {
  console.log('\n🌱 =========================================================');
  console.log('🌱 Starting Comprehensive Test Data Seeding for Super Admin...');
  console.log('🌱 =========================================================\n');

  try {
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('Password123!', salt);

    // 1. Check existing tables in public schema
    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    const tables = new Set(tablesRes.rows.map((r) => r.table_name));
    console.log(`📊 Detected ${tables.size} active tables in PostgreSQL public schema.`);

    // 2. Helper to fetch all column names for a table
    const tableColumnsCache = {};
    async function getColumns(tableName) {
      if (tableColumnsCache[tableName]) return tableColumnsCache[tableName];
      const res = await query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
        [tableName]
      );
      const cols = new Set(res.rows.map((r) => r.column_name));
      tableColumnsCache[tableName] = cols;
      return cols;
    }

    // =========================================================================
    // 3. SEED USERS & PROFILES
    // =========================================================================
    console.log('👤 Seeding Users & Demographics...');

    const userSeedData = [
      // Super Admins
      {
        email: 'superadmin@linguachris.com',
        firstName: 'Platform',
        lastName: 'Superadmin',
        role: 'SUPERADMIN',
        status: 'ACTIVE',
        phone: '+1 (555) 019-2831',
        isVerified: true,
      },
      {
        email: 'executive.admin@linguachris.com',
        firstName: 'Elena',
        lastName: 'Vance',
        role: 'SUPERADMIN',
        status: 'ACTIVE',
        phone: '+1 (555) 019-4822',
        isVerified: true,
      },

      // Teachers / Instructors
      {
        email: 'sarah.jenkins@linguachris.com',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        role: 'TEACHER',
        status: 'ACTIVE',
        phone: '+1 (555) 234-5678',
        isVerified: true,
        teacherProfile: {
          isApproved: true,
          hourlyRate: 45.0,
          specialties: ['Business English', 'IELTS Academic', 'Executive Coaching'],
          bio: 'Senior English Lecturer with 12+ years specializing in IELTS 8.0+ preparation and corporate communications.',
        },
      },
      {
        email: 'marcus.vance@linguachris.com',
        firstName: 'Marcus',
        lastName: 'Vance',
        role: 'TEACHER',
        status: 'ACTIVE',
        phone: '+44 20 7946 0912',
        isVerified: true,
        teacherProfile: {
          isApproved: true,
          hourlyRate: 50.0,
          specialties: ['Grammar Mastery', 'Conversational Fluency', 'Pronunciation'],
          bio: 'Cambridge certified EFL tutor passionate about interactive conversational fluency and accent reduction.',
        },
      },
      {
        email: 'elena.rostova@linguachris.com',
        firstName: 'Elena',
        lastName: 'Rostova',
        role: 'TEACHER',
        status: 'PENDING_VERIFICATION',
        phone: '+33 1 42 68 55 00',
        isVerified: true,
        teacherProfile: {
          isApproved: false, // Pending Approval
          hourlyRate: 35.0,
          specialties: ['French-English Translation', 'CEFR A1-B1 Foundations'],
          bio: 'Multilingual linguistics graduate applicant seeking approval for European timezone cohort classes.',
        },
      },
      {
        email: 'david.kim@linguachris.com',
        firstName: 'David',
        lastName: 'Kim',
        role: 'TEACHER',
        status: 'PENDING_VERIFICATION',
        phone: '+82 2 312 3456',
        isVerified: true,
        teacherProfile: {
          isApproved: false, // Pending Approval
          hourlyRate: 40.0,
          specialties: ['TOEFL iBT', 'Academic Writing', 'Medical English'],
          bio: 'Former university instructor applying to teach TOEFL intensive night bootcamps.',
        },
      },
      {
        email: 'claire.dubois@linguachris.com',
        firstName: 'Claire',
        lastName: 'Dubois',
        role: 'TEACHER',
        status: 'SUSPENDED',
        phone: '+1 (555) 789-0123',
        isVerified: false,
        teacherProfile: {
          isApproved: false, // Rejected / Suspended
          hourlyRate: 30.0,
          specialties: ['General English'],
          bio: 'Account suspended for policy evaluation regarding syllabus guideline adherence.',
        },
      },

      // Students
      {
        email: 'alex.student@linguachris.com',
        firstName: 'Alex',
        lastName: 'Mercer',
        role: 'STUDENT',
        status: 'ACTIVE',
        phone: '+1 (555) 345-6789',
        isVerified: true,
        studentProfile: {
          currentLevel: 'B1',
          targetLevel: 'C1',
          subscriptionStatus: 'ACTIVE',
          subscriptionDays: 60,
        },
      },
      {
        email: 'maria.garcia@linguachris.com',
        firstName: 'Maria',
        lastName: 'Garcia',
        role: 'STUDENT',
        status: 'ACTIVE',
        phone: '+34 91 123 4567',
        isVerified: true,
        studentProfile: {
          currentLevel: 'A2',
          targetLevel: 'B2',
          subscriptionStatus: 'ACTIVE',
          subscriptionDays: 90,
        },
      },
      {
        email: 'lucas.muller@linguachris.com',
        firstName: 'Lucas',
        lastName: 'Muller',
        role: 'STUDENT',
        status: 'ACTIVE',
        phone: '+49 30 123456',
        isVerified: true,
        studentProfile: {
          currentLevel: 'B2',
          targetLevel: 'C2',
          subscriptionStatus: 'ACTIVE',
          subscriptionDays: 120,
        },
      },
      {
        email: 'yuki.tanaka@linguachris.com',
        firstName: 'Yuki',
        lastName: 'Tanaka',
        role: 'STUDENT',
        status: 'ACTIVE',
        phone: '+81 3 1234 5678',
        isVerified: true,
        studentProfile: {
          currentLevel: 'A1',
          targetLevel: 'B1',
          subscriptionStatus: 'EXPIRED',
          subscriptionDays: -10,
        },
      },
      {
        email: 'fatima.zahra@linguachris.com',
        firstName: 'Fatima',
        lastName: 'Al-Zahra',
        role: 'STUDENT',
        status: 'PENDING_VERIFICATION',
        phone: '+971 4 123 4567',
        isVerified: false,
        studentProfile: {
          currentLevel: 'A1',
          targetLevel: 'B2',
          subscriptionStatus: 'PENDING',
          subscriptionDays: 0,
        },
      },
      {
        email: 'liam.chen@linguachris.com',
        firstName: 'Liam',
        lastName: 'Chen',
        role: 'STUDENT',
        status: 'PENDING_VERIFICATION',
        phone: '+65 6789 0123',
        isVerified: false,
        studentProfile: {
          currentLevel: 'B1',
          targetLevel: 'C1',
          subscriptionStatus: 'PENDING',
          subscriptionDays: 0,
        },
      },
      {
        email: 'chloe.bennett@linguachris.com',
        firstName: 'Chloe',
        lastName: 'Bennett',
        role: 'STUDENT',
        status: 'ACTIVE',
        phone: '+1 (555) 456-7890',
        isVerified: true,
        studentProfile: {
          currentLevel: 'A2',
          targetLevel: 'B2',
          subscriptionStatus: 'EXPIRED',
          subscriptionDays: -45,
        },
      },
      {
        email: 'carlos.mendoza@linguachris.com',
        firstName: 'Carlos',
        lastName: 'Mendoza',
        role: 'STUDENT',
        status: 'SUSPENDED',
        phone: '+52 55 1234 5678',
        isVerified: true,
        studentProfile: {
          currentLevel: 'B1',
          targetLevel: 'B2',
          subscriptionStatus: 'CANCELLED',
          subscriptionDays: -30,
        },
      },
      {
        email: 'david.kim@linguachris.com',
        firstName: 'David',
        lastName: 'Kim',
        role: 'STUDENT',
        status: 'SUSPENDED',
        phone: '+82 2 3456 7890',
        isVerified: true,
        studentProfile: {
          currentLevel: 'C1',
          targetLevel: 'C2',
          subscriptionStatus: 'CANCELLED',
          subscriptionDays: -60,
        },
      },
      {
        email: 'amara.okafor@linguachris.com',
        firstName: 'Amara',
        lastName: 'Okafor',
        role: 'STUDENT',
        status: 'ACTIVE',
        phone: '+234 1 234 5678',
        isVerified: true,
        studentProfile: {
          currentLevel: 'B2',
          targetLevel: 'C1',
          subscriptionStatus: 'ACTIVE',
          subscriptionDays: 45,
        },
      },
    ];

    const createdUsers = {};
    const createdTeachers = {};
    const createdStudents = {};

    for (const u of userSeedData) {
      try {
        const existingUser = await query(`SELECT id, email, role FROM "public"."users" WHERE LOWER(email) = LOWER($1)`, [u.email]);
        let userId;

        if (existingUser.rows.length > 0) {
          userId = existingUser.rows[0].id;
          await query(
            `UPDATE "public"."users" 
             SET "firstName" = $1, "lastName" = $2, role = $3, status = $4, phone = $5, "updatedAt" = NOW()
             WHERE id = $6`,
            [u.firstName, u.lastName, u.role, u.status, u.phone, userId]
          );
        } else {
          const id = crypto.randomUUID();
          const insertUserRes = await query(
            `INSERT INTO "public"."users" (id, email, "passwordHash", "firstName", "lastName", role, status, phone, "isVerified", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '15 days', NOW())
             RETURNING id`,
            [id, u.email, defaultPasswordHash, u.firstName, u.lastName, u.role, u.status, u.phone, u.isVerified]
          );
          userId = insertUserRes.rows[0].id;
        }

        createdUsers[u.email] = userId;

        // Handle Teacher Profile
        if (u.role === 'TEACHER' && u.teacherProfile && tables.has('teacher_profiles')) {
          const existingTp = await query(`SELECT id FROM "public"."teacher_profiles" WHERE "userId" = $1`, [userId]);
          let tpId;
          if (existingTp.rows.length > 0) {
            tpId = existingTp.rows[0].id;
            await query(
              `UPDATE "public"."teacher_profiles"
               SET "isApproved" = $1, "hourlyRate" = $2, bio = $3, "updatedAt" = NOW()
               WHERE id = $4`,
              [u.teacherProfile.isApproved, u.teacherProfile.hourlyRate, u.teacherProfile.bio, tpId]
            );
          } else {
            tpId = crypto.randomUUID();
            await query(
              `INSERT INTO "public"."teacher_profiles" (id, "userId", "isApproved", "hourlyRate", bio, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '14 days', NOW())`,
              [tpId, userId, u.teacherProfile.isApproved, u.teacherProfile.hourlyRate, u.teacherProfile.bio]
            );
          }
          createdTeachers[u.email] = { userId, profileId: tpId };
        }

        // Handle Student Profile
        if (u.role === 'STUDENT' && u.studentProfile && tables.has('student_profiles')) {
          const existingSp = await query(`SELECT id FROM "public"."student_profiles" WHERE "userId" = $1`, [userId]);
          let spId;
          const subExpiresAt = new Date(Date.now() + u.studentProfile.subscriptionDays * 24 * 60 * 60 * 1000);
          const subStartedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

          if (existingSp.rows.length > 0) {
            spId = existingSp.rows[0].id;
            await query(
              `UPDATE "public"."student_profiles"
               SET "currentLevel" = $1, "targetLevel" = $2, "subscriptionStatus" = $3,
                   "subscriptionStartedAt" = $4, "subscriptionExpiresAt" = $5, "updatedAt" = NOW()
               WHERE id = $6`,
              [u.studentProfile.currentLevel, u.studentProfile.targetLevel, u.studentProfile.subscriptionStatus, subStartedAt, subExpiresAt, spId]
            );
          } else {
            spId = crypto.randomUUID();
            await query(
              `INSERT INTO "public"."student_profiles" (id, "userId", "currentLevel", "targetLevel", "subscriptionStatus", "subscriptionStartedAt", "subscriptionExpiresAt", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '30 days', NOW())`,
              [spId, userId, u.studentProfile.currentLevel, u.studentProfile.targetLevel, u.studentProfile.subscriptionStatus, subStartedAt, subExpiresAt]
            );
          }
          createdStudents[u.email] = { userId, profileId: spId };
        }
      } catch (userErr) {
        console.warn(`⚠️ Warning seeding user ${u.email}:`, userErr.message);
      }
    }

    console.log(`✅ Seeded ${Object.keys(createdUsers).length} users.`);

    // =========================================================================
    // 4. SEED COURSES & CURRICULUM
    // =========================================================================
    console.log('📚 Seeding Courses & Syllabi...');
    const teacherSarah = createdTeachers['sarah.jenkins@linguachris.com']?.profileId || createdUsers['sarah.jenkins@linguachris.com'];
    const teacherMarcus = createdTeachers['marcus.vance@linguachris.com']?.profileId || createdUsers['marcus.vance@linguachris.com'];

    const courseSeedData = [
      {
        title: 'CEFR A1: Complete Beginner English Fundamentals',
        slug: 'cefr-a1-beginner-fundamentals',
        description: 'Comprehensive introduction to everyday English phrases, essential vocabulary, basic grammar rules, and introductory listening exercises.',
        level: 'A1',
        category: 'General English',
        price: 49.0,
        currency: 'USD',
        isPublished: true,
        teacherId: teacherMarcus,
        unitsCount: 4,
      },
      {
        title: 'CEFR A2: Elementary Practical Daily Communication',
        slug: 'cefr-a2-elementary-communication',
        description: 'Build confidence talking about routine tasks, traveling, shopping, making plans, and understanding common written notices.',
        level: 'A2',
        category: 'Conversational',
        price: 79.0,
        currency: 'USD',
        isPublished: true,
        teacherId: teacherMarcus,
        unitsCount: 5,
      },
      {
        title: 'CEFR B1: Intermediate Fluency & Professional English',
        slug: 'cefr-b1-intermediate-fluency',
        description: 'Master spontaneous discussions, business email correspondence, expressing opinions clearly, and handling unexpected travel scenarios.',
        level: 'B1',
        category: 'Business English',
        price: 129.0,
        currency: 'USD',
        isPublished: true,
        teacherId: teacherSarah,
        unitsCount: 6,
      },
      {
        title: 'CEFR B2: Upper Intermediate Negotiations & Debate',
        slug: 'cefr-b2-upper-intermediate-negotiations',
        description: 'Advanced nuance, idiomatic expressions, structuring persuasive business presentations, and synthesizing complex technical viewpoints.',
        level: 'B2',
        category: 'Business English',
        price: 189.0,
        currency: 'USD',
        isPublished: true,
        teacherId: teacherSarah,
        unitsCount: 8,
      },
      {
        title: 'CEFR C1: Academic IELTS & Cambridge Proficiency Masterclass',
        slug: 'cefr-c1-ielts-proficiency-masterclass',
        description: 'Rigorous intensive preparation targeted at achieving IELTS Band 8.0-9.0 and C1 Advanced certification for university and visa admissions.',
        level: 'C1',
        category: 'Exam Preparation',
        price: 249.0,
        currency: 'USD',
        isPublished: true,
        teacherId: teacherSarah,
        unitsCount: 10,
      },
      {
        title: 'CEFR C2: Native-Level Executive Rhetoric (Draft)',
        slug: 'cefr-c2-executive-rhetoric-draft',
        description: 'Master subtle stylistic nuances, historical idioms, and executive speechwriting. Upcoming curriculum track currently in curriculum review.',
        level: 'C2',
        category: 'Executive Coaching',
        price: 349.0,
        currency: 'USD',
        isPublished: false, // Draft
        teacherId: teacherSarah,
        unitsCount: 2,
      },
    ];

    const createdCourses = {};

    for (const c of courseSeedData) {
      try {
        const existingCourse = await query(`SELECT id FROM "public"."courses" WHERE title = $1`, [c.title]);
        let courseId;

        if (existingCourse.rows.length > 0) {
          courseId = existingCourse.rows[0].id;
          await query(
            `UPDATE "public"."courses"
             SET description = $1, level = $2, category = $3, price = $4, currency = $5, "isPublished" = $6, "updatedAt" = NOW()
             WHERE id = $7`,
            [c.description, c.level, c.category, c.price, c.currency, c.isPublished, courseId]
          );
        } else {
          courseId = crypto.randomUUID();
          await query(
            `INSERT INTO "public"."courses" (id, title, slug, description, level, category, price, currency, "isPublished", "teacherId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() - INTERVAL '20 days', NOW())`,
            [courseId, c.title, c.slug, c.description, c.level, c.category, c.price, c.currency, c.isPublished, c.teacherId]
          );
        }

        createdCourses[c.level] = courseId;

        // Seed units if units table exists
        if (tables.has('units')) {
          const unitsExist = await query(`SELECT COUNT(*) as total FROM "public"."units" WHERE "courseId" = $1`, [courseId]);
          if (parseInt(unitsExist.rows[0].total, 10) === 0) {
            for (let i = 1; i <= c.unitsCount; i++) {
              const unitId = crypto.randomUUID();
              await query(
                `INSERT INTO "public"."units" (id, "courseId", title, "orderIndex", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                [unitId, courseId, `Module ${i}: ${c.level} Core Curriculum Unit ${i}`, i]
              );
            }
          }
        }
      } catch (courseErr) {
        console.warn(`⚠️ Warning seeding course ${c.title}:`, courseErr.message);
      }
    }

    console.log(`✅ Seeded courses with CEFR tracks.`);

    // =========================================================================
    // 5. SEED CLASSES / COHORTS
    // =========================================================================
    console.log('🏛️ Seeding Live Cohort Classes...');
    if (tables.has('classes')) {
      const classCols = await getColumns('classes');
      const classSeedData = [
        {
          name: 'Morning Intensive A1 Foundations (Cohort 2026-A)',
          code: 'COHORT-A1-2026',
          level: 'A1',
          courseId: createdCourses['A1'],
          teacherId: teacherMarcus,
          maxStudents: 15,
          schedule: 'Mon / Wed / Fri • 09:00 - 10:30 UTC',
          isActive: true,
        },
        {
          name: 'Evening B1 Business English Masterclass (Cohort 2026-B)',
          code: 'COHORT-B1-2026',
          level: 'B1',
          courseId: createdCourses['B1'],
          teacherId: teacherSarah,
          maxStudents: 12,
          schedule: 'Tue / Thu • 18:30 - 20:30 UTC',
          isActive: true,
        },
        {
          name: 'Weekend IELTS 8.0+ Band Accelerator',
          code: 'COHORT-IELTS-2026',
          level: 'C1',
          courseId: createdCourses['C1'],
          teacherId: teacherSarah,
          maxStudents: 10,
          schedule: 'Saturday & Sunday • 14:00 - 16:30 UTC',
          isActive: true,
        },
      ];

      for (const cl of classSeedData) {
        if (!cl.courseId) continue;
        try {
          const existingClass = await query(`SELECT id FROM "public"."classes" WHERE name = $1`, [cl.name]);
          if (existingClass.rows.length === 0) {
            const classId = crypto.randomUUID();
            if (classCols.has('code')) {
              await query(
                `INSERT INTO "public"."classes" (id, name, code, "courseId", "teacherId", "maxStudents", "isActive", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '15 days', NOW())`,
                [classId, cl.name, cl.code, cl.courseId, cl.teacherId, cl.maxStudents, cl.isActive]
              );
            } else {
              await query(
                `INSERT INTO "public"."classes" (id, name, "courseId", "teacherId", "isActive", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '15 days', NOW())`,
                [classId, cl.name, cl.courseId, cl.teacherId, cl.isActive]
              );
            }
          }
        } catch (classErr) {
          console.warn(`⚠️ Warning seeding class ${cl.name}:`, classErr.message);
        }
      }
    }

    // =========================================================================
    // 6. SEED ENROLLMENTS
    // =========================================================================
    console.log('📝 Seeding Student Enrollments...');
    if (tables.has('enrollments')) {
      const studentAlex = createdStudents['alex.student@linguachris.com']?.profileId || createdUsers['alex.student@linguachris.com'];
      const studentMaria = createdStudents['maria.garcia@linguachris.com']?.profileId || createdUsers['maria.garcia@linguachris.com'];
      const studentLucas = createdStudents['lucas.muller@linguachris.com']?.profileId || createdUsers['lucas.muller@linguachris.com'];
      const studentFatima = createdStudents['fatima.zahra@linguachris.com']?.profileId || createdUsers['fatima.zahra@linguachris.com'];
      const studentLiam = createdStudents['liam.chen@linguachris.com']?.profileId || createdUsers['liam.chen@linguachris.com'];
      const studentYuki = createdStudents['yuki.tanaka@linguachris.com']?.profileId || createdUsers['yuki.tanaka@linguachris.com'];
      const studentChloe = createdStudents['chloe.bennett@linguachris.com']?.profileId || createdUsers['chloe.bennett@linguachris.com'];
      const studentCarlos = createdStudents['carlos.mendoza@linguachris.com']?.profileId || createdUsers['carlos.mendoza@linguachris.com'];
      const studentDavid = createdStudents['david.kim@linguachris.com']?.profileId || createdUsers['david.kim@linguachris.com'];
      const studentAmara = createdStudents['amara.okafor@linguachris.com']?.profileId || createdUsers['amara.okafor@linguachris.com'];

      const enrollmentSeedData = [
        // ACTIVE Enrollments
        {
          studentId: studentAlex,
          courseId: createdCourses['B1'],
          status: 'ACTIVE',
          expiresDays: 60,
        },
        {
          studentId: studentMaria,
          courseId: createdCourses['A2'],
          status: 'ACTIVE',
          expiresDays: 90,
        },
        {
          studentId: studentLucas,
          courseId: createdCourses['B2'],
          status: 'ACTIVE',
          expiresDays: 120,
        },
        {
          studentId: studentAmara,
          courseId: createdCourses['C1'],
          status: 'ACTIVE',
          expiresDays: 45,
        },
        // PENDING Enrollments
        {
          studentId: studentFatima,
          courseId: createdCourses['A1'],
          status: 'PENDING',
          expiresDays: 30,
        },
        {
          studentId: studentLiam,
          courseId: createdCourses['B1'],
          status: 'PENDING',
          expiresDays: 45,
        },
        // EXPIRED Enrollments
        {
          studentId: studentYuki,
          courseId: createdCourses['A1'],
          status: 'EXPIRED',
          expiresDays: -15,
        },
        {
          studentId: studentChloe,
          courseId: createdCourses['A2'],
          status: 'EXPIRED',
          expiresDays: -45,
        },
        // SUSPENDED Enrollments
        {
          studentId: studentCarlos,
          courseId: createdCourses['B1'],
          status: 'SUSPENDED',
          expiresDays: -30,
        },
        {
          studentId: studentDavid,
          courseId: createdCourses['C1'],
          status: 'SUSPENDED',
          expiresDays: -60,
        },
      ];

      const enrollCols = await getColumns('enrollments');
      for (const en of enrollmentSeedData) {
        if (!en.studentId || !en.courseId) continue;
        try {
          const existingEn = await query(
            `SELECT id FROM "public"."enrollments" WHERE "studentId" = $1 AND "courseId" = $2`,
            [en.studentId, en.courseId]
          );
          const expiresAt = new Date(Date.now() + en.expiresDays * 24 * 60 * 60 * 1000);

          if (existingEn.rows.length === 0) {
            const enId = crypto.randomUUID();
            const cols = ['id', '"studentId"', '"courseId"', 'status'];
            const vals = [enId, en.studentId, en.courseId, en.status];
            
            if (enrollCols.has('enrolledAt')) {
              cols.push('"enrolledAt"');
              vals.push(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000));
            }
            if (enrollCols.has('expiresAt')) {
              cols.push('"expiresAt"');
              vals.push(expiresAt);
            }
            if (enrollCols.has('activatedAt')) {
              cols.push('"activatedAt"');
              vals.push(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000));
            }
            if (enrollCols.has('createdAt')) {
              cols.push('"createdAt"');
              vals.push(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000));
            }
            if (enrollCols.has('updatedAt')) {
              cols.push('"updatedAt"');
              vals.push(new Date());
            }

            const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
            await query(
              `INSERT INTO "public"."enrollments" (${cols.join(', ')}) VALUES (${placeholders})`,
              vals
            );
          } else {
            // Update existing enrollment status & expiration
            await query(
              `UPDATE "public"."enrollments" SET status = $1, "expiresAt" = $2 WHERE id = $3`,
              [en.status, expiresAt, existingEn.rows[0].id]
            );
          }
        } catch (enErr) {
          console.warn(`⚠️ Warning seeding enrollment:`, enErr.message);
        }
      }
    }

    // =========================================================================
    // 7. SEED PAYMENTS & FINANCIAL TRANSACTIONS
    // =========================================================================
    console.log('💳 Seeding Financial Transactions & Payment Receipts...');
    if (tables.has('payments')) {
      const payCols = await getColumns('payments');
      const studentAlex = createdStudents['alex.student@linguachris.com']?.profileId || createdUsers['alex.student@linguachris.com'];
      const studentMaria = createdStudents['maria.garcia@linguachris.com']?.profileId || createdUsers['maria.garcia@linguachris.com'];
      const studentLucas = createdStudents['lucas.muller@linguachris.com']?.profileId || createdUsers['lucas.muller@linguachris.com'];
      const studentFatima = createdStudents['fatima.zahra@linguachris.com']?.profileId || createdUsers['fatima.zahra@linguachris.com'];
      const studentLiam = createdStudents['liam.chen@linguachris.com']?.profileId || createdUsers['liam.chen@linguachris.com'];
      const studentChloe = createdStudents['chloe.bennett@linguachris.com']?.profileId || createdUsers['chloe.bennett@linguachris.com'];
      const studentCarlos = createdStudents['carlos.mendoza@linguachris.com']?.profileId || createdUsers['carlos.mendoza@linguachris.com'];
      const studentAmara = createdStudents['amara.okafor@linguachris.com']?.profileId || createdUsers['amara.okafor@linguachris.com'];

      const superadminId = createdUsers['superadmin@linguachris.com'];

      const paymentSeedData = [
        // VERIFIED
        {
          ref: 'TXN-LC-2026-8910',
          studentId: studentAlex,
          teacherId: teacherSarah,
          amount: 129.0,
          currency: 'USD',
          status: 'VERIFIED',
          method: 'STRIPE_CARD',
          receipt: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          notes: 'Full tuition verified by automated Stripe webhook',
          verifiedBy: superadminId,
        },
        {
          ref: 'TXN-LC-2026-8911',
          studentId: studentMaria,
          teacherId: teacherMarcus,
          amount: 79.0,
          currency: 'USD',
          status: 'VERIFIED',
          method: 'BANK_TRANSFER',
          receipt: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
          notes: 'Wire transfer confirmed via platform superadmin ledger',
          verifiedBy: superadminId,
        },
        {
          ref: 'TXN-LC-2026-8912',
          studentId: studentLucas,
          teacherId: teacherSarah,
          amount: 189.0,
          currency: 'USD',
          status: 'VERIFIED',
          method: 'PAYPAL',
          receipt: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          notes: 'Instant PayPal IPN verification',
          verifiedBy: superadminId,
        },
        {
          ref: 'TXN-LC-2026-8913',
          studentId: studentChloe,
          teacherId: teacherMarcus,
          amount: 99.0,
          currency: 'USD',
          status: 'VERIFIED',
          method: 'STRIPE_CARD',
          receipt: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          notes: 'Automated recurring course billing',
          verifiedBy: superadminId,
        },
        // PENDING
        {
          ref: 'TXN-LC-2026-9045',
          studentId: studentFatima,
          teacherId: teacherMarcus,
          amount: 49.0,
          currency: 'USD',
          status: 'PENDING',
          method: 'MANUAL_DEPOSIT',
          receipt: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
          notes: 'Pending superadmin review: uploaded ATM cash transfer slip',
          verifiedBy: null,
        },
        {
          ref: 'TXN-LC-2026-9047',
          studentId: studentLiam,
          teacherId: teacherSarah,
          amount: 149.0,
          currency: 'USD',
          status: 'PENDING',
          method: 'BANK_TRANSFER',
          receipt: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
          notes: 'Pending international SWIFT wire confirmation',
          verifiedBy: null,
        },
        // REJECTED
        {
          ref: 'TXN-LC-2026-9046',
          studentId: studentAmara,
          teacherId: teacherSarah,
          amount: 249.0,
          currency: 'USD',
          status: 'REJECTED',
          method: 'BANK_TRANSFER',
          receipt: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
          notes: 'Rejected by Superadmin: unverified bank slip with mismatched account holder name',
          verifiedBy: superadminId,
        },
        {
          ref: 'TXN-LC-2026-9048',
          studentId: studentCarlos,
          teacherId: teacherMarcus,
          amount: 119.0,
          currency: 'USD',
          status: 'REJECTED',
          method: 'MANUAL_DEPOSIT',
          receipt: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
          notes: 'Rejected by Superadmin: duplicate transaction reference with unreadable receipt image',
          verifiedBy: superadminId,
        },
      ];

      for (const p of paymentSeedData) {
        if (!p.studentId) continue;
        try {
          const checkCol = payCols.has('transactionRef') ? 'transactionRef' : (payCols.has('referenceNumber') ? 'referenceNumber' : null);
          if (checkCol) {
            const existing = await query(`SELECT id FROM "public"."payments" WHERE "${checkCol}" = $1`, [p.ref]);
            if (existing.rows.length > 0) {
              await query(`UPDATE "public"."payments" SET status = $1, amount = $2 WHERE id = $3`, [p.status, p.amount, existing.rows[0].id]);
              continue;
            }
          }

          const pId = crypto.randomUUID();
          const colList = ['id', 'amount', 'status'];
          const valList = [pId, p.amount, p.status];
          let vIdx = 4;

          if (payCols.has('transactionRef')) {
            colList.push('transactionRef');
            valList.push(p.ref);
          } else if (payCols.has('referenceNumber')) {
            colList.push('referenceNumber');
            valList.push(p.ref);
          }

          if (payCols.has('currency')) {
            colList.push('currency');
            valList.push(p.currency);
          }

          if (payCols.has('studentId')) {
            colList.push('studentId');
            valList.push(p.studentId);
          }

          if (payCols.has('teacherId')) {
            colList.push('teacherId');
            valList.push(p.teacherId);
          }

          if (payCols.has('paymentMethod')) {
            colList.push('paymentMethod');
            valList.push(p.method);
          }

          if (payCols.has('receiptUrl')) {
            colList.push('receiptUrl');
            valList.push(p.receipt);
          } else if (payCols.has('proofUrl')) {
            colList.push('proofUrl');
            valList.push(p.receipt);
          }

          if (payCols.has('notes')) {
            colList.push('notes');
            valList.push(p.notes);
          }

          if (payCols.has('verifiedBy') && p.verifiedBy) {
            colList.push('verifiedBy');
            valList.push(p.verifiedBy);
          }

          if (payCols.has('createdAt')) {
            colList.push('createdAt');
            valList.push(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000));
          }

          if (payCols.has('updatedAt')) {
            colList.push('updatedAt');
            valList.push(new Date());
          }

          const placeholders = valList.map((_, i) => `$${i + 1}`).join(', ');
          const sql = `INSERT INTO "public"."payments" (${colList.map((c) => `"${c}"`).join(', ')})
                       VALUES (${placeholders})`;

          await query(sql, valList);
        } catch (payErr) {
          console.warn(`⚠️ Warning seeding payment ${p.ref}:`, payErr.message);
        }
      }
      console.log('✅ Seeded payments and transactions with dynamic schema alignment.');
    }

    // =========================================================================
    // 8. SEED ANNOUNCEMENTS & NOTIFICATIONS
    // =========================================================================
    console.log('📢 Seeding Announcements & Notifications...');
    if (tables.has('announcements')) {
      const superadminId = createdUsers['superadmin@linguachris.com'];
      const announcementSeedData = [
        {
          title: 'Official Launch of CEFR Q3 2026 Curriculum Upgrades',
          content: 'We are thrilled to announce updated interactive audio listening drills and CEFR-aligned vocabulary banks across all B1-C1 courses. Teachers are encouraged to explore the new unit materials.',
          targetRole: 'ALL',
          isPublished: true,
          authorId: superadminId,
        },
        {
          title: 'Scheduled System Maintenance Notice: Server Infrastructure Upgrade',
          content: 'The LinguaChris LMS platform will undergo a brief database optimization on Sunday at 02:00 UTC. Expected downtime is under 15 minutes. All learning progress is preserved in real time.',
          targetRole: 'ALL',
          isPublished: true,
          authorId: superadminId,
        },
        {
          title: 'Instructor Studio: Diagnostic Placement Quiz Engine Live',
          content: 'Certified teachers can now create and assign AI-assisted adaptive diagnostic placement tests directly from the Teacher Portal. Access is live under Quizzes & Assessments.',
          targetRole: 'TEACHER',
          isPublished: true,
          authorId: superadminId,
        },
      ];

      for (const a of announcementSeedData) {
        try {
          const existingA = await query(`SELECT id FROM "public"."announcements" WHERE title = $1`, [a.title]);
          if (existingA.rows.length === 0) {
            const aId = crypto.randomUUID();
            await query(
              `INSERT INTO "public"."announcements" (id, title, content, "targetRole", "isPublished", "authorId", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '3 days', NOW())`,
              [aId, a.title, a.content, a.targetRole, a.isPublished, a.authorId]
            );
          }
        } catch (annErr) {
          console.warn(`⚠️ Warning seeding announcement:`, annErr.message);
        }
      }
    }

    // =========================================================================
    // 9. SEED AUDIT LOGS
    // =========================================================================
    console.log('🛡️ Seeding Security Audit Logs...');
    if (tables.has('audit_logs')) {
      const auditCols = await getColumns('audit_logs');
      const superadminId = createdUsers['superadmin@linguachris.com'];
      const auditLogSeedData = [
        {
          action: 'TEACHER_APPROVED',
          entity: 'TeacherProfile',
          entityId: createdTeachers['sarah.jenkins@linguachris.com']?.profileId || 'tp-1',
          userId: superadminId,
          details: 'Approved Sarah Jenkins credentials with hourly rate $45.00/hr',
        },
        {
          action: 'PAYMENT_VERIFIED',
          entity: 'Payment',
          entityId: 'TXN-LC-2026-8910',
          userId: superadminId,
          details: 'Verified $129.00 tuition payment for student Alex Mercer',
        },
        {
          action: 'COURSE_PUBLISHED',
          entity: 'Course',
          entityId: createdCourses['C1'] || 'c-1',
          userId: superadminId,
          details: 'Published CEFR C1 Academic IELTS Masterclass to public catalog',
        },
        {
          action: 'USER_STATUS_CHANGE',
          entity: 'User',
          entityId: createdUsers['claire.dubois@linguachris.com'] || 'u-1',
          userId: superadminId,
          details: 'Suspended instructor account Claire Dubois pending curriculum audit',
        },
        {
          action: 'ANNOUNCEMENT_BROADCAST',
          entity: 'Announcement',
          entityId: 'ann-1',
          userId: superadminId,
          details: 'Broadcast global maintenance notification to all users',
        },
      ];

      for (const log of auditLogSeedData) {
        try {
          const logId = crypto.randomUUID();
          if (auditCols.has('metadata')) {
            await query(
              `INSERT INTO "public"."audit_logs" (id, action, entity, "entityId", "userId", metadata, "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '2 days')`,
              [logId, log.action, log.entity, log.entityId, log.userId, JSON.stringify({ message: log.details })]
            );
          } else if (auditCols.has('details')) {
            await query(
              `INSERT INTO "public"."audit_logs" (id, action, entity, "entityId", "userId", details, "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '2 days')`,
              [logId, log.action, log.entity, log.entityId, log.userId, log.details]
            );
          } else {
            await query(
              `INSERT INTO "public"."audit_logs" (id, action, entity, "entityId", "userId", "createdAt")
               VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '2 days')`,
              [logId, log.action, log.entity, log.entityId, log.userId]
            );
          }
        } catch (auditErr) {
          console.warn(`⚠️ Warning seeding audit log:`, auditErr.message);
        }
      }
    }

    console.log('\n🎉 =========================================================');
    console.log('🎉 Comprehensive Test Data Seeding Completed Successfully!');
    console.log('🎉 =========================================================\n');

    return { success: true, message: 'All test data seeded successfully' };
  } catch (err) {
    console.error('💥 Seeding Error:', err);
    return { success: false, error: err.message };
  }
}
