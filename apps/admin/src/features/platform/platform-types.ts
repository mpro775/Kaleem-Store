export interface PlatformSessionUser {
  id: string;
  email: string;
  fullName: string;
  status: 'active' | 'disabled';
  mfaEnabled: boolean;
  permissions: string[];
  roleCodes: string[];
  sessionId: string;
}

export interface PlatformSession {
  apiBaseUrl: string;
  accessToken: string;
  refreshToken: string;
  user: PlatformSessionUser;
  stepUpToken?: string;
  stepUpExpiresAt?: string;
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

export interface PlatformAutomationRule {
  id: string;
  name: string;
  description: string | null;
  triggerType: 'manual' | 'schedule' | 'event';
  triggerConfig: Record<string, unknown>;
  actionType: string;
  actionConfig: Record<string, unknown>;
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAutomationRun {
  id: string;
  ruleId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  storeId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  logs: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformSupportCase {
  id: string;
  storeId: string | null;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
  queue: string;
  assigneeAdminId: string | null;
  assigneeName: string | null;
  impactScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformRiskViolation {
  id: string;
  storeId: string | null;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  status: 'open' | 'investigating' | 'mitigated' | 'accepted' | 'resolved';
  summary: string;
  details: Record<string, unknown>;
  detectedAt: string;
  updatedAt: string;
}

export interface PlatformComplianceTask {
  id: string;
  violationId: string | null;
  policyKey: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
  assigneeAdminId: string | null;
  assigneeName: string | null;
  checklist: Array<Record<string, unknown>>;
  evidence: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformFinanceOverview {
  totalMrr: number;
  openInvoicesAmount: number;
  failedInvoicesAmount: number;
  overdueInvoicesCount: number;
  activePaidSubscriptions: number;
}

export interface PlatformFinanceAgingBucket {
  bucket: 'current' | '1_30' | '31_60' | '61_90' | '90_plus';
  invoices: number;
  amount: number;
}

export interface PlatformFinanceCollectionItem {
  invoiceId: string;
  invoiceNumber: string;
  storeId: string;
  storeName: string;
  status: 'open' | 'failed';
  dueAt: string | null;
  totalAmount: number;
  currencyCode: string;
  updatedAt: string;
}
