import { prisma } from '../config/database.js';
import { AIGenerationType } from '../types/ai.types.js';

export class AIRepository {
  /**
   * Create an AI generation record
   */
  public static async createGeneration(data: {
    teacherId: string;
    type: AIGenerationType;
    title: string;
    prompt: string;
    inputContext?: any;
    output: any;
    status?: string;
    model?: string;
    tokensUsed?: number;
    courseId?: string;
    unitId?: string;
    lessonId?: string;
  }) {
    try {
      return await (prisma as any).aIGeneration.create({
        data: {
          teacherId: data.teacherId,
          type: data.type,
          title: data.title,
          prompt: data.prompt,
          inputContext: data.inputContext ?? null,
          output: data.output,
          status: data.status || 'COMPLETED',
          model: data.model || 'fluentedge-curriculum-engine',
          tokensUsed: data.tokensUsed || 0,
          courseId: data.courseId,
          unitId: data.unitId,
          lessonId: data.lessonId,
        },
      });
    } catch (err) {
      console.warn('Could not persist AI generation record to DB:', err);
      return {
        id: `mock-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Get paginated generations for a teacher
   */
  public static async getTeacherGenerations(params: {
    teacherId: string;
    type?: AIGenerationType;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 15;
    const skip = (page - 1) * limit;

    const where: any = {
      teacherId: params.teacherId,
      ...(params.type && { type: params.type }),
      ...(params.status && { status: params.status }),
      ...(params.search && {
        title: { contains: params.search, mode: 'insensitive' },
      }),
    };

    try {
      const [items, total] = await Promise.all([
        (prisma as any).aIGeneration.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        (prisma as any).aIGeneration.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        limit,
      };
    } catch (err) {
      console.warn('Failed to query ai_generations:', err);
      return {
        items: [],
        total: 0,
        page,
        totalPages: 1,
        limit,
      };
    }
  }

  /**
   * Get single generation by ID (with teacher ownership check)
   */
  public static async getGenerationById(id: string, teacherId: string) {
    try {
      return await (prisma as any).aIGeneration.findFirst({
        where: {
          id,
          teacherId,
        },
      });
    } catch (err) {
      console.warn('Failed to get ai_generation by id:', err);
      return null;
    }
  }

  /**
   * Update generation status or output
   */
  public static async updateGeneration(
    id: string,
    teacherId: string,
    data: {
      title?: string;
      status?: string;
      output?: any;
    }
  ) {
    try {
      return await (prisma as any).aIGeneration.updateMany({
        where: {
          id,
          teacherId,
        },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.status && { status: data.status }),
          ...(data.output && { output: data.output }),
        },
      });
    } catch (err) {
      console.warn('Failed to update ai_generation:', err);
      return { count: 0 };
    }
  }

  /**
   * Delete generation record
   */
  public static async deleteGeneration(id: string, teacherId: string) {
    try {
      return await (prisma as any).aIGeneration.deleteMany({
        where: {
          id,
          teacherId,
        },
      });
    } catch (err) {
      console.warn('Failed to delete ai_generation:', err);
      return { count: 0 };
    }
  }

  /**
   * Get count of generations made today and this month for usage limits
   */
  public static async getTeacherUsageStats(teacherId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      const [dailyCount, monthlyCount, totalCount] = await Promise.all([
        (prisma as any).aIGeneration.count({
          where: {
            teacherId,
            createdAt: { gte: startOfToday },
          },
        }),
        (prisma as any).aIGeneration.count({
          where: {
            teacherId,
            createdAt: { gte: startOfMonth },
          },
        }),
        (prisma as any).aIGeneration.count({
          where: { teacherId },
        }),
      ]);

      return {
        dailyCount,
        monthlyCount,
        totalCount,
      };
    } catch (err) {
      console.warn('Failed to get AI usage stats:', err);
      return {
        dailyCount: 0,
        monthlyCount: 0,
        totalCount: 0,
      };
    }
  }

  /**
   * Find teacher profile by user ID
   */
  public static async getTeacherProfileByUserId(userId: string) {
    try {
      return await prisma.teacherProfile.findUnique({
        where: { userId },
      });
    } catch (err) {
      console.warn('Failed to get teacher profile by user ID:', err);
      return null;
    }
  }
}
