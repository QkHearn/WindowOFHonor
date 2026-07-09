const base = process.env.API_BASE_URL ?? 'http://localhost:3000';

export class HonorApiClient {
  constructor(
    private readonly serviceToken: string,
    private readonly userId?: string,
  ) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Service-Token': this.serviceToken,
    };
    if (this.userId) h['X-User-Id'] = this.userId;
    return h;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${base}/api${path}`, {
      ...init,
      headers: { ...this.headers(), ...init?.headers },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${path} failed: ${res.status} ${text}`);
    }
    return res.json() as Promise<T>;
  }

  getBroadcast() {
    return this.request('/broadcast/honors');
  }

  getPersonalLeaderboard(scope = 'team', period = 'all', limit = 10) {
    return this.request(`/leaderboard/personal?scope=${scope}&period=${period}&limit=${limit}`);
  }

  getTeamLeaderboard(period = 'all', limit = 10) {
    return this.request(`/leaderboard/team?period=${period}&limit=${limit}`);
  }

  getUserHonors(userId: string) {
    return this.request(`/users/${userId}/honors`);
  }

  getPartners(userId: string) {
    return this.request(`/users/${userId}/partners`);
  }

  getCoHonorNetwork(userId: string) {
    return this.request(`/users/me/co-honor-network`, {
      headers: { 'X-User-Id': userId },
    });
  }

  getTasks(userId: string) {
    return this.request(`/users/me/tasks`, {
      headers: { 'X-User-Id': userId },
    });
  }

  searchUsers(q: string) {
    return this.request(`/users/search?q=${encodeURIComponent(q)}`);
  }

  issueIncentive(data: {
    title: string;
    description?: string;
    recipientIds: string[];
    honorValue?: number;
  }) {
    return this.request('/incentives', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  likeUser(data: { toUserId: string; targetType: string; targetId?: string }, fromUserId: string) {
    return this.request('/likes', {
      method: 'POST',
      headers: { 'X-User-Id': fromUserId },
      body: JSON.stringify(data),
    });
  }

  queryAllHonors(limit?: number) {
    const qs = limit ? `?limit=${limit}` : '';
    return this.request(`/queries/honors${qs}`);
  }

  queryAllTasks(limit?: number) {
    const qs = limit ? `?limit=${limit}` : '';
    return this.request(`/queries/tasks${qs}`);
  }

  queryLatestHonor() {
    return this.request('/queries/honors/latest');
  }

  queryLatestTask() {
    return this.request('/queries/tasks/latest');
  }

  queryToday() {
    return this.request('/queries/today');
  }
}
