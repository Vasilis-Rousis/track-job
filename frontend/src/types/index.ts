export type ApplicationStatus =
  | 'WISHLIST'
  | 'APPLIED'
  | 'PHONE_SCREEN'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export type UserRole = 'USER' | 'ADMIN';
export type UserStatusType = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  status?: UserStatusType;
  createdAt: string;
}

export interface Application {
  id: string;
  userId: string;
  company: string;
  role: string;
  location?: string;
  jobUrl?: string;
  status: ApplicationStatus;
  salary?: string;
  notes?: string;
  appliedAt: string;
  followUpAt?: string;
  createdAt: string;
  updatedAt: string;
  contacts?: Contact[];
  statusHistory?: StatusHistory[];
}

export interface StatusHistory {
  id: string;
  applicationId: string;
  fromStatus?: ApplicationStatus;
  toStatus: ApplicationStatus;
  changedAt: string;
  note?: string;
  application?: Pick<Application, 'company' | 'role'>;
}

export interface Contact {
  id: string;
  userId: string;
  applicationId?: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  application?: { id: string; company: string; role: string } | null;
}

export interface Stats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  responseRate: number;
  offerRate: number;
  recentActivity: (StatusHistory & { application: Pick<Application, 'company' | 'role'> })[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface AuthResponse {
  user: User;
}

export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface ScheduledEmail {
  id: string;
  userId: string;
  applicationId: string;
  contactIds: string[];
  subject: string;
  body: string;
  scheduledFor: string;
  status: EmailStatus;
  sentAt?: string;
  failReason?: string;
  bullJobId?: string;
  createdAt: string;
  application?: Pick<Application, 'company' | 'role'>;
}

export interface GmailStatus {
  connected: boolean;
  email: string | null;
}
