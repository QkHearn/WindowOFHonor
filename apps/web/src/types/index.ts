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
  summary: { incentiveCount: number };
  records: { id: string; title: string; issuedAt: string; issuedBy: string }[];
}

export interface IssuedHonorSummary {
  summary: { count: number };
  records: { id: string; title: string; issuedAt: string; recipients: string }[];
}

export interface MeOverview {
  personal: {
    appreciationCount: number;
    activeTasks: number;
    issuedAppreciationCount: number;
    issuedTasks?: number;
  };
  team: {
    department: { id: string; name: string };
    memberCount: number;
    appreciationCount: number;
    activeTasks: number;
    partnerPairs: number;
  } | null;
}

export interface TeamHonorSummary {
  department: { id: string; name: string } | null;
  summary: { count: number };
  records: {
    id: string;
    title: string;
    issuedAt: string;
    issuedBy: string;
    recipients: string;
  }[];
}

export interface TeamTaskList {
  department: { id: string; name: string } | null;
  tasks: TaskOrder[];
}

export interface TeamPartnerPair {
  rank: number;
  userA: { id: string; displayName: string; avatarUrl?: string | null };
  userB: { id: string; displayName: string; avatarUrl?: string | null };
  coCount: number;
  lastCoAt: string;
}

export interface TeamPartnerList {
  department: { id: string; name: string } | null;
  pairs: TeamPartnerPair[];
}

export interface TaskOrder {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  dueAt?: string | null;
  assignedBy?: { id: string; displayName: string };
  assignee?: { id: string; displayName: string };
}

export interface PartnerLeaderboardEntry {
  rank: number;
  userA: { id: string; displayName: string; avatarUrl?: string | null };
  userB: { id: string; displayName: string; avatarUrl?: string | null };
  coCount: number;
  totalHonorValue: number;
  lastCoAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  department?: { id: string; name: string } | null;
  managedDepartments: { id: string; name: string }[];
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
