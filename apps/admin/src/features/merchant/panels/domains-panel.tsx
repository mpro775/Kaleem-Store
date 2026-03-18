import { useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard';
import type { Domain } from '../types';

interface DomainsPanelProps {
  request: MerchantRequester;
}

export function DomainsPanel({ request }: DomainsPanelProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [hostname, setHostname] = useState('');
  const [message, setMessage] = useState('');

  async function loadDomains(): Promise<void> {
    setMessage('');
    try {
      const data = await request<Domain[]>('/domains', { method: 'GET' });
      setDomains(data ?? []);
      setMessage('تم تحميل النطاقات');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل النطاقات');
    }
  }

  async function createDomain(): Promise<void> {
    const normalized = hostname.trim().toLowerCase();
    if (!normalized) {
      setMessage('اسم النطاق مطلوب');
      return;
    }

    setMessage('');
    try {
      await request('/domains', {
        method: 'POST',
        body: JSON.stringify({ hostname: normalized }),
      });
      setHostname('');
      await loadDomains();
      setMessage('تمت إضافة النطاق');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر إضافة النطاق');
    }
  }

  async function verifyDomain(domainId: string): Promise<void> {
    await callDomainAction(
      `/domains/${domainId}/verify`,
      'تم التحقق من النطاق',
      request,
      setMessage,
      loadDomains,
    );
  }

  async function activateDomain(domainId: string): Promise<void> {
    await callDomainAction(
      `/domains/${domainId}/activate`,
      'تم تفعيل النطاق وبدء تجهيز شهادة SSL',
      request,
      setMessage,
      loadDomains,
    );
  }

  async function syncSsl(domainId: string): Promise<void> {
    await callDomainAction(
      `/domains/${domainId}/sync-ssl`,
      'تمت مزامنة حالة SSL من المزود',
      request,
      setMessage,
      loadDomains,
    );
  }

  async function deleteDomain(domainId: string): Promise<void> {
    setMessage('');
    try {
      await request(`/domains/${domainId}`, { method: 'DELETE' });
      await loadDomains();
      setMessage('تم حذف النطاق');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر حذف النطاق');
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
      <Typography variant="h6">النطاقات المخصصة</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
        <TextField
          fullWidth
          value={hostname}
          onChange={(event) => setHostname(event.target.value)}
          placeholder="shop.example.com"
        />
        <Button variant="contained" onClick={() => createDomain().catch(() => undefined)}>
          إضافة
        </Button>
        <Button variant="outlined" onClick={() => loadDomains().catch(() => undefined)}>تحديث</Button>
      </Stack>

      <Box sx={{ display: 'grid', gap: 0.8 }}>
        {domains.map((domain) => (
          <Paper key={domain.id} variant="outlined" sx={{ p: 1 }}>
            <Typography variant="subtitle1">{domain.hostname}</Typography>
            <Typography variant="body2" sx={{ mt: 0.4 }}>
              الحالة: {domain.status} / SSL: {domain.sslStatus}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.4 }}>
              أضف سجل DNS TXT: <code>{domain.verificationDnsHost}</code> ={' '}
              <code>{domain.verificationToken}</code>
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.4 }}>
              أضف سجل DNS CNAME: <code>{domain.routingHost ?? domain.hostname}</code> ={' '}
              <code>{domain.routingTarget ?? 'stores.example.com'}</code>
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.4 }}>
              مزود SSL: {domain.sslProvider ?? 'cloudflare'} ({formatSslMode(domain.sslMode)})
            </Typography>
            {domain.sslLastCheckedAt ? <Typography variant="body2">آخر فحص SSL: {domain.sslLastCheckedAt}</Typography> : null}
            {domain.sslError ? <Typography variant="body2">خطأ SSL: {domain.sslError}</Typography> : null}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 0.8 }}>
              <Button variant="outlined" onClick={() => verifyDomain(domain.id).catch(() => undefined)}>تحقق</Button>
              <Button variant="contained" onClick={() => activateDomain(domain.id).catch(() => undefined)}>
                تفعيل
              </Button>
              <Button variant="outlined" onClick={() => syncSsl(domain.id).catch(() => undefined)}>مزامنة SSL</Button>
              <Button color="error" variant="outlined" onClick={() => deleteDomain(domain.id).catch(() => undefined)}>
                حذف
              </Button>
            </Stack>
          </Paper>
        ))}
        {domains.length === 0 ? <Typography color="text.secondary">لا توجد نطاقات محملة.</Typography> : null}
      </Box>

      {message ? <Alert severity="info">{message}</Alert> : null}
    </Paper>
  );
}

async function callDomainAction(
  path: string,
  successMessage: string,
  request: MerchantRequester,
  setMessage: (value: string) => void,
  loadDomains: () => Promise<void>,
): Promise<void> {
  setMessage('');
  try {
    await request(path, { method: 'POST' });
    await loadDomains();
    setMessage(successMessage);
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'فشلت عملية النطاق');
  }
}

function formatSslMode(mode: Domain['sslMode'] | undefined): string {
  if (mode === 'full') {
    return 'كامل';
  }
  return 'كامل (صارم)';
}
