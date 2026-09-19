import { prisma } from '../config/database.js';
import crypto from 'crypto';

export class TokenRepository {
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createRefreshToken(userId: string, token: string, expiresAt: DateTimeOrString): Promise<void> {
    const tokenHash = this.hashToken(token);
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(expiresAt),
      },
    });
  }

  async findRefreshToken(token: string) {
    const tokenHash = this.hashToken(token);
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            teacherProfile: true,
            studentProfile: true,
          },
        },
      },
    });
  }

  async revokeToken(token: string, replacedByToken?: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: {
        revoked: true,
        ...(replacedByToken && { replacedByToken: this.hashToken(replacedByToken) }),
      },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }
}

type DateTimeOrString = Date | string;

export const tokenRepository = new TokenRepository();
