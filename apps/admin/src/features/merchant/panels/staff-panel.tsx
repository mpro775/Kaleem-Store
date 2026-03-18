import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard';
import type { UserProfile, StaffInvite, StoreRole } from '../types';

interface StaffPanelProps {
  request: MerchantRequester;
}

export function StaffPanel({ request }: StaffPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<StoreRole>('staff');
  const [invitePermissions, setInvitePermissions] = useState('');

  const [selectedUserId, setSelectedUserId] = useState('');
  const [editRole, setEditRole] = useState<StoreRole>('staff');
  const [editPermissions, setEditPermissions] = useState('');

  useEffect(() => {
    loadUsers().catch(() => undefined);
    loadInvites().catch(() => undefined);
  }, []);

  async function loadUsers(): Promise<void> {
    setError('');
    try {
      const data = await request<UserProfile[]>('/users', { method: 'GET' });
      setUsers(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل المستخدمين');
    }
  }

  async function loadInvites(): Promise<void> {
    setError('');
    try {
      const data = await request<StaffInvite[]>('/users/invites', { method: 'GET' });
      setInvites(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الدعوات');
    }
  }

  async function sendInvite(): Promise<void> {
    setError('');
    setMessage('');
    if (!inviteEmail || !inviteFullName) {
      setError('البريد الإلكتروني والاسم الكامل مطلوبان');
      return;
    }

    try {
      const result = await request<StaffInvite>('/users/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          fullName: inviteFullName,
          role: inviteRole,
          permissions: parsePermissions(invitePermissions),
        }),
      });
      if (result) {
        setMessage(`تم إرسال دعوة إلى ${result.email}`);
        if (result.inviteToken) {
          setMessage(
            `تم إرسال الدعوة. شارك هذا الرابط: ${window.location.origin}/accept-invite?token=${result.inviteToken}`,
          );
        }
      }
      setInviteEmail('');
      setInviteFullName('');
      setInvitePermissions('');
      setShowInviteForm(false);
      await loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إرسال الدعوة');
    }
  }

  async function updateRole(): Promise<void> {
    if (!selectedUserId) {
      setError('اختر مستخدماً أولاً');
      return;
    }

    setError('');
    setMessage('');
    try {
      await request(`/users/${selectedUserId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: editRole,
          permissions: parsePermissions(editPermissions),
        }),
      });
      await loadUsers();
      setMessage('تم تحديث دور المستخدم');
      setSelectedUserId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث دور المستخدم');
    }
  }

  async function disableUser(userId: string): Promise<void> {
    setError('');
    setMessage('');
    try {
      await request(`/users/${userId}/disable`, {
        method: 'PATCH',
      });
      await loadUsers();
      setMessage('تم تعطيل المستخدم');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تعطيل المستخدم');
    }
  }

  async function enableUser(userId: string): Promise<void> {
    setError('');
    setMessage('');
    try {
      await request(`/users/${userId}/enable`, {
        method: 'PATCH',
      });
      await loadUsers();
      setMessage('تم تفعيل المستخدم');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تفعيل المستخدم');
    }
  }

  function selectUser(user: UserProfile): void {
    setSelectedUserId(user.id);
    setEditRole(user.role);
    setEditPermissions(user.permissions.join(', '));
  }

  return (
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">دعوة عضو فريق</Typography>
        <Button variant="outlined" onClick={() => setShowInviteForm(!showInviteForm)}>
            {showInviteForm ? 'إلغاء' : 'دعوة جديدة'}
        </Button>

        {showInviteForm && (
          <Box sx={{ display: 'grid', gap: 1 }}>
            <TextField type="email" label="البريد الإلكتروني" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="staff@example.com" />
            <TextField label="الاسم الكامل" value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} placeholder="محمد أحمد" />
            <TextField select label="الدور" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as StoreRole)}>
              <MenuItem value="staff">موظف</MenuItem>
              <MenuItem value="owner">مالك</MenuItem>
            </TextField>
            <TextField label="الصلاحيات (تفصل بفاصلة)" value={invitePermissions} onChange={(e) => setInvitePermissions(e.target.value)} placeholder="products:read, products:write" />
            <Button variant="contained" onClick={() => sendInvite().catch(() => undefined)}>
              إرسال الدعوة
            </Button>
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
        <Typography variant="h6">الدعوات المعلقة</Typography>
        <Box sx={{ mt: 1, display: 'grid', gap: 0.8 }}>
          {invites.map((invite) => (
            <Paper key={invite.id} variant="outlined" sx={{ p: 1 }}>
              <Typography variant="subtitle1">{invite.fullName}</Typography>
              <Typography variant="body2">{invite.email}</Typography>
              <Typography variant="body2">
                {invite.role} | تنتهي: {new Date(invite.expiresAt).toLocaleDateString()}
              </Typography>
            </Paper>
          ))}
          {invites.length === 0 ? <Typography color="text.secondary">لا توجد دعوات معلقة.</Typography> : null}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">تعديل المستخدم</Typography>
        {selectedUserId ? (
          <>
            <TextField select label="الدور" value={editRole} onChange={(e) => setEditRole(e.target.value as StoreRole)}>
              <MenuItem value="owner">مالك</MenuItem>
              <MenuItem value="staff">موظف</MenuItem>
            </TextField>

            <TextField label="الصلاحيات (تفصل بفاصلة)" value={editPermissions} onChange={(e) => setEditPermissions(e.target.value)} placeholder="products:read, products:write" />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="contained" onClick={() => updateRole().catch(() => undefined)}>
                تحديث الدور
              </Button>
              <Button variant="outlined" onClick={() => setSelectedUserId('')}>إلغاء</Button>
            </Stack>
          </>
        ) : (
          <Typography color="text.secondary">اختر مستخدماً من القائمة للتعديل.</Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
        <Typography variant="h6">قائمة الفريق</Typography>
        <Button variant="outlined" onClick={() => loadUsers().catch(() => undefined)}>تحديث</Button>

        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Box sx={{ display: 'grid', gap: 0.8 }}>
          {users.map((user) => (
            <Paper key={user.id} variant="outlined" sx={{ p: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">{user.fullName}</Typography>
                {user.isActive === false && <Chip label="معطل" size="small" color="default" />}
              </Stack>
              <Typography variant="body2">{user.email}</Typography>
              <Typography variant="body2">
                {user.role} / {user.permissions.join(', ') || 'بدون صلاحيات'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 0.7 }}>
                <Button variant="outlined" onClick={() => selectUser(user)}>تعديل</Button>
                {user.isActive !== false ? (
                  <Button color="error" variant="outlined" onClick={() => disableUser(user.id).catch(() => undefined)}>
                    تعطيل
                  </Button>
                ) : (
                  <Button variant="outlined" onClick={() => enableUser(user.id).catch(() => undefined)}>تفعيل</Button>
                )}
              </Stack>
            </Paper>
          ))}
          {users.length === 0 ? <Typography color="text.secondary">لا يوجد مستخدمون.</Typography> : null}
        </Box>
      </Paper>
    </Box>
  );
}

function parsePermissions(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
