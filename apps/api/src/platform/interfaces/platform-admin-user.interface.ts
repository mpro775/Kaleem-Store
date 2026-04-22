export interface PlatformAdminUser {
  id: string;
  email: string;
  fullName: string;
  status: 'active' | 'disabled';
  permissions: string[];
  roleCodes: string[];
  sessionId: string;
}
