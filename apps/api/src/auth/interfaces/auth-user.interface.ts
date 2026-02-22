export type StoreRole = 'owner' | 'staff';

export interface AuthUser {
  id: string;
  storeId: string;
  email: string;
  fullName: string;
  role: StoreRole;
  permissions: string[];
  sessionId: string;
}
