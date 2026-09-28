import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { UserModel } from './user.model.js';
import { AuthService } from '../services/auth.service.js';

export class AdmissionModel {
  /**
   * 1. Submit online student application (/apply)
   * Status: PENDING, Access: LOCKED
   */
  static async submitApplication({
    firstName,
    lastName,
    email,
    password,
    phone = '',
    nativeLanguage = '',
    currentEnglishLevel = 'Beginner',
    motivation = '',
    learningGoals = [],
  }) {
    // 1. Check if email already registered
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      const error = new Error('An account with this email address already exists. Please log in.');
      error.statusCode = 409;
      error.code = 'USER_ALREADY_EXISTS';
      throw error;
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = crypto.randomUUID();

    // 3. Create user record
    const userRes = await query(
      `INSERT INTO "public"."users" 
        (id, email, "passwordHash", "firstName", "lastName", phone, role, status, "isVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'STUDENT', 'ACTIVE', true, NOW(), NOW())
       RETURNING id, email, "firstName", "lastName", phone, role, status, "isVerified", "createdAt"`,
      [userId, email.toLowerCase().trim(), passwordHash, firstName.trim(), lastName.trim(), phone.trim()]
    );
    const user = userRes.rows[0];

    // 4. Create student_profile with explicit admission and access state
    const profileId = crypto.randomUUID();
    const appData = {
      phone,
      nativeLanguage,
      currentEnglishLevel,
      motivation,
      learningGoals: Array.isArray(learningGoals) ? learningGoals : [learningGoals].filter(Boolean),
      appliedAt: new Date().toISOString(),
    };

    const profileRes = await query(
      `INSERT INTO "public"."student_profiles"
        (id, "userId", "admissionType", "applicationStatus", "paymentRequirement", "paymentStatus", "learningAccess", "applicationData", "nativeLanguage", "learningGoals", "createdAt", "updatedAt")
       VALUES ($1, $2, 'APPLICATION', 'PENDING', 'PAYMENT_REQUIRED', 'UNPAID', 'LOCKED', $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [profileId, userId, JSON.stringify(appData), nativeLanguage, Array.isArray(learningGoals) ? learningGoals : []]
    );
    const profile = profileRes.rows[0];

    // 5. Record initial audit log
    await this.recordAudit({
      studentId: userId,
      changedBy: userId,
      action: 'APPLICATION_SUBMITTED',
      fromState: null,
      toState: {
        admissionType: 'APPLICATION',
        applicationStatus: 'PENDING',
        paymentRequirement: 'PAYMENT_REQUIRED',
        paymentStatus: 'UNPAID',
        learningAccess: 'LOCKED',
      },
      notes: 'Student submitted online application via /apply',
    });

    // 6. Generate auth tokens so student can log in and view their status page
    const tokens = await AuthService.generateTokenPair(user);

    return { user, profile, tokens };
  }

  /**
   * 2. Get full student admission, payment, and learning access status
   */
  static async getStudentStatus(studentUserId) {
    const userRes = await query(
      `SELECT u.id, u.email, u."firstName", u."lastName", u.phone, u.role, u.status, u."avatarUrl", u."createdAt",
              sp.id as "profileId", sp."admissionType", sp."applicationStatus", sp."rejectionReason",
              sp."paymentRequirement", sp."paymentStatus", sp."learningAccess", sp."applicationData",
              sp."reviewedAt", sp."reviewedBy", sp."levelId",
              l.name as "levelName", l.code as "levelCode"
       FROM "public"."users" u
       LEFT JOIN "public"."student_profiles" sp ON sp."userId" = u.id
       LEFT JOIN "public"."levels" l ON l.id = sp."levelId"
       WHERE (u.id = $1 OR sp.id = $1)`,
      [studentUserId]
    );

    const row = userRes.rows[0];
    if (!row) return null;

    // Get latest payment proof submission if any
    const paymentRes = await query(
      `SELECT p.id, p.amount, p.currency, p.status, p."paymentMethod", p."transactionRef", p."receiptUrl", p.notes, p."verifiedAt", p."createdAt"
       FROM "public"."payments" p
       WHERE (p."studentId" = $1 OR p."studentId" = $2)
       ORDER BY p."createdAt" DESC
       LIMIT 1`,
      [row.profileId, row.id]
    );
    const latestPayment = paymentRes.rows[0] || null;

    // Get recent audit logs
    const auditsRes = await query(
      `SELECT a.id, a.action, a."fromState", a."toState", a.notes, a."createdAt",
              u."firstName" as "changedByFirstName", u."lastName" as "changedByLastName", u.role as "changedByRole"
       FROM "public"."student_status_audits" a
       LEFT JOIN "public"."users" u ON u.id = a."changedBy"
       WHERE a."studentId" = $1
       ORDER BY a."createdAt" DESC
       LIMIT 20`,
      [studentUserId]
    );

    return {
      user: {
        id: row.id,
        email: row.email,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        avatarUrl: row.avatarUrl,
        createdAt: row.createdAt,
      },
      admission: {
        profileId: row.profileId,
        admissionType: row.admissionType || 'DIRECT',
        applicationStatus: row.applicationStatus || 'ACCEPTED',
        rejectionReason: row.rejectionReason,
        paymentRequirement: row.paymentRequirement || 'PAYMENT_NOT_REQUIRED',
        paymentStatus: row.paymentStatus || 'UNPAID',
        learningAccess: row.learningAccess || 'ACTIVE',
        applicationData: row.applicationData || {},
        reviewedAt: row.reviewedAt,
        reviewedBy: row.reviewedBy,
        level: row.levelId ? { id: row.levelId, name: row.levelName, code: row.levelCode } : null,
      },
      // Flat fields for direct frontend/API convenience:
      studentProfileId: row.profileId,
      admissionType: row.admissionType || 'DIRECT',
      applicationStatus: row.applicationStatus || 'ACCEPTED',
      rejectionReason: row.rejectionReason,
      paymentRequirement: row.paymentRequirement || 'PAYMENT_NOT_REQUIRED',
      paymentStatus: row.paymentStatus || 'UNPAID',
      learningAccess: row.learningAccess || 'ACTIVE',
      applicationData: row.applicationData || {},
      level: row.levelId ? { id: row.levelId, name: row.levelName, code: row.levelCode } : null,
      latestPayment,
      audits: auditsRes.rows,
      auditTrail: auditsRes.rows,
    };
  }

  /**
   * 3. List applications for teacher review
   */
  static async listApplications({ status = 'ALL', search = '', limit = 50, offset = 0 }) {
    let whereClauses = [`u.role = 'STUDENT'`];
    let params = [];
    let idx = 1;

    if (status && status !== 'ALL') {
      whereClauses.push(`sp."applicationStatus" = $${idx}`);
      params.push(status);
      idx++;
    }

    if (search && search.trim()) {
      whereClauses.push(`(u."firstName" ILIKE $${idx} OR u."lastName" ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(`%${search.trim()}%`);
      idx++;
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const listQuery = `
      SELECT u.id as "id", u.id as "studentId", u.id as "userId", u.email, u."firstName", u."lastName", u.phone, u."avatarUrl", u."createdAt" as "registeredAt",
             sp.id as "profileId", sp."admissionType", sp."applicationStatus", sp."rejectionReason",
             sp."paymentRequirement", sp."paymentStatus", sp."learningAccess", sp."applicationData",
             sp."reviewedAt", sp."reviewedBy", sp."levelId",
             l.name as "levelName", l.code as "levelCode",
             (SELECT p.id FROM "public"."payments" p WHERE p."studentId" = sp.id ORDER BY p."createdAt" DESC LIMIT 1) as "latestPaymentId",
             (SELECT p.status FROM "public"."payments" p WHERE p."studentId" = sp.id ORDER BY p."createdAt" DESC LIMIT 1) as "latestPaymentStatus",
             (SELECT p."receiptUrl" FROM "public"."payments" p WHERE p."studentId" = sp.id ORDER BY p."createdAt" DESC LIMIT 1) as "latestReceiptUrl",
             (SELECT p.amount FROM "public"."payments" p WHERE p."studentId" = sp.id ORDER BY p."createdAt" DESC LIMIT 1) as "latestPaymentAmount"
      FROM "public"."users" u
      JOIN "public"."student_profiles" sp ON sp."userId" = u.id
      LEFT JOIN "public"."levels" l ON l.id = sp."levelId"
      ${whereStr}
      ORDER BY 
        CASE WHEN sp."applicationStatus" = 'PENDING' THEN 1
             WHEN sp."paymentStatus" = 'PROOF_SUBMITTED' THEN 2
             ELSE 3 END,
        u."createdAt" DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    params.push(limit, offset);
    const res = await query(listQuery, params);

    // Count totals for summary pills
    const countsRes = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE sp."applicationStatus" = 'PENDING') as "pendingCount",
        COUNT(*) FILTER (WHERE sp."applicationStatus" = 'ACCEPTED') as "acceptedCount",
        COUNT(*) FILTER (WHERE sp."applicationStatus" = 'REJECTED') as "rejectedCount",
        COUNT(*) FILTER (WHERE sp."paymentStatus" = 'PROOF_SUBMITTED') as "proofPendingCount",
        COUNT(*) as "totalCount"
      FROM "public"."users" u
      JOIN "public"."student_profiles" sp ON sp."userId" = u.id
      WHERE u.role = 'STUDENT'
    `);

    return {
      applications: res.rows,
      counts: countsRes.rows[0] || {
        pendingCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        proofPendingCount: 0,
        totalCount: 0,
      },
    };
  }

  /**
   * 4. Review student application (Accept or Reject)
   */
  static async reviewApplication(teacherUserId, studentUserId, { decision, rejectionReason, paymentRequirement, levelId, notes = '' }) {
    const current = await this.getStudentStatus(studentUserId);
    if (!current) throw new Error('Student application not found');

    const targetUserId = current.user.id;
    const fromState = { ...current.admission };

    if (decision === 'REJECT') {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error('Please provide a reason for rejecting the application.');
      }

      await query(
        `UPDATE "public"."student_profiles"
         SET "applicationStatus" = 'REJECTED',
             "rejectionReason" = $1,
             "learningAccess" = 'LOCKED',
             "reviewedBy" = $2,
             "reviewedAt" = NOW(),
             "updatedAt" = NOW()
         WHERE "userId" = $3`,
        [rejectionReason.trim(), teacherUserId, targetUserId]
      );

      await this.recordAudit({
        studentId: targetUserId,
        changedBy: teacherUserId,
        action: 'APPLICATION_REJECTED',
        fromState,
        toState: {
          applicationStatus: 'REJECTED',
          rejectionReason,
          learningAccess: 'LOCKED',
        },
        notes: notes || rejectionReason,
      });

      return { success: true, applicationStatus: 'REJECTED', learningAccess: 'LOCKED' };
    }

    if (decision === 'ACCEPT') {
      const validRequirements = ['PAYMENT_REQUIRED', 'PAYMENT_ALREADY_HANDLED', 'PAYMENT_WAIVED', 'PAYMENT_NOT_REQUIRED'];
      const req = validRequirements.includes(paymentRequirement) ? paymentRequirement : 'PAYMENT_REQUIRED';

      // Access becomes ACTIVE if payment handled, waived, or not required. Otherwise LOCKED.
      const unlocksAccess = req !== 'PAYMENT_REQUIRED';
      const learningAccess = unlocksAccess ? 'ACTIVE' : 'LOCKED';
      const paymentStatus = unlocksAccess ? 'VERIFIED' : 'UNPAID';

      await query(
        `UPDATE "public"."student_profiles"
         SET "applicationStatus" = 'ACCEPTED',
             "admissionType" = 'APPLICATION',
             "rejectionReason" = NULL,
             "paymentRequirement" = $1,
             "paymentStatus" = $2,
             "learningAccess" = $3,
             "levelId" = COALESCE($4, "levelId"),
             "reviewedBy" = $5,
             "reviewedAt" = NOW(),
             "updatedAt" = NOW()
         WHERE "userId" = $6`,
        [req, paymentStatus, learningAccess, levelId || null, teacherUserId, targetUserId]
      );

      // If levelId specified and access is ACTIVE, enroll in level courses
      if (levelId && learningAccess === 'ACTIVE') {
        await this.enrollStudentInLevelCourses(targetUserId, levelId);
      }

      await this.recordAudit({
        studentId: studentUserId,
        changedBy: teacherUserId,
        action: 'APPLICATION_ACCEPTED',
        fromState,
        toState: {
          applicationStatus: 'ACCEPTED',
          paymentRequirement: req,
          paymentStatus,
          learningAccess,
          levelId: levelId || current.admission.level?.id,
        },
        notes: notes || `Application accepted with payment requirement: ${req}`,
      });

      return {
        success: true,
        applicationStatus: 'ACCEPTED',
        paymentRequirement: req,
        learningAccess,
      };
    }

    throw new Error('Invalid review decision. Must be ACCEPT or REJECT.');
  }

