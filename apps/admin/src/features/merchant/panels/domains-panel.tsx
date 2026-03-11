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
      setMessage('Domains loaded');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load domains');
    }
  }

  async function createDomain(): Promise<void> {
    const normalized = hostname.trim().toLowerCase();
    if (!normalized) {
      setMessage('Hostname is required');
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
      setMessage('Domain added');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to add domain');
    }
  }

  async function verifyDomain(domainId: string): Promise<void> {
    await callDomainAction(
      `/domains/${domainId}/verify`,
      'Domain verified',
      request,
      setMessage,
      loadDomains,
    );
  }

  async function activateDomain(domainId: string): Promise<void> {
    await callDomainAction(
      `/domains/${domainId}/activate`,
      'Domain activated and SSL provisioning started',
      request,
      setMessage,
      loadDomains,
    );
  }

  async function syncSsl(domainId: string): Promise<void> {
    await callDomainAction(
      `/domains/${domainId}/sync-ssl`,
      'SSL status synced from provider',
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
      setMessage('Domain deleted');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete domain');
    }
  }

  return (
    <article className="card">
      <h3>Custom Domains</h3>
      <div className="actions">
        <input
          value={hostname}
          onChange={(event) => setHostname(event.target.value)}
          placeholder="shop.example.com"
        />
        <button className="primary" onClick={() => createDomain().catch(() => undefined)}>
          Add
        </button>
        <button onClick={() => loadDomains().catch(() => undefined)}>Refresh</button>
      </div>

      <div className="list">
        {domains.map((domain) => (
          <article key={domain.id} className="list-item">
            <h4>{domain.hostname}</h4>
            <p>
              Status: {domain.status} / SSL: {domain.sslStatus}
            </p>
            <p>
              Create DNS TXT: <code>{domain.verificationDnsHost}</code> ={' '}
              <code>{domain.verificationToken}</code>
            </p>
            <p>
              Create DNS CNAME: <code>{domain.routingHost ?? domain.hostname}</code> ={' '}
              <code>{domain.routingTarget ?? 'stores.example.com'}</code>
            </p>
            <p>
              SSL Provider: {domain.sslProvider ?? 'cloudflare'} ({formatSslMode(domain.sslMode)})
            </p>
            {domain.sslLastCheckedAt ? <p>Last SSL check: {domain.sslLastCheckedAt}</p> : null}
            {domain.sslError ? <p>SSL error: {domain.sslError}</p> : null}
            <div className="actions">
              <button onClick={() => verifyDomain(domain.id).catch(() => undefined)}>Verify</button>
              <button
                className="primary"
                onClick={() => activateDomain(domain.id).catch(() => undefined)}
              >
                Activate
              </button>
              <button onClick={() => syncSsl(domain.id).catch(() => undefined)}>Sync SSL</button>
              <button
                className="danger"
                onClick={() => deleteDomain(domain.id).catch(() => undefined)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
        {domains.length === 0 ? <p className="hint">No domains loaded.</p> : null}
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
    setMessage(error instanceof Error ? error.message : 'Domain action failed');
  }
}

function formatSslMode(mode: Domain['sslMode'] | undefined): string {
  if (mode === 'full') {
    return 'Full';
  }
  return 'Full (Strict)';
}
