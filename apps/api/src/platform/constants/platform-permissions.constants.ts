export const PLATFORM_PERMISSIONS = {
  dashboardRead: 'platform.dashboard.read',
  storesRead: 'platform.stores.read',
  storesWrite: 'platform.stores.write',
  storesSuspend: 'platform.stores.suspend',
  storesResume: 'platform.stores.resume',
  plansRead: 'platform.plans.read',
  plansWrite: 'platform.plans.write',
  subscriptionsRead: 'platform.subscriptions.read',
  subscriptionsWrite: 'platform.subscriptions.write',
  domainsRead: 'platform.domains.read',
  domainsWrite: 'platform.domains.write',
  auditRead: 'platform.audit.read',
  onboardingRead: 'platform.onboarding.read',
  onboardingWrite: 'platform.onboarding.write',
  adminsRead: 'platform.admins.read',
  adminsWrite: 'platform.admins.write',
  rolesRead: 'platform.roles.read',
  rolesWrite: 'platform.roles.write',
  settingsRead: 'platform.settings.read',
  settingsWrite: 'platform.settings.write',
} as const;

export const PLATFORM_PERMISSION_LIST = Object.values(PLATFORM_PERMISSIONS);

export type PlatformPermission = (typeof PLATFORM_PERMISSION_LIST)[number];
