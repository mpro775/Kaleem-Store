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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Grid,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BlockIcon from '@mui/icons-material/Block';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import type { MerchantRequester } from '../merchant-dashboard.types';
import type { UserProfile, StaffInvite, StoreRole } from '../types';

interface StaffPanelProps {
  request: MerchantRequester;
}

export function StaffPanel({ request }: StaffPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<StoreRole>('staff');
  const [invitePermissions, setInvitePermissions] = useState('');

  const [selectedUserId, setSelectedUserId] = useState('');
  const [editRole, setEditRole] = useState<StoreRole>('staff');
  const [editPermissions, setEditPermissions] = useState('');

  useEffect(() => {
    loadAll().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const [usersData, invitesData] = await Promise.all([
        request<UserProfile[]>('/users', { method: 'GET' }),
        request<StaffInvite[]>('/users/invites', { method: 'GET' })
      ]);
      setUsers(usersData ?? []);
      setInvites(invitesData ?? []);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'تعذر تحميل بيانات الفريق', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite(): Promise<void> {
    setMessage({ text: '', type: 'info' });
    if (!inviteEmail || !inviteFullName) {
      setMessage({ text: 'البريد الإلكتروني والاسم الكامل مطلوبان', type: 'error' });
      return;
    }

    setActionLoading(true);
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
        if (result.inviteToken) {
          setMessage({ text: `تم إرسال الدعوة بنجاح. شارك الرابط: ${window.location.origin}/accept-invite?token=${result.inviteToken}`, type: 'success' });
        } else {
          setMessage({ text: `تم إرسال دعوة إلى ${result.email} بنجاح.`, type: 'success' });
        }
      }
      setInviteEmail('');
      setInviteFullName('');
      setInvitePermissions('');
      setShowInviteForm(false);
      await loadAll();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'تعذر إرسال الدعوة', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateRole(): Promise<void> {
    if (!selectedUserId) return;

    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/users/${selectedUserId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: editRole,
          permissions: parsePermissions(editPermissions),
        }),
      });
      await loadAll();
      setMessage({ text: 'تم تحديث صلاحيات المستخدم بنجاح', type: 'success' });
      setSelectedUserId('');
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'تعذر تحديث دور المستخدم', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleUserStatus(userId: string, currentIsActive: boolean): Promise<void> {
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/users/${userId}/${currentIsActive ? 'disable' : 'enable'}`, {
        method: 'PATCH',
      });
      await loadAll();
      setMessage({ text: `تم ${currentIsActive ? 'إيقاف' : 'تفعيل'} المستخدم بنجاح`, type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'تعذر تغيير حالة المستخدم', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  function selectUser(user: UserProfile): void {
    setSelectedUserId(user.id);
    setEditRole(user.role);
    setEditPermissions(user.permissions.join(', '));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            فريق العمل
          </Typography>
          <Typography color="text.secondary">
            قم بإدارة وصول الموظفين وتخصيص الصلاحيات المناسبة لكل دور.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            onClick={() => loadAll().catch(() => undefined)}
            disabled={loading}
          >
            تحديث القائمة
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<PersonAddIcon />} 
            onClick={() => setShowInviteForm(!showInviteForm)}
            size="large"
            sx={{ borderRadius: 2 }}
            disableElevation
          >
            {showInviteForm ? 'إلغاء' : 'دعوة عضو جديد'}
          </Button>
        </Stack>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
      )}

      {/* Invite Form or Edit Form */}
      {(showInviteForm || selectedUserId) && (
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: selectedUserId ? 'secondary.main' : 'primary.main', bgcolor: selectedUserId ? 'secondary.50' : 'primary.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            {selectedUserId ? <AdminPanelSettingsIcon color="secondary" /> : <PersonAddIcon color="primary" />}
            <Typography variant="h6" fontWeight={800} color={selectedUserId ? "secondary.dark" : "primary.dark"}>
              {selectedUserId ? 'تعديل صلاحيات المستخدم' : 'إرسال دعوة انضمام لفريق العمل'}
            </Typography>
          </Box>
          
          <Stack spacing={3}>
            {showInviteForm && !selectedUserId && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <TextField type="email" label="البريد الإلكتروني" fullWidth value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="staff@example.com" sx={{ bgcolor: 'background.paper' }} />
                </Box>
                <Box>
                  <TextField label="الاسم الكامل" fullWidth value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} placeholder="محمد أحمد" sx={{ bgcolor: 'background.paper' }} />
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 3 }}>
              <Box>
                <TextField select label="الدور (Role)" fullWidth value={selectedUserId ? editRole : inviteRole} onChange={(e) => selectedUserId ? setEditRole(e.target.value as StoreRole) : setInviteRole(e.target.value as StoreRole)} sx={{ bgcolor: 'background.paper' }}>
                  <MenuItem value="staff">موظف (Staff)</MenuItem>
                  <MenuItem value="owner">مالك (Owner)</MenuItem>
                </TextField>
              </Box>
              <Box>
                <TextField label="الصلاحيات المخصصة (تفصل بفاصلة)" fullWidth value={selectedUserId ? editPermissions : invitePermissions} onChange={(e) => selectedUserId ? setEditPermissions(e.target.value) : setInvitePermissions(e.target.value)} placeholder="مثال: products:read, orders:write" helperText="اتركها فارغة أو ضع * للوصول الكامل" sx={{ bgcolor: 'background.paper' }} dir="ltr" />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, pt: 1 }}>
              {selectedUserId ? (
                <>
                  <Button variant="contained" color="secondary" onClick={() => updateRole().catch(() => undefined)} disabled={actionLoading} disableElevation sx={{ px: 4 }}>حفظ الصلاحيات</Button>
                  <Button variant="outlined" color="inherit" onClick={() => setSelectedUserId('')}>إلغاء التعديل</Button>
                </>
              ) : (
                <Button variant="contained" color="primary" onClick={() => sendInvite().catch(() => undefined)} disabled={actionLoading} disableElevation sx={{ px: 4 }}>إرسال الدعوة عبر البريد</Button>
              )}
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Users and Invites Lists */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 1fr' }, gap: 3 }}>
        
        {/* Active Staff */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: 'fit-content' }}>
          <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="action" />
            <Typography variant="subtitle1" fontWeight={800}>المستخدمين الحاليين ({users.length})</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>المستخدم</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>الدور والصلاحيات</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700 }}>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><Typography color="text.secondary">لا يوجد مستخدمون.</Typography></TableCell></TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>{user.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={user.role === 'owner' ? 'المالك' : 'موظف'} color={user.role === 'owner' ? 'primary' : 'default'} variant="outlined" sx={{ mb: 0.5 }} />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ maxWidth: 200 }} noWrap>
                          {user.permissions.join(', ') || 'صلاحيات افتراضية'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {user.isActive !== false ? (
                          <Chip size="small" label="مفعل" color="success" />
                        ) : (
                          <Chip size="small" label="موقوف" color="error" />
                        )}
                      </TableCell>
                      <TableCell align="left">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="outlined" startIcon={<AdminPanelSettingsIcon />} onClick={() => selectUser(user)} disabled={actionLoading}>
                            صلاحيات
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color={user.isActive !== false ? 'error' : 'success'} 
                            startIcon={user.isActive !== false ? <BlockIcon /> : <VerifiedUserIcon />} 
                            onClick={() => toggleUserStatus(user.id, user.isActive !== false).catch(() => undefined)} 
                            disabled={actionLoading}
                          >
                            {user.isActive !== false ? 'إيقاف' : 'تفعيل'}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Pending Invites */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: 'fit-content' }}>
          <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="action" />
            <Typography variant="subtitle1" fontWeight={800}>دعوات بانتظار القبول ({invites.length})</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            {invites.length === 0 ? (
              <Typography color="text.secondary" variant="body2" textAlign="center" py={4}>لا توجد دعوات معلقة.</Typography>
            ) : (
              <Stack spacing={2}>
                {invites.map((invite) => (
                  <Box key={invite.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle2" fontWeight={700}>{invite.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>{invite.email}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip size="small" label={invite.role} />
                      <Typography variant="caption" color="error">تنتهي: {new Date(invite.expiresAt).toLocaleDateString('ar-EG')}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Paper>

      </Box>
    </Box>
  );
}

function parsePermissions(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}