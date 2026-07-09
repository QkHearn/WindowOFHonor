export type UserRole = 'super_admin' | 'supervisor' | 'employee';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  honorPoints: number;
  avatarUrl?: string | null;
}

export interface Department {
  id: string;
  name: string;
  memberCount?: number;
}

export interface TeamMember extends User {
  department?: { id: string; name: string };
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface IncentiveRecord {
  id: string;
  title: string;
  description?: string | null;
  honorValue: number;
  issuedAt: string;
  issuedBy?: { displayName: string };
  recipients?: { user: { id: string; displayName: string; avatarUrl?: string | null } }[];
}

export interface LeaderboardPersonalEntry {
  rank: number;
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  honorPoints: number;
  honorValue: number;
  department?: { name: string };
}

export interface LeaderboardTeamEntry {
  rank: number;
  teamId: string;
  teamName: string;
  memberCount: number;
  honorTotal: number;
  avgHonor: number;
}

export interface PartnerEntry {
  partner: { id: string; displayName: string; avatarUrl?: string | null };
  coCount: number;
  totalHonorValue: number;
  lastCoAt: string;
}

export interface CoHonorNetwork {
  nodes: { id: string; label: string; avatarUrl?: string | null; honorPoints?: number; isCenter?: boolean }[];
  edges: { source: string; target: string; weight: number; totalHonorValue: number }[];
  bestPartner: PartnerEntry | null;
}

export interface HonorSummary {
  user: User | null;
  summary: { honorPoints: number; incentiveCount: number };
  records: { id: string; title: string; honorValue: number; issuedAt: string; issuedBy: string }[];
}

export interface TaskOrder {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  dueAt?: string | null;
  assignedBy?: { displayName: string };
  assignee?: { id: string; displayName: string };
}

export interface BroadcastItem {
  id: string;
  title: string;
  description?: string | null;
  honorValue: number;
  issuedAt: string;
  issuedBy: string;
  recipients: { id: string; displayName: string; avatarUrl?: string | null }[];
}
