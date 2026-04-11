import { useState, useEffect } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Divider } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import type { MerchantRequester } from '../merchant-dashboard.types';
import type { Domain } from '../types';

interface DomainsPanelProps {
  request: MerchantRequester;
}

export function DomainsPanel({ request }: DomainsPanelProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [hostname, setHostname] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });

  useEffect(() => {
    loadDomains().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDomains(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<Domain[]>('/domains', { method: 'GET' });
      setDomains(data ?? []);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحميل النطاقات', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function createDomain(): Promise<void> {
    const normalized = hostname.trim().toLowerCase();
    if (!normalized) {
      setMessage({ text: 'اسم النطاق مطلوب', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request('/domains', {
        method: 'POST',
        body: JSON.stringify({ hostname: normalized }),
      });
      setHostname('');
      await loadDomains();
      setMessage({ text: 'تمت إضافة النطاق بنجاح', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر إضافة النطاق', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function verifyDomain(domainId: string): Promise<void> {
    setActionLoading(true);
    await callDomainAction(
      `/domains/${domainId}/verify`,
      'تم التحقق من النطاق بنجاح',
      request,
      setMessage,
      loadDomains,
    );
    setActionLoading(false);
  }

  async function activateDomain(domainId: string): Promise<void> {
    setActionLoading(true);
    await callDomainAction(
      `/domains/${domainId}/activate`,
      'تم تفعيل النطاق وبدء تجهيز شهادة SSL',
      request,
      setMessage,
      loadDomains,
    );
    setActionLoading(false);
  }

  async function syncSsl(domainId: string): Promise<void> {
    setActionLoading(true);
    await callDomainAction(
      `/domains/${domainId}/sync-ssl`,
      'تمت مزامنة حالة SSL من المزود',
      request,
      setMessage,
      loadDomains,
    );
    setActionLoading(false);
  }

  async function deleteDomain(domainId: string): Promise<void> {
    if (!window.confirm('هل أنت متأكد من حذف هذا النطاق نهائياً؟ سيتوقف المتجر عن العمل على هذا النطاق.')) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      await request(`/domains/${domainId}`, { method: 'DELETE' });
      await loadDomains();
      setMessage({ text: 'تم حذف النطاق', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر حذف النطاق', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            النطاقات (الدومين)
          </Typography>
          <Typography color="text.secondary">
            اربط متجرك بنطاق مخصص واعرض هويتك التجارية باحترافية.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => loadDomains().catch(() => undefined)}
          disabled={loading}
        >
          تحديث البيانات
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
      )}

      {/* Add Domain Section */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <LanguageIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>ربط نطاق جديد</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="body2" color="text.secondary" mb={2}>
          أدخل اسم النطاق (مثل: shop.example.com) دون إضافة http://.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <TextField
            size="small"
            fullWidth
            value={hostname}
            onChange={(event) => setHostname(event.target.value)}
            placeholder="shop.example.com"
            dir="ltr"
            sx={{ maxWidth: 400 }}
          />
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => createDomain().catch(() => undefined)}
            disabled={actionLoading || !hostname.trim()}
            disableElevation
            sx={{ minWidth: 120 }}
          >
            إضافة النطاق
          </Button>
        </Stack>
      </Paper>

      {/* Domains Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>اسم النطاق</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>حالة SSL</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>إعدادات DNS المطلوبة</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700 }}>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : domains.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">لا توجد نطاقات مخصصة مرتبطة بهذا المتجر.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                domains.map((domain) => (
                  <TableRow key={domain.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={700} dir="ltr">{domain.hostname}</Typography>
                      {domain.sslProvider && (
                        <Typography variant="caption" color="text.secondary">
                          مزود SSL: {domain.sslProvider}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={domain.status === 'active' ? 'نشط' : domain.status === 'pending' ? 'بانتظار التحقق' : domain.status} 
                        color={domain.status === 'active' ? 'success' : domain.status === 'pending' ? 'warning' : 'default'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        variant="outlined"
                        label={domain.sslStatus} 
                        color={domain.sslStatus === 'issued' ? 'success' : domain.sslStatus === 'requested' || domain.sslStatus === 'pending' ? 'warning' : 'default'}
                      />
                      {domain.sslError && <Typography variant="caption" color="error" display="block">{domain.sslError}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">TXT Record</Typography>
                          <Typography variant="caption" fontFamily="monospace" dir="ltr" display="block">{domain.verificationDnsHost} = {domain.verificationToken}</Typography>
                        </Box>
                        <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">CNAME Record</Typography>
                          <Typography variant="caption" fontFamily="monospace" dir="ltr" display="block">{domain.routingHost ?? domain.hostname} = {domain.routingTarget ?? 'stores.example.com'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="left">
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ maxWidth: 200, justifyContent: 'flex-end' }}>
                        {domain.status !== 'active' && (
                          <Button size="small" variant="outlined" startIcon={<VerifiedUserIcon />} onClick={() => verifyDomain(domain.id).catch(() => undefined)} disabled={actionLoading}>
                            تحقق
                          </Button>
                        )}
                        {domain.status === 'verified' && (
                          <Button size="small" variant="contained" startIcon={<PlayCircleOutlineIcon />} onClick={() => activateDomain(domain.id).catch(() => undefined)} disabled={actionLoading}>
                            تفعيل
                          </Button>
                        )}
                        <Button size="small" variant="outlined" startIcon={<SyncIcon />} onClick={() => syncSsl(domain.id).catch(() => undefined)} disabled={actionLoading}>
                          SSL
                        </Button>
                        <Button size="small" color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => deleteDomain(domain.id).catch(() => undefined)} disabled={actionLoading}>
                          حذف
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
    </Box>
  );
}

async function callDomainAction(
  path: string,
  successMessage: string,
  request: MerchantRequester,
  setMessage: (value: { text: string, type: 'info'|'success'|'error' }) => void,
  loadDomains: () => Promise<void>,
): Promise<void> {
  setMessage({ text: '', type: 'info' });
  try {
    await request(path, { method: 'POST' });
    await loadDomains();
    setMessage({ text: successMessage, type: 'success' });
  } catch (error) {
    setMessage({ text: error instanceof Error ? error.message : 'فشلت عملية النطاق', type: 'error' });
  }
}

function formatSslMode(mode: Domain['sslMode'] | undefined): string {
  if (mode === 'full') {
    return 'كامل';
  }
  return 'كامل (صارم)';
}