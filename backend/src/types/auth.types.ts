export type RoleType = 'SUPERADMIN' | 'TEACHER' | 'STUDENT';
export type UserStatusType = 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';

export interface JwtPayload {
  userId: string;
  email: string;
  role: RoleType;
  status: UserStatusType;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleType;
  status: UserStatusType;
  isVerified: boolean;
  avatarUrl?: string | null;
  teacherProfile?: {
    id: string;
    isApproved: boolean;
    headline?: string | null;
  } | null;
  studentProfile?: {
    id: string;
    currentLevel: string;
  } | null;
}
