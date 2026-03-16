import { useState } from 'react';
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
    <article className="card">
      <h3>النطاقات المخصصة</h3>
      <div className="actions">
        <input
          value={hostname}
          onChange={(event) => setHostname(event.target.value)}
          placeholder="shop.example.com"
        />
        <button className="primary" onClick={() => createDomain().catch(() => undefined)}>
          إضافة
        </button>
        <button onClick={() => loadDomains().catch(() => undefined)}>تحديث</button>
      </div>

      <div className="list">
        {domains.map((domain) => (
          <article key={domain.id} className="list-item">
            <h4>{domain.hostname}</h4>
            <p>
              الحالة: {domain.status} / SSL: {domain.sslStatus}
            </p>
            <p>
              أضف سجل DNS TXT: <code>{domain.verificationDnsHost}</code> ={' '}
              <code>{domain.verificationToken}</code>
            </p>
            <p>
              أضف سجل DNS CNAME: <code>{domain.routingHost ?? domain.hostname}</code> ={' '}
              <code>{domain.routingTarget ?? 'stores.example.com'}</code>
            </p>
            <p>
              مزود SSL: {domain.sslProvider ?? 'cloudflare'} ({formatSslMode(domain.sslMode)})
            </p>
            {domain.sslLastCheckedAt ? <p>آخر فحص SSL: {domain.sslLastCheckedAt}</p> : null}
            {domain.sslError ? <p>خطأ SSL: {domain.sslError}</p> : null}
            <div className="actions">
              <button onClick={() => verifyDomain(domain.id).catch(() => undefined)}>تحقق</button>
              <button
                className="primary"
                onClick={() => activateDomain(domain.id).catch(() => undefined)}
              >
                تفعيل
              </button>
              <button onClick={() => syncSsl(domain.id).catch(() => undefined)}>مزامنة SSL</button>
              <button
                className="danger"
                onClick={() => deleteDomain(domain.id).catch(() => undefined)}
              >
                حذف
              </button>
            </div>
          </article>
        ))}
        {domains.length === 0 ? <p className="hint">لا توجد نطاقات محملة.</p> : null}
      </div>

      {message ? <p className="status-message">{message}</p> : null}
    </article>
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
