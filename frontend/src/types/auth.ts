export type Role = 'SUPERADMIN' | 'TEACHER' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  isVerified: boolean;
  avatarUrl?: string | null;
  phone?: string | null;
  teacherProfile?: {
    id: string;
    isApproved: boolean;
    headline?: string | null;
    bio?: string | null;
    specialties?: string[];
    experienceYears?: number;
    hourlyRate?: number;
  } | null;
  studentProfile?: {
    id: string;
    nativeLanguage?: string | null;
    currentLevel: string;
    targetLevel?: string | null;
    learningGoals?: string[];
  } | null;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}
