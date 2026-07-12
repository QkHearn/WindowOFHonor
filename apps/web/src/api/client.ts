const API_BASE = '/api';

function taskStatusQuery(status?: string) {
  if (!status || status === 'all') return '';
  return `?status=${encodeURIComponent(status)}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ accessToken: string; user: import('../types').User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (data: {
    username: string;
    password: string;
    displayName: string;
    departmentId: string;
  }) =>
    request<{ accessToken: string; user: import('../types').User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listDepartments: () => request<import('../types').Department[]>('/departments'),

  createDepartment: (token: string, name: string) =>
    request<import('../types').Department>('/departments', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }, token),

  deleteDepartment: (token: string, id: string, transferToDepartmentId?: string) => {
    const qs = transferToDepartmentId
      ? '?transferTo=' + encodeURIComponent(transferToDepartmentId)
      : '';
    return request<{ success: boolean; transferredCount?: number }>(
      `/departments/${id}${qs}`,
      { method: 'DELETE' },
      token,
    );
  },

  listAdminUsers: (token: string) =>
    request<import('../types').AdminUser[]>('/admin/users', {}, token),

  promoteToAdmin: (token: string, userId: string, departmentIds: string[]) =>
    request('/admin/users/' + userId + '/promote', {
      method: 'POST',
      body: JSON.stringify({ departmentIds }),
    }, token),

  demoteFromAdmin: (token: string, userId: string) =>
    request('/admin/users/' + userId + '/demote', { method: 'POST' }, token),

  updateAdminDepartments: (token: string, userId: string, departmentIds: string[]) =>
    request('/admin/users/' + userId + '/departments', {
      method: 'PATCH',
      body: JSON.stringify({ departmentIds }),
    }, token),

  transferUsersDepartment: (token: string, userIds: string[], departmentId: string | null) =>
    request<{ success: boolean; count: number }>('/admin/users/department', {
      method: 'PATCH',
      body: JSON.stringify({ userIds, departmentId }),
    }, token),

  me: (token: string) => request<import('../types').User>('/users/me', {}, token),

  searchUsers: (token: string, q: string) =>
    request<import('../types').User[]>('/users/search?q=' + encodeURIComponent(q), {}, token),

  listMembers: (token: string, q?: string) => {
    const qs = q ? '?q=' + encodeURIComponent(q) : '';
    return request<import('../types').TeamMember[]>('/users/members' + qs, {}, token);
  },

  issueIncentive: (
    token: string,
    data: { title: string; description?: string; recipientIds: string[]; honorValue?: number },
  ) =>
    request('/incentives', { method: 'POST', body: JSON.stringify(data) }, token),

  listIncentives: (token: string) =>
    request<import('../types').IncentiveRecord[]>('/incentives', {}, token),

  getBroadcast: () => request<import('../types').BroadcastItem[]>('/broadcast/honors'),

  personalLeaderboard: (scope = 'team', period = 'all', limit = 20) =>
    request<import('../types').LeaderboardPersonalEntry[]>(
      `/leaderboard/personal?scope=${scope}&period=${period}&limit=${limit}`,
    ),

  teamLeaderboard: (period = 'all', limit = 20) =>
    request<import('../types').LeaderboardTeamEntry[]>(
      `/leaderboard/team?period=${period}&limit=${limit}`,
    ),

  partnerLeaderboard: (limit = 20) =>
    request<import('../types').PartnerLeaderboardEntry[]>(
      `/leaderboard/partners?limit=${limit}`,
    ),

  myHonors: (token: string) =>
    request<import('../types').HonorSummary>('/users/me/honors', {}, token),

  myIssuedHonors: (token: string) =>
    request<import('../types').IssuedHonorSummary>('/users/me/honors/issued', {}, token),

  myOverview: (token: string) =>
    request<import('../types').MeOverview>('/users/me/overview', {}, token),

  teamHonors: (token: string) =>
    request<import('../types').TeamHonorSummary>('/users/me/team/honors', {}, token),

  teamTasks: (token: string, status?: string) =>
    request<import('../types').TeamTaskList>(
      `/users/me/team/tasks${taskStatusQuery(status)}`,
      {},
      token,
    ),

  teamPartners: (token: string) =>
    request<import('../types').TeamPartnerList>('/users/me/team/partners', {}, token),

  myPartners: (token: string) =>
    request<import('../types').PartnerEntry[]>('/users/me/partners', {}, token),

  coHonorNetwork: (token: string) =>
    request<import('../types').CoHonorNetwork>('/users/me/co-honor-network', {}, token),

  myTasks: (token: string, status?: string) =>
    request<import('../types').TaskOrder[]>(
      `/users/me/tasks${taskStatusQuery(status)}`,
      {},
      token,
    ),

  listTasks: (token: string, status?: string) =>
    request<import('../types').TaskOrder[]>(
      `/tasks${taskStatusQuery(status)}`,
      {},
      token,
    ),

  myIssuedTasks: (token: string, status?: string) =>
    request<import('../types').TaskOrder[]>(
      `/users/me/tasks/issued${taskStatusQuery(status)}`,
      {},
      token,
    ),

  updateTaskStatus: (token: string, id: string, status: string) =>
    request<import('../types').TaskOrder>(
      `/tasks/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token,
    ),

  createTask: (
    token: string,
    data: { title: string; description?: string; assigneeIds: string[]; dueAt?: string },
  ) =>
    request<{ count: number; tasks: import('../types').TaskOrder[] }>(
      '/tasks',
      { method: 'POST', body: JSON.stringify(data) },
      token,
    ),

  likeUser: (token: string, data: { toUserId: string; targetType: string; targetId?: string }) =>
    request('/likes', { method: 'POST', body: JSON.stringify(data) }, token),
};
