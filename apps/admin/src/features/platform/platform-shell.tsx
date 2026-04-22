import { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { platformRequestJson } from './platform-api-client';
import type {
  PlatformAutomationRule,
  PlatformAutomationRun,
  PlatformComplianceTask,
  PlatformFinanceAgingBucket,
  PlatformFinanceCollectionItem,
  PlatformFinanceOverview,
  PlatformSession,
  PlatformStoreSummary,
  PlatformStoresResponse,
  PlatformSupportCase,
  PlatformRiskViolation,
} from './platform-types';

type PlatformPage =
  | 'dashboard'
  | 'stores'
  | 'store360'
  | 'plans'
  | 'subscriptions'
  | 'domains'
  | 'onboarding'
  | 'health'
  | 'analytics'
  | 'team'
  | 'settings'
  | 'security'
  | 'automation'
  | 'support'
  | 'risk'
  | 'compliance'
  | 'finance'
  | 'audit';

interface PlatformShellProps {
  session: PlatformSession;
  onSessionUpdate: (session: PlatformSession) => void;
  onSignedOut: () => void;
}

interface RoleSummary {
  id: string;
  name: string;
  code: string;
  description: string | null;
  permissions: string[];
}

interface AdminSummary {
  id: string;
  fullName: string;
  email: string;
  status: 'active' | 'disabled';
  roleCodes: string[];
  lastLoginAt: string | null;
}

interface SettingItem {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updatedAt: string;
}

function hasPermission(session: PlatformSession, permission: string): boolean {
  return session.user.permissions.includes('*') || session.user.permissions.includes(permission);
}

function hasValidStepUpToken(session: PlatformSession): boolean {
  if (!session.stepUpToken || !session.stepUpExpiresAt) return false;
  return new Date(session.stepUpExpiresAt).getTime() > Date.now();
}

function toJsonString(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function PlatformShell({ session, onSessionUpdate, onSignedOut }: PlatformShellProps) {
  const [page, setPage] = useState<PlatformPage>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [stepUpPassword, setStepUpPassword] = useState('');
  const [stepUpOtp, setStepUpOtp] = useState('');

  const [dashboardSummary, setDashboardSummary] = useState<Record<string, unknown> | null>(null);
  const [stores, setStores] = useState<PlatformStoreSummary[]>([]);
  const [plans, setPlans] = useState<Array<{ id: string; code: string; name: string; isActive: boolean }>>([]);
  const [subscriptions, setSubscriptions] = useState<Array<{ id: string; storeName: string; planCode: string; status: string }>>([]);
  const [domains, setDomains] = useState<Array<{ id: string; storeName: string; hostname: string; status: string; sslStatus: string }>>([]);
  const [onboardingPipeline, setOnboardingPipeline] = useState<Array<Record<string, unknown>>>([]);
  const [stuckStores, setStuckStores] = useState<Array<Record<string, unknown>>>([]);
  const [healthSummary, setHealthSummary] = useState<Record<string, unknown> | null>(null);
  const [queues, setQueues] = useState<Array<Record<string, unknown>>>([]);
  const [incidents, setIncidents] = useState<Array<Record<string, unknown>>>([]);
  const [analyticsOverview, setAnalyticsOverview] = useState<Record<string, unknown> | null>(null);
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<Array<Record<string, unknown>>>([]);
  const [store360Id, setStore360Id] = useState('');
  const [store360Data, setStore360Data] = useState<Record<string, unknown> | null>(null);
  const [automationRules, setAutomationRules] = useState<PlatformAutomationRule[]>([]);
  const [automationRuns, setAutomationRuns] = useState<PlatformAutomationRun[]>([]);
  const [supportCases, setSupportCases] = useState<PlatformSupportCase[]>([]);
  const [riskViolations, setRiskViolations] = useState<PlatformRiskViolation[]>([]);
  const [complianceTasks, setComplianceTasks] = useState<PlatformComplianceTask[]>([]);
  const [financeOverview, setFinanceOverview] = useState<PlatformFinanceOverview | null>(null);
  const [financeAging, setFinanceAging] = useState<PlatformFinanceAgingBucket[]>([]);
  const [financeCollections, setFinanceCollections] = useState<PlatformFinanceCollectionItem[]>([]);

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteStoreId, setNoteStoreId] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentSummary, setIncidentSummary] = useState('');
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const [settingKey, setSettingKey] = useState('');
  const [settingValue, setSettingValue] = useState('{}');
  const [automationDialogOpen, setAutomationDialogOpen] = useState(false);
  const [automationName, setAutomationName] = useState('');
  const [automationTrigger, setAutomationTrigger] = useState<'manual' | 'schedule' | 'event'>('manual');
  const [automationActionType, setAutomationActionType] = useState('notify');
  const [automationActionConfig, setAutomationActionConfig] = useState('{}');
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportDescription, setSupportDescription] = useState('');
  const [supportPriority, setSupportPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [riskSummary, setRiskSummary] = useState('');
  const [riskCategory, setRiskCategory] = useState('fraud');
  const [riskSeverity, setRiskSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [riskScore, setRiskScore] = useState('50');
  const [complianceDialogOpen, setComplianceDialogOpen] = useState(false);
  const [compliancePolicyKey, setCompliancePolicyKey] = useState('');
  const [complianceTitle, setComplianceTitle] = useState('');

  const navItems = useMemo(
    () =>
      [
        { key: 'dashboard' as const, label: 'Dashboard', permission: 'platform.dashboard.read' },
        { key: 'stores' as const, label: 'Stores', permission: 'platform.stores.read' },
        { key: 'store360' as const, label: 'Store 360', permission: 'platform.stores.read' },
        { key: 'plans' as const, label: 'Plans', permission: 'platform.plans.read' },
        { key: 'subscriptions' as const, label: 'Subscriptions', permission: 'platform.subscriptions.read' },
        { key: 'domains' as const, label: 'Domains', permission: 'platform.domains.read' },
        { key: 'onboarding' as const, label: 'Onboarding', permission: 'platform.onboarding.read' },
        { key: 'health' as const, label: 'Health', permission: 'platform.health.read' },
        { key: 'analytics' as const, label: 'Analytics', permission: 'platform.analytics.read' },
        { key: 'team' as const, label: 'Team & Roles', permission: 'platform.admins.read' },
        { key: 'settings' as const, label: 'Settings', permission: 'platform.settings.read' },
        { key: 'security' as const, label: 'Security', permission: 'platform.dashboard.read' },
        { key: 'automation' as const, label: 'Automation', permission: 'platform.automation.read' },
        { key: 'support' as const, label: 'Support', permission: 'platform.support.read' },
        { key: 'risk' as const, label: 'Risk', permission: 'platform.risk.read' },
        { key: 'compliance' as const, label: 'Compliance', permission: 'platform.compliance.read' },
        { key: 'finance' as const, label: 'Finance', permission: 'platform.finance.read' },
        { key: 'audit' as const, label: 'Audit Logs', permission: 'platform.audit.read' },
      ].filter((item) => hasPermission(session, item.permission)),
    [session],
  );

  useEffect(() => {
    runPageLoad('dashboard').catch(() => undefined);
  }, []);

  async function requestStepUp(password: string, otpCode: string): Promise<PlatformSession> {
    const payload = await platformRequestJson<{ stepUpToken: string; expiresInSeconds: number }>({
      session,
      path: '/platform/auth/step-up',
      init: {
        method: 'POST',
        body: JSON.stringify({
          password: password.trim(),
          otpCode: otpCode.trim() || undefined,
        }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });

    if (!payload?.stepUpToken || !payload.expiresInSeconds) {
      throw new Error('Failed to issue step-up token');
    }

    const next: PlatformSession = {
      ...session,
      stepUpToken: payload.stepUpToken,
      stepUpExpiresAt: new Date(Date.now() + payload.expiresInSeconds * 1000).toISOString(),
    };
    onSessionUpdate(next);
    return next;
  }

  async function ensureStepUp(): Promise<PlatformSession> {
    if (hasValidStepUpToken(session)) return session;
    setStepUpOpen(true);
    throw new Error('Step-up required');
  }

  async function runPageLoad(nextPage: PlatformPage): Promise<void> {
    setLoading(true);
    setError('');
    setPage(nextPage);
    try {
      if (nextPage === 'dashboard') {
        setDashboardSummary(
          await platformRequestJson({
            session,
            path: '/platform/dashboard/summary',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          }),
        );
      } else if (nextPage === 'stores') {
        const data = await platformRequestJson<PlatformStoresResponse>({
          session,
          path: '/platform/stores?page=1&limit=50',
          onSessionUpdate,
          onSessionExpired: onSignedOut,
        });
        setStores(data?.items ?? []);
      } else if (nextPage === 'store360') {
        const data = await platformRequestJson<PlatformStoresResponse>({
          session,
          path: '/platform/stores?page=1&limit=50',
          onSessionUpdate,
          onSessionExpired: onSignedOut,
        });
        const items = data?.items ?? [];
        setStores(items);
        const id = store360Id || items[0]?.id;
        if (id) {
          setStore360Id(id);
          const payload = await platformRequestJson<Record<string, unknown>>({
            session,
            path: `/platform/stores/${id}/store-360`,
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          });
          setStore360Data(payload ?? null);
        }
      } else if (nextPage === 'plans') {
        setPlans(
          (await platformRequestJson({
            session,
            path: '/platform/plans',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
      } else if (nextPage === 'subscriptions') {
        const data = await platformRequestJson<{ items: Array<{ id: string; storeName: string; planCode: string; status: string }> }>({
          session,
          path: '/platform/subscriptions?page=1&limit=50',
          onSessionUpdate,
          onSessionExpired: onSignedOut,
        });
        setSubscriptions(data?.items ?? []);
      } else if (nextPage === 'domains') {
        setDomains(
          (await platformRequestJson({
            session,
            path: '/platform/domains',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
      } else if (nextPage === 'onboarding') {
        setOnboardingPipeline(
          (await platformRequestJson({
            session,
            path: '/platform/onboarding/pipeline',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
        setStuckStores(
          (await platformRequestJson({
            session,
            path: '/platform/onboarding/stuck-stores',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
      } else if (nextPage === 'health') {
        setHealthSummary(
          await platformRequestJson({
            session,
            path: '/platform/health/summary',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          }),
        );
        setQueues(
          (await platformRequestJson({
            session,
            path: '/platform/health/queues',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
        setIncidents(
          (await platformRequestJson({
            session,
            path: '/platform/health/incidents',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
      } else if (nextPage === 'analytics') {
        setAnalyticsOverview(
          await platformRequestJson({
            session,
            path: '/platform/analytics/overview',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          }),
        );
      } else if (nextPage === 'team') {
        setAdmins(
          (await platformRequestJson({
            session,
            path: '/platform/admins',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
        setRoles(
          (await platformRequestJson({
            session,
            path: '/platform/roles',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
      } else if (nextPage === 'settings') {
        setSettings(
          (await platformRequestJson({
            session,
            path: '/platform/settings',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
      } else if (nextPage === 'automation') {
        setAutomationRules(
          (await platformRequestJson({
            session,
            path: '/platform/automation/rules',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
        setAutomationRuns(
          (await platformRequestJson({
            session,
            path: '/platform/automation/runs?limit=50',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
      } else if (nextPage === 'support') {
        setSupportCases(
          (await platformRequestJson({
            session,
            path: '/platform/support/cases?limit=100',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
      } else if (nextPage === 'risk') {
        setRiskViolations(
          (await platformRequestJson({
            session,
            path: '/platform/risk/violations?limit=100',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
      } else if (nextPage === 'compliance') {
        setComplianceTasks(
          (await platformRequestJson({
            session,
            path: '/platform/compliance/tasks?limit=100',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
      } else if (nextPage === 'finance') {
        setFinanceOverview(
          await platformRequestJson({
            session,
            path: '/platform/finance/overview',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          }),
        );
        setFinanceAging(
          (await platformRequestJson({
            session,
            path: '/platform/finance/aging',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
        setFinanceCollections(
          (await platformRequestJson({
            session,
            path: '/platform/finance/collections?limit=100',
            onSessionUpdate,
            onSessionExpired: onSignedOut,
          })) ?? [],
        );
      } else if (nextPage === 'audit') {
        const data = await platformRequestJson<{ items: Array<Record<string, unknown>> }>({
          session,
          path: '/platform/audit/logs?page=1&limit=50',
          onSessionUpdate,
          onSessionExpired: onSignedOut,
        });
        setAuditLogs(data?.items ?? []);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load page');
    } finally {
      setLoading(false);
    }
  }

  async function logout(): Promise<void> {
    try {
      await platformRequestJson({
        session,
        path: '/platform/auth/logout',
        init: { method: 'POST' },
        onSessionUpdate,
        onSessionExpired: onSignedOut,
      });
    } finally {
      onSignedOut();
    }
  }

  async function submitNote(): Promise<void> {
    if (!noteStoreId || !noteBody.trim()) return;
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: `/platform/stores/${noteStoreId}/notes`,
      init: {
        method: 'POST',
        body: JSON.stringify({ body: noteBody.trim() }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    setNoteDialogOpen(false);
    setNoteBody('');
  }

  async function submitIncident(): Promise<void> {
    if (!incidentTitle.trim()) return;
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: '/platform/health/incidents',
      init: {
        method: 'POST',
        body: JSON.stringify({
          type: 'operational',
          severity: 'medium',
          service: 'platform',
          title: incidentTitle.trim(),
          summary: incidentSummary.trim() || incidentTitle.trim(),
        }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    setIncidentDialogOpen(false);
    setIncidentTitle('');
    setIncidentSummary('');
    await runPageLoad('health');
  }

  async function submitAdmin(): Promise<void> {
    if (!adminFullName.trim() || !adminEmail.trim() || !adminPassword.trim()) return;
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: '/platform/admins',
      init: {
        method: 'POST',
        body: JSON.stringify({
          fullName: adminFullName.trim(),
          email: adminEmail.trim(),
          password: adminPassword.trim(),
          status: 'active',
        }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    setAdminDialogOpen(false);
    setAdminFullName('');
    setAdminEmail('');
    setAdminPassword('');
    await runPageLoad('team');
  }

  async function toggleAdminStatus(admin: AdminSummary): Promise<void> {
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: `/platform/admins/${admin.id}`,
      init: {
        method: 'PATCH',
        body: JSON.stringify({
          status: admin.status === 'active' ? 'disabled' : 'active',
        }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    await runPageLoad('team');
  }

  async function submitRole(): Promise<void> {
    if (!roleName.trim() || !roleCode.trim()) return;
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: '/platform/roles',
      init: {
        method: 'POST',
        body: JSON.stringify({
          name: roleName.trim(),
          code: roleCode.trim(),
          permissionKeys: [],
        }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    setRoleDialogOpen(false);
    setRoleName('');
    setRoleCode('');
    await runPageLoad('team');
  }

  async function submitSettingUpdate(): Promise<void> {
    if (!settingKey.trim() || !settingValue.trim()) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(settingValue) as Record<string, unknown>;
    } catch {
      setError('Invalid JSON value');
      return;
    }
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: '/platform/settings',
      init: {
        method: 'PATCH',
        body: JSON.stringify({
          entries: [{ key: settingKey, value: parsed }],
        }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    setSettingDialogOpen(false);
    await runPageLoad('settings');
  }

  async function submitAutomationRule(): Promise<void> {
    if (!automationName.trim() || !automationActionType.trim()) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(automationActionConfig) as Record<string, unknown>;
    } catch {
      setError('Invalid automation action config JSON');
      return;
    }
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: '/platform/automation/rules',
      init: {
        method: 'POST',
        body: JSON.stringify({
          name: automationName.trim(),
          triggerType: automationTrigger,
          triggerConfig: {},
          actionType: automationActionType.trim(),
          actionConfig: parsed,
        }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    setAutomationDialogOpen(false);
    setAutomationName('');
    setAutomationActionType('notify');
    setAutomationActionConfig('{}');
    await runPageLoad('automation');
  }

  async function toggleAutomationRule(rule: PlatformAutomationRule): Promise<void> {
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: `/platform/automation/rules/${rule.id}/status`,
      init: {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !rule.isActive }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    await runPageLoad('automation');
  }

  async function runAutomationRule(rule: PlatformAutomationRule): Promise<void> {
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: `/platform/automation/rules/${rule.id}/run`,
      init: { method: 'POST', body: JSON.stringify({}) },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    await runPageLoad('automation');
  }

  async function submitSupportCase(): Promise<void> {
    if (!supportSubject.trim() || !supportDescription.trim()) return;
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: '/platform/support/cases',
      init: {
        method: 'POST',
        body: JSON.stringify({
          subject: supportSubject.trim(),
          description: supportDescription.trim(),
          priority: supportPriority,
        }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    setSupportDialogOpen(false);
    setSupportSubject('');
    setSupportDescription('');
    await runPageLoad('support');
  }

  async function submitRiskViolation(): Promise<void> {
    if (!riskSummary.trim() || !riskCategory.trim()) return;
    const score = Number(riskScore);
    if (!Number.isFinite(score)) {
      setError('Risk score must be numeric');
      return;
    }
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: '/platform/risk/violations',
      init: {
        method: 'POST',
        body: JSON.stringify({
          summary: riskSummary.trim(),
          category: riskCategory.trim(),
          severity: riskSeverity,
          score,
        }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    setRiskDialogOpen(false);
    setRiskSummary('');
    await runPageLoad('risk');
  }

  async function submitComplianceTask(): Promise<void> {
    if (!compliancePolicyKey.trim() || !complianceTitle.trim()) return;
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: '/platform/compliance/tasks',
      init: {
        method: 'POST',
        body: JSON.stringify({
          policyKey: compliancePolicyKey.trim(),
          title: complianceTitle.trim(),
          status: 'pending',
          checklist: [],
          evidence: {},
        }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    setComplianceDialogOpen(false);
    setCompliancePolicyKey('');
    setComplianceTitle('');
    await runPageLoad('compliance');
  }

  async function submitStepUpFromDialog(): Promise<void> {
    if (!stepUpPassword.trim()) return;
    const refreshed = await requestStepUp(stepUpPassword, stepUpOtp);
    setStepUpOpen(false);
    setStepUpPassword('');
    setStepUpOtp('');
    onSessionUpdate(refreshed);
  }

  async function setupMfa(): Promise<void> {
    const setup = await platformRequestJson<{ secret: string; otpAuthUrl: string }>({
      session,
      path: '/platform/auth/mfa/setup',
      init: { method: 'POST' },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
    if (!setup?.secret) throw new Error('Failed to start MFA setup');
    setError(`MFA setup URL: ${setup.otpAuthUrl}`);
  }

  async function disableMfa(): Promise<void> {
    const secure = await ensureStepUp();
    await platformRequestJson({
      session: secure,
      path: '/platform/auth/mfa/disable',
      init: {
        method: 'POST',
        body: JSON.stringify({
          password: stepUpPassword.trim() || 'invalid',
        }),
      },
      onSessionUpdate,
      onSessionExpired: onSignedOut,
    });
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', direction: 'rtl' }}>
      <AppBar position="fixed" color="inherit" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack spacing={0}>
            <Typography variant="h6" fontWeight={800}>Kaleem Platform Admin</Typography>
            <Typography variant="caption" color="text.secondary">{session.user.fullName}</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip variant="outlined" label={session.user.roleCodes.join(', ') || 'admin'} />
            <Chip color={hasValidStepUpToken(session) ? 'success' : 'default'} label={hasValidStepUpToken(session) ? 'Step-up Active' : 'Step-up Required'} />
            <Button variant="outlined" onClick={() => setStepUpOpen(true)}>Step-up</Button>
            <Button variant="outlined" onClick={() => logout().catch(() => undefined)}>Logout</Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Drawer anchor="right" variant="permanent" PaperProps={{ sx: { width: 280, borderLeft: '1px solid', borderColor: 'divider' } }}>
        <Toolbar />
        <Divider />
        <List sx={{ py: 1 }}>
          {navItems.map((item) => (
            <ListItemButton key={item.key} selected={page === item.key} onClick={() => runPageLoad(item.key).catch(() => undefined)} sx={{ mx: 1, borderRadius: 2 }}>
              <ListItemText primary={item.label} sx={{ textAlign: 'right' }} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, mr: '280px' }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => runPageLoad(page).catch(() => undefined)} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            {page === 'health' ? <Button variant="outlined" onClick={() => setIncidentDialogOpen(true)}>New Incident</Button> : null}
            {page === 'team' ? <Button variant="outlined" onClick={() => setAdminDialogOpen(true)}>New Admin</Button> : null}
            {page === 'team' ? <Button variant="outlined" onClick={() => setRoleDialogOpen(true)}>New Role</Button> : null}
            {page === 'automation' ? <Button variant="outlined" onClick={() => setAutomationDialogOpen(true)}>New Rule</Button> : null}
            {page === 'support' ? <Button variant="outlined" onClick={() => setSupportDialogOpen(true)}>New Case</Button> : null}
            {page === 'risk' ? <Button variant="outlined" onClick={() => setRiskDialogOpen(true)}>New Violation</Button> : null}
            {page === 'compliance' ? <Button variant="outlined" onClick={() => setComplianceDialogOpen(true)}>New Task</Button> : null}
          </Stack>

          {error ? <Typography color="error">{error}</Typography> : null}

          {page === 'dashboard' ? <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Dashboard Summary</Typography><pre>{toJsonString(dashboardSummary)}</pre></Paper> : null}

          {page === 'stores' ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={800}>Stores</Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Store</TableCell><TableCell>Plan</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {stores.length === 0 ? <TableRow><TableCell colSpan={4}>No stores</TableCell></TableRow> : stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell>{store.name}</TableCell>
                      <TableCell>{store.planCode ?? '-'}</TableCell>
                      <TableCell>{store.subscriptionStatus ?? '-'}</TableCell>
                      <TableCell><Button size="small" onClick={() => { setNoteStoreId(store.id); setNoteDialogOpen(true); }}>Add Note</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          ) : null}

          {page === 'store360' ? (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={800}>Store 360 Selector</Typography>
                <TextField select fullWidth value={store360Id} onChange={(event) => { setStore360Id(event.target.value); runPageLoad('store360').catch(() => undefined); }} label="Store">
                  {stores.map((store) => <MenuItem key={store.id} value={store.id}>{store.name} ({store.slug})</MenuItem>)}
                </TextField>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={800}>Store 360</Typography>
                <pre>{toJsonString(store360Data)}</pre>
              </Paper>
            </Stack>
          ) : null}

          {page === 'plans' ? <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Plans</Typography><pre>{toJsonString(plans)}</pre></Paper> : null}
          {page === 'subscriptions' ? <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Subscriptions</Typography><pre>{toJsonString(subscriptions)}</pre></Paper> : null}
          {page === 'domains' ? <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Domains</Typography><pre>{toJsonString(domains)}</pre></Paper> : null}

          {page === 'onboarding' ? (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Onboarding Pipeline</Typography><pre>{toJsonString(onboardingPipeline)}</pre></Paper>
              <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Stuck Stores</Typography><pre>{toJsonString(stuckStores)}</pre></Paper>
            </Stack>
          ) : null}

          {page === 'health' ? (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Health Summary</Typography><pre>{toJsonString(healthSummary)}</pre></Paper>
              <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Queues</Typography><pre>{toJsonString(queues)}</pre></Paper>
              <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Incidents</Typography><pre>{toJsonString(incidents)}</pre></Paper>
            </Stack>
          ) : null}

          {page === 'analytics' ? <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Advanced Analytics</Typography><pre>{toJsonString(analyticsOverview)}</pre></Paper> : null}

          {page === 'team' ? (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={800}>Admins</Typography>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Status</TableCell><TableCell>Roles</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>{admin.fullName}</TableCell><TableCell>{admin.email}</TableCell><TableCell>{admin.status}</TableCell><TableCell>{admin.roleCodes.join(', ') || '-'}</TableCell>
                        <TableCell><Button size="small" onClick={() => toggleAdminStatus(admin).catch(() => undefined)}>{admin.status === 'active' ? 'Disable' : 'Enable'}</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Roles</Typography><pre>{toJsonString(roles)}</pre></Paper>
            </Stack>
          ) : null}

          {page === 'settings' ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={800}>Settings</Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Key</TableCell><TableCell>Value</TableCell><TableCell>Updated</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {settings.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.key}</TableCell>
                      <TableCell><pre style={{ margin: 0 }}>{toJsonString(item.value)}</pre></TableCell>
                      <TableCell>{item.updatedAt}</TableCell>
                      <TableCell><Button size="small" onClick={() => { setSettingKey(item.key); setSettingValue(JSON.stringify(item.value, null, 2)); setSettingDialogOpen(true); }}>Edit</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          ) : null}

          {page === 'security' ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={800}>Security</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={session.user.mfaEnabled ? 'MFA enabled' : 'MFA disabled'} color={session.user.mfaEnabled ? 'success' : 'default'} />
                <Button variant="outlined" onClick={() => setupMfa().catch(() => undefined)}>Enable MFA</Button>
                <Button variant="outlined" onClick={() => disableMfa().catch(() => undefined)}>Disable MFA</Button>
              </Stack>
            </Paper>
          ) : null}

          {page === 'automation' ? (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={800}>Automation Rules</Typography>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Trigger</TableCell><TableCell>Action</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                  <TableBody>
                    {automationRules.length === 0 ? <TableRow><TableCell colSpan={5}>No rules</TableCell></TableRow> : automationRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>{rule.name}</TableCell><TableCell>{rule.triggerType}</TableCell><TableCell>{rule.actionType}</TableCell><TableCell>{rule.isActive ? 'active' : 'inactive'}</TableCell>
                        <TableCell><Button size="small" onClick={() => toggleAutomationRule(rule).catch(() => undefined)}>{rule.isActive ? 'Disable' : 'Enable'}</Button><Button size="small" onClick={() => runAutomationRule(rule).catch(() => undefined)}>Run</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Automation Runs</Typography><pre>{toJsonString(automationRuns)}</pre></Paper>
            </Stack>
          ) : null}

          {page === 'support' ? <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Support Cases</Typography><pre>{toJsonString(supportCases)}</pre></Paper> : null}
          {page === 'risk' ? <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Risk Violations</Typography><pre>{toJsonString(riskViolations)}</pre></Paper> : null}
          {page === 'compliance' ? <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Compliance Tasks</Typography><pre>{toJsonString(complianceTasks)}</pre></Paper> : null}

          {page === 'finance' ? (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Finance Overview</Typography><pre>{toJsonString(financeOverview)}</pre></Paper>
              <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Aging Buckets</Typography><pre>{toJsonString(financeAging)}</pre></Paper>
              <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Collections</Typography><pre>{toJsonString(financeCollections)}</pre></Paper>
            </Stack>
          ) : null}

          {page === 'audit' ? <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h6" fontWeight={800}>Audit Logs</Typography><pre>{toJsonString(auditLogs)}</pre></Paper> : null}
        </Stack>
      </Box>

      <Dialog open={stepUpOpen} onClose={() => setStepUpOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Step-up Verification</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.2, mt: 0.6 }}>
          <TextField label="Password" type="password" value={stepUpPassword} onChange={(event) => setStepUpPassword(event.target.value)} fullWidth />
          <TextField label="MFA code (optional)" value={stepUpOtp} onChange={(event) => setStepUpOtp(event.target.value)} fullWidth />
        </DialogContent>
        <DialogActions><Button onClick={() => setStepUpOpen(false)}>Cancel</Button><Button onClick={() => submitStepUpFromDialog().catch(() => undefined)} variant="contained">Verify</Button></DialogActions>
      </Dialog>

      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Store Note</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.2, mt: 0.6 }}>
          <TextField label="Note body" multiline minRows={3} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button><Button onClick={() => submitNote().catch(() => undefined)} variant="contained">Save</Button></DialogActions>
      </Dialog>

      <Dialog open={incidentDialogOpen} onClose={() => setIncidentDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Incident</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.2, mt: 0.6 }}>
          <TextField label="Title" value={incidentTitle} onChange={(event) => setIncidentTitle(event.target.value)} />
          <TextField label="Summary" multiline minRows={3} value={incidentSummary} onChange={(event) => setIncidentSummary(event.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setIncidentDialogOpen(false)}>Cancel</Button><Button onClick={() => submitIncident().catch(() => undefined)} variant="contained">Create</Button></DialogActions>
      </Dialog>

      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Admin</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.2, mt: 0.6 }}>
          <TextField label="Full name" value={adminFullName} onChange={(event) => setAdminFullName(event.target.value)} />
          <TextField label="Email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} />
          <TextField label="Password" type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button><Button onClick={() => submitAdmin().catch(() => undefined)} variant="contained">Create</Button></DialogActions>
      </Dialog>

      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Role</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.2, mt: 0.6 }}>
          <TextField label="Name" value={roleName} onChange={(event) => setRoleName(event.target.value)} />
          <TextField label="Code" value={roleCode} onChange={(event) => setRoleCode(event.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button><Button onClick={() => submitRole().catch(() => undefined)} variant="contained">Create</Button></DialogActions>
      </Dialog>

      <Dialog open={settingDialogOpen} onClose={() => setSettingDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Edit Setting: {settingKey}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.2, mt: 0.6 }}>
          <TextField label="JSON value" multiline minRows={10} value={settingValue} onChange={(event) => setSettingValue(event.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setSettingDialogOpen(false)}>Cancel</Button><Button onClick={() => submitSettingUpdate().catch(() => undefined)} variant="contained">Save</Button></DialogActions>
      </Dialog>

      <Dialog open={automationDialogOpen} onClose={() => setAutomationDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Automation Rule</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.2, mt: 0.6 }}>
          <TextField label="Name" value={automationName} onChange={(event) => setAutomationName(event.target.value)} />
          <TextField select label="Trigger" value={automationTrigger} onChange={(event) => setAutomationTrigger(event.target.value as 'manual' | 'schedule' | 'event')}>
            <MenuItem value="manual">manual</MenuItem>
            <MenuItem value="schedule">schedule</MenuItem>
            <MenuItem value="event">event</MenuItem>
          </TextField>
          <TextField label="Action type" value={automationActionType} onChange={(event) => setAutomationActionType(event.target.value)} />
          <TextField label="Action config JSON" multiline minRows={4} value={automationActionConfig} onChange={(event) => setAutomationActionConfig(event.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setAutomationDialogOpen(false)}>Cancel</Button><Button onClick={() => submitAutomationRule().catch(() => undefined)} variant="contained">Create</Button></DialogActions>
      </Dialog>

      <Dialog open={supportDialogOpen} onClose={() => setSupportDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Support Case</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.2, mt: 0.6 }}>
          <TextField label="Subject" value={supportSubject} onChange={(event) => setSupportSubject(event.target.value)} />
          <TextField label="Description" multiline minRows={4} value={supportDescription} onChange={(event) => setSupportDescription(event.target.value)} />
          <TextField select label="Priority" value={supportPriority} onChange={(event) => setSupportPriority(event.target.value as 'low' | 'medium' | 'high' | 'critical')}>
            <MenuItem value="low">low</MenuItem><MenuItem value="medium">medium</MenuItem><MenuItem value="high">high</MenuItem><MenuItem value="critical">critical</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions><Button onClick={() => setSupportDialogOpen(false)}>Cancel</Button><Button onClick={() => submitSupportCase().catch(() => undefined)} variant="contained">Create</Button></DialogActions>
      </Dialog>

      <Dialog open={riskDialogOpen} onClose={() => setRiskDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Risk Violation</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.2, mt: 0.6 }}>
          <TextField label="Summary" value={riskSummary} onChange={(event) => setRiskSummary(event.target.value)} />
          <TextField label="Category" value={riskCategory} onChange={(event) => setRiskCategory(event.target.value)} />
          <TextField select label="Severity" value={riskSeverity} onChange={(event) => setRiskSeverity(event.target.value as 'low' | 'medium' | 'high' | 'critical')}>
            <MenuItem value="low">low</MenuItem><MenuItem value="medium">medium</MenuItem><MenuItem value="high">high</MenuItem><MenuItem value="critical">critical</MenuItem>
          </TextField>
          <TextField label="Score (0-100)" value={riskScore} onChange={(event) => setRiskScore(event.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setRiskDialogOpen(false)}>Cancel</Button><Button onClick={() => submitRiskViolation().catch(() => undefined)} variant="contained">Create</Button></DialogActions>
      </Dialog>

      <Dialog open={complianceDialogOpen} onClose={() => setComplianceDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Compliance Task</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.2, mt: 0.6 }}>
          <TextField label="Policy key" value={compliancePolicyKey} onChange={(event) => setCompliancePolicyKey(event.target.value)} />
          <TextField label="Title" value={complianceTitle} onChange={(event) => setComplianceTitle(event.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setComplianceDialogOpen(false)}>Cancel</Button><Button onClick={() => submitComplianceTask().catch(() => undefined)} variant="contained">Create</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
