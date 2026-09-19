import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

export class PublicController {
  /**
   * Verify digital CEFR certificate by public serial code
   */
  async verifyCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      const cert = await prisma.certificate.findUnique({
        where: { certificateCode: code.toUpperCase() },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          course: {
            include: {
              teacher: {
                include: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      });

      if (!cert) {
        throw new AppError('Certificate not found or verification code is invalid.', 404);
      }

      const publicData = {
        certificateCode: cert.certificateCode,
        studentName: `${cert.student.user.firstName} ${cert.student.user.lastName}`,
        courseTitle: cert.course.title,
        levelCompleted: cert.levelCompleted,
        finalGrade: Number(cert.finalGrade),
        issueDate: cert.issueDate.toISOString(),
        instructorName: `${cert.course.teacher.user.firstName} ${cert.course.teacher.user.lastName}`,
        status: cert.isRevoked ? 'REVOKED' : 'VALID',
        isValid: !cert.isRevoked,
        issuedBy: 'LinguaChris Academy International Accreditation Board',
      };

      res.status(200).json({ success: true, data: publicData });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public stats for landing page & about us
   */
  async getPlatformStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [totalStudents, totalCourses, verifiedInstructors] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.course.count({ where: { isPublished: true } }),
        prisma.teacherProfile.count({ where: { isApproved: true } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalStudents: totalStudents || 1200,
          totalCourses: totalCourses || 8,
          verifiedInstructors: verifiedInstructors || 12,
          platformName: 'LinguaChris Academy',
          cefrLevelsSupported: ['PRE_A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all published courses for the public courses catalog
   */
  async listPublishedCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const { level, category, search } = req.query;

      const whereClause: any = {
        isPublished: true,
      };

      if (level && level !== 'ALL') {
        whereClause.level = String(level).toUpperCase();
      }

      if (category && category !== 'ALL') {
        whereClause.category = String(category);
      }

      if (search) {
        whereClause.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const courses = await prisma.course.findMany({
        where: whereClause,
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          units: {
            include: {
              lessons: { select: { id: true } },
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const formattedCourses = courses.map((c: any) => {
        const totalLessons = c.units?.reduce((acc: number, u: any) => acc + (u.lessons?.length || 0), 0) || 16;
        return {
          id: c.id,
          title: c.title,
          description: c.description,
          level: c.level,
          category: c.category || 'General English',
          price: Number(c.price),
          currency: c.currency || 'USD',
          isPublished: c.isPublished,
          durationDays: c.durationDays || 90,
          instructor: {
            name: c.teacher?.user ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}` : 'LinguaChris Faculty',
            avatarUrl: c.teacher?.user?.avatarUrl || null,
          },
          lessonsCount: totalLessons,
          studentsCount: c._count?.enrollments || 0,
          createdAt: c.createdAt,
        };
      });

      res.status(200).json({
        success: true,
        data: formattedCourses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Subscribe to newsletter
   */
  async subscribeNewsletter(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        throw new AppError('A valid email address is required.', 400);
      }

      const normalizedEmail = email.trim().toLowerCase();

      const subscriber = await prisma.newsletterSubscriber.upsert({
        where: { email: normalizedEmail },
        update: { isActive: true },
        create: {
          email: normalizedEmail,
          isActive: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Thank you for subscribing to LinguaChris Academy newsletter!',
        data: {
          id: subscriber.id,
          email: subscriber.email,
          subscribedAt: subscriber.subscribedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit Contact Us message
   */
  async submitContactMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, subject, message } = req.body;

      if (!name || !email || !message) {
        throw new AppError('Name, email, and message are required fields.', 400);
      }

      const contactMessage = await prisma.contactMessage.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : null,
          subject: subject ? subject.trim() : 'General Inquiry',
          message: message.trim(),
        },
      });

      res.status(201).json({
        success: true,
        message: 'Your inquiry has been submitted successfully. An academic advisor will reach out to you shortly.',
        data: contactMessage,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active diagnostic questions for public test
   */
  async getDiagnosticQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      let questions = await prisma.diagnosticQuestion.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' },
      });

      // Auto-seed starter questions if table is empty
      if (questions.length === 0) {
        const DEFAULT_DIAGNOSTIC_QUESTIONS = [
          {
            category: 'Grammar & Conditional Structures',
            skill: 'Grammar',
            difficulty: 'B2' as const,
            prompt: 'Choose the correct form: "If she _____ earlier, she wouldn\'t have missed the flight."',
            options: ['had left', 'left', 'has left', 'would leave'],
            correctAnswer: 'had left',
            explanation: 'Third conditional requires "had + past participle" in the if-clause to describe an unreal past situation.',
            orderIndex: 1,
          },
          {
            category: 'Professional Workplace Vocabulary',
            skill: 'Vocabulary',
            difficulty: 'B2' as const,
            prompt: 'Which word best completes the business context: "We need to _____ cross-functional synergies to optimize output."',
            options: ['leverage', 'dissolve', 'stagnate', 'diminish'],
            correctAnswer: 'leverage',
            explanation: '"Leverage" means to utilize existing resources or strengths to maximum advantage.',
            orderIndex: 2,
          },
          {
            category: 'Dependent Prepositions & Collocations',
            skill: 'Grammar',
            difficulty: 'B1' as const,
            prompt: 'Select the correct preposition: "The executive team is committed _____ expanding in East Africa."',
            options: ['to', 'for', 'with', 'in'],
            correctAnswer: 'to',
            explanation: 'The adjective "committed" is followed by the preposition "to" and a gerund (-ing).',
            orderIndex: 3,
          },
          {
            category: 'Listening & Spoken Phrasing',
            skill: 'Listening',
            difficulty: 'B1' as const,
            prompt: 'Listen to the audio prompt. Which response represents the most polite clarification during a conference call?',
            audioText: 'Could you please elaborate on the projected quarterly timeline?',
            options: [
              '"Certainly, let me walk you through our Phase 2 milestones."',
              '"No, I already explained that earlier."',
              '"Why do you want to know?"',
              '"I will think if I want to tell you."',
            ],
            correctAnswer: '"Certainly, let me walk you through our Phase 2 milestones."',
            explanation: '"Certainly, let me walk you through..." demonstrates professional courtesy and clear business communication etiquette.',
            orderIndex: 4,
          },
          {
            category: 'Tenses & Narrative Discourse',
            skill: 'Reading & Syntax',
            difficulty: 'A2' as const,
            prompt: 'Choose the correct sentence for habitual workplace actions:',
            options: [
              'We usually conduct our team sprint retrospectives every alternate Friday.',
              'We are usually conducting our sprint retrospectives every alternate Friday.',
              'We conducted usually sprint retrospectives every alternate Friday.',
              'We will be conduct sprint retrospectives every alternate Friday.',
            ],
            correctAnswer: 'We usually conduct our team sprint retrospectives every alternate Friday.',
            explanation: 'Present Simple with the frequency adverb "usually" describes regular, repeating routines.',
            orderIndex: 5,
          },
          {
            category: 'Executive Discourse & Idiomatic Precision',
            skill: 'Advanced Fluency',
            difficulty: 'C1' as const,
            prompt: 'In executive negotiation, what does "playing devil\'s advocate" mean?',
            options: [
              'Arguing an opposing viewpoint to test the strength of a business case',
              'Attacking colleagues personally during a disagreement',
              'Refusing to compromise under any condition',
              'Signing a legally binding NDA before talks',
            ],
            correctAnswer: 'Arguing an opposing viewpoint to test the strength of a business case',
            explanation: '"Playing devil\'s advocate" means intentionally advocating an opposite stance to identify potential blind spots.',
            orderIndex: 6,
          },
        ];

        for (const q of DEFAULT_DIAGNOSTIC_QUESTIONS) {
          await prisma.diagnosticQuestion.create({
            data: q,
          });
        }

        questions = await prisma.diagnosticQuestion.findMany({
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        });
      }

      // Return sanitized questions without answer revealing
      const sanitized = questions.map((q) => ({
        id: q.id,
        category: q.category,
        skill: q.skill,
        difficulty: q.difficulty,
        prompt: q.prompt,
        audioText: q.audioText,
        options: q.options,
        orderIndex: q.orderIndex,
      }));

      res.status(200).json({
        success: true,
        data: sanitized,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit diagnostic quiz answers & record attempt with IP and try tracking
   */
  async submitDiagnosticQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const { answers } = req.body;

      if (!Array.isArray(answers) || answers.length === 0) {
        throw new AppError('Answers array is required to submit diagnostic test.', 400);
      }

      // Capture client IP
      const rawIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        req.ip ||
        '127.0.0.1';
      const ipAddress = rawIp.replace(/^::ffff:/, '');

      const userId = (req as any).user?.id || null;

      // Fetch questions from DB
      const questionIds = answers.map((a: any) => a.questionId);
      const dbQuestions = await prisma.diagnosticQuestion.findMany({
        where: { id: { in: questionIds } },
      });

      const questionMap = new Map(dbQuestions.map((q) => [q.id, q]));

      let score = 0;
      const totalQuestions = answers.length;
      const detailedReview: any[] = [];

      for (const ans of answers) {
        const q = questionMap.get(ans.questionId);
        if (!q) continue;

        let selectedText = '';
        if (typeof ans.selectedOption === 'number' && q.options[ans.selectedOption] !== undefined) {
          selectedText = q.options[ans.selectedOption];
        } else {
          selectedText = String(ans.selectedOption || '');
        }

        const isCorrect =
          selectedText.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

        if (isCorrect) {
          score += 1;
        }

        detailedReview.push({
          questionId: q.id,
          prompt: q.prompt,
          category: q.category,
          skill: q.skill,
          difficulty: q.difficulty,
          selectedAnswer: selectedText,
          correctAnswer: q.correctAnswer,
          isCorrect,
          explanation: q.explanation,
        });
      }

      const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

      // Determine recommended CEFR level
      let recommendedLevel: 'PRE_A1' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'A2';
      if (percentage >= 85) recommendedLevel = 'C1';
      else if (percentage >= 65) recommendedLevel = 'B2';
      else if (percentage >= 45) recommendedLevel = 'B1';
      else if (percentage >= 25) recommendedLevel = 'A2';
      else recommendedLevel = 'A1';

      // Count previous attempts for this IP/user to calculate attempt number
      const previousAttempts = await prisma.diagnosticAttempt.count({
        where: userId ? { OR: [{ userId }, { ipAddress }] } : { ipAddress },
      });
      const attemptNumber = previousAttempts + 1;

      // Save attempt in database
      const attempt = await prisma.diagnosticAttempt.create({
        data: {
          ipAddress,
          userId,
          attemptNumber,
          score,
          totalQuestions,
          percentage,
          recommendedLevel,
          answers: detailedReview,
        },
      });

      // Find real matching published course from database
      const dbCourse =
        (await prisma.course.findFirst({
          where: {
            level: recommendedLevel as any,
            isPublished: true,
          },
          include: {
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        })) ||
        (await prisma.course.findFirst({
          where: { isPublished: true },
          include: {
            teacher: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        }));

      const recommendedCourse = dbCourse
        ? {
            id: dbCourse.id,
            title: dbCourse.title,
            slug: dbCourse.slug,
            level: dbCourse.level,
            price: Number(dbCourse.price),
            currency: dbCourse.currency,
            description: dbCourse.description,
            instructorName: `${dbCourse.teacher.user.firstName} ${dbCourse.teacher.user.lastName}`,
          }
        : null;

      res.status(200).json({
        success: true,
        data: {
          attemptId: attempt.id,
          attemptNumber,
          score,
          totalQuestions,
          percentage: Number(percentage.toFixed(1)),
          recommendedLevel,
          ipAddress,
          recommendedCourse,
          review: detailedReview,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const publicController = new PublicController();

