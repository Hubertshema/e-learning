import { prisma } from '../config/database.js';
import { Prisma, SkillType, CEFRLevel } from '@prisma/client';
import { CreateActivityInput, SubmitActivityInput } from '../validators/activity.validator.js';
import { AppError } from '../middleware/error.middleware.js';

export class ActivityRepository {
  async getLessonActivities(lessonId: string) {
    return prisma.activity.findMany({
      where: { lessonId },
      orderBy: { orderIndex: 'asc' },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async createActivity(lessonId: string, input: CreateActivityInput) {
    return prisma.activity.create({
      data: {
        lessonId,
        title: input.title,
        type: input.type,
        instructions: input.instructions,
        orderIndex: input.orderIndex,
        questions: {
          create: input.questions.map((q) => ({
            prompt: q.prompt,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            audioPromptUrl: q.audioPromptUrl,
            orderIndex: q.orderIndex,
          })),
        },
      },
      include: { questions: true },
    });
  }

  async submitActivityScore(userId: string, activityId: string, input: SubmitActivityInput) {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      throw new AppError('Student profile not found', 404);
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { lesson: true },
    });

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Update or create SkillProgress
      const skill = (input.skillType || activity.lesson.skill || 'GRAMMAR') as SkillType;
      const skillRecord = await tx.skillProgress.upsert({
        where: {
          studentId_skill: {
            studentId: studentProfile.id,
            skill,
          },
        },
        create: {
          studentId: studentProfile.id,
          skill,
          level: studentProfile.currentLevel,
          scorePercentage: new Prisma.Decimal(input.scorePercentage),
        },
        update: {
          level: studentProfile.currentLevel,
          scorePercentage: new Prisma.Decimal(input.scorePercentage),
        },
      });

      // 2. Update lesson progress study time
      await tx.progress.upsert({
        where: {
          studentId_lessonId: {
            studentId: studentProfile.id,
            lessonId: activity.lessonId,
          },
        },
        create: {
          studentId: studentProfile.id,
          lessonId: activity.lessonId,
          isCompleted: false,
          timeSpentSec: input.timeSpentSec,
        },
        update: {
          timeSpentSec: { increment: input.timeSpentSec },
        },
      });

      return {
        success: true,
        skillProgress: skillRecord,
        message: `${skill} mastery updated to ${input.scorePercentage}%!`,
      };
    });
  }
}

export const activityRepository = new ActivityRepository();
