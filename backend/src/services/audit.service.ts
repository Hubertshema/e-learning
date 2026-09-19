import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

export class AuditService {
  async log(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: params.metadata || Prisma.JsonNull,
        },
      });
    } catch (error) {
      // Don't throw to avoid failing the main business transaction
      console.error('⚠️ Failed to write audit log:', error);
    }
  }
}

export const auditService = new AuditService();
