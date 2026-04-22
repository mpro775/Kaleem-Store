export interface PlatformAccessTokenPayload {
  sub: string;
  sid: string;
  email: string;
  fullName: string;
  permissions: string[];
  roleCodes: string[];
  kind: 'platform_admin';
}
