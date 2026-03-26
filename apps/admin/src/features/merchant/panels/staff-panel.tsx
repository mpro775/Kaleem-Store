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
      setMessage({ text: err instanceof Error ? err.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظپط±ظٹظ‚', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite(): Promise<void> {
    setMessage({ text: '', type: 'info' });
    if (!inviteEmail || !inviteFullName) {
      setMessage({ text: 'ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظˆط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„ ظ…ط·ظ„ظˆط¨ط§ظ†', type: 'error' });
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
          setMessage({ text: `طھظ… ط¥ط±ط³ط§ظ„ ط§ظ„ط¯ط¹ظˆط© ط¨ظ†ط¬ط§ط­. ط´ط§ط±ظƒ ط§ظ„ط±ط§ط¨ط·: ${window.location.origin}/accept-invite?token=${result.inviteToken}`, type: 'success' });
        } else {
          setMessage({ text: `طھظ… ط¥ط±ط³ط§ظ„ ط¯ط¹ظˆط© ط¥ظ„ظ‰ ${result.email} ط¨ظ†ط¬ط§ط­.`, type: 'success' });
        }
      }
      setInviteEmail('');
      setInviteFullName('');
      setInvitePermissions('');
      setShowInviteForm(false);
      await loadAll();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'طھط¹ط°ط± ط¥ط±ط³ط§ظ„ ط§ظ„ط¯ط¹ظˆط©', type: 'error' });
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
      setMessage({ text: 'طھظ… طھط­ط¯ظٹط« طµظ„ط§ط­ظٹط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ… ط¨ظ†ط¬ط§ط­', type: 'success' });
      setSelectedUserId('');
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'طھط¹ط°ط± طھط­ط¯ظٹط« ط¯ظˆط± ط§ظ„ظ…ط³طھط®ط¯ظ…', type: 'error' });
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
      setMessage({ text: `طھظ… ${currentIsActive ? 'ط¥ظٹظ‚ط§ظپ' : 'طھظپط¹ظٹظ„'} ط§ظ„ظ…ط³طھط®ط¯ظ… ط¨ظ†ط¬ط§ط­`, type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'طھط¹ط°ط± طھط؛ظٹظٹط± ط­ط§ظ„ط© ط§ظ„ظ…ط³طھط®ط¯ظ…', type: 'error' });
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
            ظپط±ظٹظ‚ ط§ظ„ط¹ظ…ظ„
          </Typography>
          <Typography color="text.secondary">
            ظ‚ظ… ط¨ط¥ط¯ط§ط±ط© ظˆطµظˆظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ† ظˆطھط®طµظٹطµ ط§ظ„طµظ„ط§ط­ظٹط§طھ ط§ظ„ظ…ظ†ط§ط³ط¨ط© ظ„ظƒظ„ ط¯ظˆط±.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            onClick={() => loadAll().catch(() => undefined)}
            disabled={loading}
          >
            طھط­ط¯ظٹط« ط§ظ„ظ‚ط§ط¦ظ…ط©
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
            {showInviteForm ? 'ط¥ظ„ط؛ط§ط،' : 'ط¯ط¹ظˆط© ط¹ط¶ظˆ ط¬ط¯ظٹط¯'}
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
              {selectedUserId ? 'طھط¹ط¯ظٹظ„ طµظ„ط§ط­ظٹط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…' : 'ط¥ط±ط³ط§ظ„ ط¯ط¹ظˆط© ط§ظ†ط¶ظ…ط§ظ… ظ„ظپط±ظٹظ‚ ط§ظ„ط¹ظ…ظ„'}
            </Typography>
          </Box>
          
          <Stack spacing={3}>
            {showInviteForm && !selectedUserId && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <TextField type="email" label="ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ" fullWidth value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="staff@example.com" sx={{ bgcolor: 'background.paper' }} />
                </Box>
                <Box>
                  <TextField label="ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„" fullWidth value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} placeholder="ظ…ط­ظ…ط¯ ط£ط­ظ…ط¯" sx={{ bgcolor: 'background.paper' }} />
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 3 }}>
              <Box>
                <TextField select label="ط§ظ„ط¯ظˆط± (Role)" fullWidth value={selectedUserId ? editRole : inviteRole} onChange={(e) => selectedUserId ? setEditRole(e.target.value as StoreRole) : setInviteRole(e.target.value as StoreRole)} sx={{ bgcolor: 'background.paper' }}>
                  <MenuItem value="staff">ظ…ظˆط¸ظپ (Staff)</MenuItem>
                  <MenuItem value="owner">ظ…ط§ظ„ظƒ (Owner)</MenuItem>
                </TextField>
              </Box>
              <Box>
                <TextField label="ط§ظ„طµظ„ط§ط­ظٹط§طھ ط§ظ„ظ…ط®طµطµط© (طھظپطµظ„ ط¨ظپط§طµظ„ط©)" fullWidth value={selectedUserId ? editPermissions : invitePermissions} onChange={(e) => selectedUserId ? setEditPermissions(e.target.value) : setInvitePermissions(e.target.value)} placeholder="ظ…ط«ط§ظ„: products:read, orders:write" helperText="ط§طھط±ظƒظ‡ط§ ظپط§ط±ط؛ط© ط£ظˆ ط¶ط¹ * ظ„ظ„ظˆطµظˆظ„ ط§ظ„ظƒط§ظ…ظ„" sx={{ bgcolor: 'background.paper' }} dir="ltr" />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, pt: 1 }}>
              {selectedUserId ? (
                <>
                  <Button variant="contained" color="secondary" onClick={() => updateRole().catch(() => undefined)} disabled={actionLoading} disableElevation sx={{ px: 4 }}>ط­ظپط¸ ط§ظ„طµظ„ط§ط­ظٹط§طھ</Button>
                  <Button variant="outlined" color="inherit" onClick={() => setSelectedUserId('')}>ط¥ظ„ط؛ط§ط، ط§ظ„طھط¹ط¯ظٹظ„</Button>
                </>
              ) : (
                <Button variant="contained" color="primary" onClick={() => sendInvite().catch(() => undefined)} disabled={actionLoading} disableElevation sx={{ px: 4 }}>ط¥ط±ط³ط§ظ„ ط§ظ„ط¯ط¹ظˆط© ط¹ط¨ط± ط§ظ„ط¨ط±ظٹط¯</Button>
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
            <Typography variant="subtitle1" fontWeight={800}>ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ط§ظ„ط­ط§ظ„ظٹظٹظ† ({users.length})</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ظ…ط³طھط®ط¯ظ…</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ط¯ظˆط± ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ط§ظ„ط­ط§ظ„ط©</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 700 }}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><Typography color="text.secondary">ظ„ط§ ظٹظˆط¬ط¯ ظ…ط³طھط®ط¯ظ…ظˆظ†.</Typography></TableCell></TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>{user.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">{user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={user.role === 'owner' ? 'ط§ظ„ظ…ط§ظ„ظƒ' : 'ظ…ظˆط¸ظپ'} color={user.role === 'owner' ? 'primary' : 'default'} variant="outlined" sx={{ mb: 0.5 }} />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ maxWidth: 200 }} noWrap>
                          {user.permissions.join(', ') || 'طµظ„ط§ط­ظٹط§طھ ط§ظپطھط±ط§ط¶ظٹط©'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {user.isActive !== false ? (
                          <Chip size="small" label="ظ…ظپط¹ظ„" color="success" />
                        ) : (
                          <Chip size="small" label="ظ…ظˆظ‚ظˆظپ" color="error" />
                        )}
                      </TableCell>
                      <TableCell align="left">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="outlined" startIcon={<AdminPanelSettingsIcon />} onClick={() => selectUser(user)} disabled={actionLoading}>
                            طµظ„ط§ط­ظٹط§طھ
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color={user.isActive !== false ? 'error' : 'success'} 
                            startIcon={user.isActive !== false ? <BlockIcon /> : <VerifiedUserIcon />} 
                            onClick={() => toggleUserStatus(user.id, user.isActive !== false).catch(() => undefined)} 
                            disabled={actionLoading}
                          >
                            {user.isActive !== false ? 'ط¥ظٹظ‚ط§ظپ' : 'طھظپط¹ظٹظ„'}
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
            <Typography variant="subtitle1" fontWeight={800}>ط¯ط¹ظˆط§طھ ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ظ‚ط¨ظˆظ„ ({invites.length})</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            {invites.length === 0 ? (
              <Typography color="text.secondary" variant="body2" textAlign="center" py={4}>ظ„ط§ طھظˆط¬ط¯ ط¯ط¹ظˆط§طھ ظ…ط¹ظ„ظ‚ط©.</Typography>
            ) : (
              <Stack spacing={2}>
                {invites.map((invite) => (
                  <Box key={invite.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle2" fontWeight={700}>{invite.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>{invite.email}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip size="small" label={invite.role} />
                      <Typography variant="caption" color="error">طھظ†طھظ‡ظٹ: {new Date(invite.expiresAt).toLocaleDateString('ar-EG')}</Typography>
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