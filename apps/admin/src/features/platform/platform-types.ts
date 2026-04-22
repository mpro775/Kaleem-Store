export interface PlatformSessionUser {
  id: string;
  email: string;
  fullName: string;
  status: 'active' | 'disabled';
  permissions: string[];
  roleCodes: string[];
  sessionId: string;
}

export interface PlatformSession {
  apiBaseUrl: string;
  accessToken: string;
  refreshToken: string;
  user: PlatformSessionUser;
}

export interface PlatformAuthResult {
  accessToken: string;
  refreshToken: string;
  user: PlatformSessionUser;
}

export interface PlatformStoreSummary {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  isSuspended: boolean;
  suspensionReason: string | null;
  planCode: string | null;
  subscriptionStatus: string | null;
  totalDomains: number;
  activeDomains: number;
}

export interface PlatformStoresResponse {
  items: PlatformStoreSummary[];
  total: number;
  page: number;
  limit: number;
}
