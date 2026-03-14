export type ApplicationStatus =
  | 'WISHLIST'
  | 'APPLIED'
  | 'PHONE_SCREEN'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface User {
  id: string;
  email: string;
  name: string;
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
  token: string;
  user: User;
}