  /**
   * 5. Direct Student Creation by Teacher
   */
  static async createDirectStudent(teacherUserId, { firstName, lastName, email, phone = '', password, levelId = null, paymentRequirement = 'PAYMENT_NOT_REQUIRED', notes = '' }) {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      throw new Error(`A user with email ${email} already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'Student123!', salt);
    const userId = crypto.randomUUID();

    // 1. Create user
    const userRes = await query(
      `INSERT INTO "public"."users" 
        (id, email, "passwordHash", "firstName", "lastName", phone, role, status, "isVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'STUDENT', 'ACTIVE', true, NOW(), NOW())
       RETURNING id, email, "firstName", "lastName", phone, role, status, "createdAt"`,
      [userId, email.toLowerCase().trim(), passwordHash, firstName.trim(), lastName.trim(), phone.trim()]
    );
    const user = userRes.rows[0];

    // 2. Determine access state based on payment decision
    const validRequirements = ['PAYMENT_REQUIRED', 'PAYMENT_ALREADY_HANDLED', 'PAYMENT_WAIVED', 'PAYMENT_NOT_REQUIRED'];
    const req = validRequirements.includes(paymentRequirement) ? paymentRequirement : 'PAYMENT_NOT_REQUIRED';
    const unlocksAccess = req !== 'PAYMENT_REQUIRED';
    const learningAccess = unlocksAccess ? 'ACTIVE' : 'LOCKED';
    const paymentStatus = unlocksAccess ? 'VERIFIED' : 'UNPAID';

    const profileId = crypto.randomUUID();
    const appData = {
      phone,
      createdDirectlyBy: teacherUserId,
      notes,
      enrolledAt: new Date().toISOString(),
    };

    await query(
      `INSERT INTO "public"."student_profiles"
        (id, "userId", "admissionType", "applicationStatus", "paymentRequirement", "paymentStatus", "learningAccess", "levelId", "applicationData", "reviewedBy", "reviewedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, 'DIRECT', 'ACCEPTED', $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())`,
      [profileId, userId, req, paymentStatus, learningAccess, levelId || null, JSON.stringify(appData), teacherUserId]
    );

    // 3. If level selected and access is ACTIVE, enroll in level courses
    if (levelId && learningAccess === 'ACTIVE') {
      await this.enrollStudentInLevelCourses(userId, levelId);
    }

    // 4. Record audit log
    await this.recordAudit({
      studentId: userId,
      changedBy: teacherUserId,
      action: 'DIRECT_ADMISSION_CREATED',
      fromState: null,
      toState: {
        admissionType: 'DIRECT',
        applicationStatus: 'ACCEPTED',
        paymentRequirement: req,
        paymentStatus,
        learningAccess,
        levelId,
      },
      notes: notes || `Direct student created with payment requirement: ${req}`,
    });

    return { user, admissionType: 'DIRECT', paymentRequirement: req, learningAccess };
  }

  /**
   * 6. Student submits payment proof
   */
  static async submitPaymentProof(studentUserId, { amount, currency = 'RWF', paymentMethod, transactionRef, receiptUrl = '', paymentDate, notes = '' }) {
    const status = await this.getStudentStatus(studentUserId);
    if (!status) throw new Error('Student profile not found');

    const targetUserId = status.user.id;

    const paymentId = crypto.randomUUID();
    const paymentRes = await query(
      `INSERT INTO "public"."payments"
        (id, "studentId", amount, currency, status, "paymentMethod", "transactionRef", "receiptUrl", notes, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [paymentId, status.admission.profileId || targetUserId, Number(amount) || 0, currency || 'RWF', paymentMethod || 'Mobile Money', transactionRef || `REF-${Date.now()}`, receiptUrl || '', notes || '']
    );

    // Update student payment status to PROOF_SUBMITTED (learningAccess remains LOCKED until verified)
    await query(
      `UPDATE "public"."student_profiles"
       SET "paymentStatus" = 'PROOF_SUBMITTED',
           "updatedAt" = NOW()
       WHERE "userId" = $1`,
      [targetUserId]
    );

    await this.recordAudit({
      studentId: targetUserId,
      changedBy: targetUserId,
      action: 'PAYMENT_PROOF_SUBMITTED',
      fromState: { paymentStatus: status.admission.paymentStatus },
      toState: { paymentStatus: 'PROOF_SUBMITTED', paymentId, amount, transactionRef },
      notes: `Proof submitted: ${paymentMethod} ref #${transactionRef} ($${amount})`,
    });

    return paymentRes.rows[0];
  }

  /**
   * 7. Verify or Reject payment proof by Teacher
   */
  static async verifyPaymentProof(teacherUserId, studentUserId, { paymentId = null, notes = '' }) {
    const status = await this.getStudentStatus(studentUserId);
    if (!status) throw new Error('Student profile not found');

    const targetUserId = status.user.id;
    const targetPaymentId = paymentId || status.latestPayment?.id;

    if (targetPaymentId) {
      await query(
        `UPDATE "public"."payments"
         SET status = 'VERIFIED',
             "verifiedAt" = NOW(),
             "updatedAt" = NOW()
         WHERE id = $1`,
        [targetPaymentId]
      );
    }

    // Unlocks learning access
    await query(
      `UPDATE "public"."student_profiles"
       SET "paymentStatus" = 'VERIFIED',
           "learningAccess" = 'ACTIVE',
           "updatedAt" = NOW()
       WHERE "userId" = $1`,
      [targetUserId]
    );

    // If level is set, ensure enrolled into level courses
    if (status.admission.level?.id) {
      await this.enrollStudentInLevelCourses(targetUserId, status.admission.level.id);
    }

    await this.recordAudit({
      studentId: targetUserId,
      changedBy: teacherUserId,
      action: 'PAYMENT_VERIFIED',
      fromState: { paymentStatus: status.admission.paymentStatus, learningAccess: status.admission.learningAccess },
      toState: { paymentStatus: 'VERIFIED', learningAccess: 'ACTIVE' },
      notes: notes || 'Payment verified by faculty. Learning access unlocked.',
    });

    return { success: true, paymentStatus: 'VERIFIED', learningAccess: 'ACTIVE' };
  }

  static async rejectPaymentProof(teacherUserId, studentUserId, { paymentId = null, reason = 'Receipt could not be verified' }) {
    const status = await this.getStudentStatus(studentUserId);
    if (!status) throw new Error('Student profile not found');

    const targetUserId = status.user.id;

    const targetPaymentId = paymentId || status.latestPayment?.id;

    if (targetPaymentId) {
      await query(
        `UPDATE "public"."payments"
         SET status = 'REJECTED',
             notes = $1,
             "updatedAt" = NOW()
         WHERE id = $2`,
        [reason, targetPaymentId]
      );
    }

    await query(
      `UPDATE "public"."student_profiles"
       SET "paymentStatus" = 'REJECTED',
           "learningAccess" = 'LOCKED',
           "updatedAt" = NOW()
       WHERE "userId" = $1`,
      [targetUserId]
    );

    await this.recordAudit({
      studentId: targetUserId,
      changedBy: teacherUserId,
      action: 'PAYMENT_REJECTED',
      fromState: { paymentStatus: status.admission.paymentStatus, learningAccess: status.admission.learningAccess },
      toState: { paymentStatus: 'REJECTED', learningAccess: 'LOCKED', rejectionReason: reason },
      notes: reason,
    });

    return { success: true, paymentStatus: 'REJECTED', learningAccess: 'LOCKED' };
  }

  /**
   * 8. Change payment requirement (REQUIRED -> WAIVED/ALREADY_HANDLED unlocks access, etc.)
   */
  static async changePaymentRequirement(teacherUserId, studentUserId, { paymentRequirement, reason = '' }) {
    const valid = ['PAYMENT_REQUIRED', 'PAYMENT_ALREADY_HANDLED', 'PAYMENT_WAIVED', 'PAYMENT_NOT_REQUIRED'];
    if (!valid.includes(paymentRequirement)) {
      throw new Error(`Invalid payment requirement. Must be one of: ${valid.join(', ')}`);
    }

    const current = await this.getStudentStatus(studentUserId);
    if (!current) throw new Error('Student profile not found');

    const targetUserId = current.user.id;
    const fromState = {
      paymentRequirement: current.admission.paymentRequirement,
      paymentStatus: current.admission.paymentStatus,
      learningAccess: current.admission.learningAccess,
    };

    // If teacher changes: REQUIRED -> WAIVED/ALREADY_HANDLED/NOT_REQUIRED => UNLOCK ACCESS
    // If changed: WAIVED/ALREADY_HANDLED/NOT_REQUIRED -> REQUIRED => LOCK ACCESS
    let learningAccess = current.admission.learningAccess;
    let paymentStatus = current.admission.paymentStatus;

    if (paymentRequirement === 'PAYMENT_REQUIRED') {
      learningAccess = 'LOCKED';
      paymentStatus = 'UNPAID';
    } else {
      // Waived, Handled, or Not Required
      learningAccess = 'ACTIVE';
      paymentStatus = 'VERIFIED';
    }

    await query(
      `UPDATE "public"."student_profiles"
       SET "paymentRequirement" = $1,
           "paymentStatus" = $2,
           "learningAccess" = $3,
           "updatedAt" = NOW()
       WHERE "userId" = $4`,
      [paymentRequirement, paymentStatus, learningAccess, targetUserId]
    );

    // If access unlocked and level is assigned, enroll into level courses
    if (learningAccess === 'ACTIVE' && current.admission.level?.id) {
      await this.enrollStudentInLevelCourses(targetUserId, current.admission.level.id);
    }

    await this.recordAudit({
      studentId: targetUserId,
      changedBy: teacherUserId,
      action: 'PAYMENT_REQUIREMENT_CHANGED',
      fromState,
      toState: {
        paymentRequirement,
        paymentStatus,
        learningAccess,
      },
      notes: reason || `Payment requirement changed to ${paymentRequirement}. Access is now ${learningAccess}.`,
    });

    return {
      success: true,
      paymentRequirement,
      paymentStatus,
      learningAccess,
    };
  }

  /**
   * 9. Enroll student into a Level and its courses
   */
  static async enrollStudentInLevel(teacherUserId, studentUserId, levelId) {
    const current = await this.getStudentStatus(studentUserId);
    if (!current) throw new Error('Student profile not found');

    const targetUserId = current.user.id;

    // 1. Update levelId on profile
    await query(
      `UPDATE "public"."student_profiles"
       SET "levelId" = $1,
           "updatedAt" = NOW()
       WHERE "userId" = $2`,
      [levelId, targetUserId]
    );

    // 2. If learningAccess is ACTIVE, enroll in all courses belonging to this level
    let enrolledCount = 0;
    if (current.admission.learningAccess === 'ACTIVE') {
      enrolledCount = await this.enrollStudentInLevelCourses(targetUserId, levelId);
    }

    await this.recordAudit({
      studentId: targetUserId,
      changedBy: teacherUserId,
      action: 'LEVEL_ENROLLED',
      fromState: { levelId: current.admission.level?.id },
      toState: { levelId, enrolledCoursesCount: enrolledCount },
      notes: `Student enrolled into Level ID ${levelId} with ${enrolledCount} curriculum courses`,
    });

    return { success: true, levelId, enrolledCoursesCount: enrolledCount };
  }

  /**
   * Helper: Enroll student in all courses belonging to a level
   */
  static async enrollStudentInLevelCourses(studentUserId, levelId) {
    const levelCoursesRes = await query(
      `SELECT lc.id as "levelCourseId", lc."courseId"
       FROM "public"."level_courses" lc
       WHERE lc."levelId" = $1`,
      [levelId]
    );

    let enrolledCount = 0;
    for (const lc of levelCoursesRes.rows) {
      const existing = await query(
        `SELECT id FROM "public"."enrollments" WHERE "studentId" = $1 AND "courseId" = $2`,
        [studentUserId, lc.courseId]
      );
      if (existing.rows.length === 0) {
        const enrollmentId = crypto.randomUUID();
        await query(
          `INSERT INTO "public"."enrollments"
            (id, "studentId", "courseId", "levelCourseId", status, "enrolledAt", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW(), NOW())`,
          [enrollmentId, studentUserId, lc.courseId, lc.levelCourseId]
        );
        enrolledCount++;
      }
    }
    return enrolledCount;
  }

  /**
   * Helper: Record immutable status audit log
   */
  static async recordAudit({ studentId, changedBy, action, fromState, toState, notes = '' }) {
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO "public"."student_status_audits"
        (id, "studentId", "changedBy", action, "fromState", "toState", notes, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, studentId, changedBy, action, JSON.stringify(fromState || {}), JSON.stringify(toState || {}), notes]
    );
  }
}
