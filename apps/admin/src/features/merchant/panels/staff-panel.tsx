import { useState, useEffect } from 'react';
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
      setError(err instanceof Error ? err.message : 'Failed to load users');
    }
  }

  async function loadInvites(): Promise<void> {
    setError('');
    try {
      const data = await request<StaffInvite[]>('/users/invites', { method: 'GET' });
      setInvites(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invites');
    }
  }

  async function sendInvite(): Promise<void> {
    setError('');
    setMessage('');
    if (!inviteEmail || !inviteFullName) {
      setError('Email and full name are required');
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
        setMessage(`Invite sent to ${result.email}`);
        if (result.inviteToken) {
          setMessage(
            `Invite sent. Share this link: ${window.location.origin}/accept-invite?token=${result.inviteToken}`,
          );
        }
      }
      setInviteEmail('');
      setInviteFullName('');
      setInvitePermissions('');
      setShowInviteForm(false);
      await loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    }
  }

  async function updateRole(): Promise<void> {
    if (!selectedUserId) {
      setError('Select a user first');
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
      setMessage('User role updated');
      setSelectedUserId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
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
      setMessage('User disabled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable user');
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
      setMessage('User enabled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable user');
    }
  }

  function selectUser(user: UserProfile): void {
    setSelectedUserId(user.id);
    setEditRole(user.role);
    setEditPermissions(user.permissions.join(', '));
  }

  return (
    <section className="card-grid">
      <article className="card">
        <h3>Invite Staff</h3>
        <div className="actions">
          <button onClick={() => setShowInviteForm(!showInviteForm)}>
            {showInviteForm ? 'Cancel' : 'New Invite'}
          </button>
        </div>

        {showInviteForm && (
          <div className="form-section">
            <label>
              Email
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="staff@example.com"
              />
            </label>

            <label>
              Full Name
              <input
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                placeholder="John Doe"
              />
            </label>

            <label>
              Role
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as StoreRole)}
              >
                <option value="staff">staff</option>
                <option value="owner">owner</option>
              </select>
            </label>

            <label>
              Permissions (comma separated)
              <input
                value={invitePermissions}
                onChange={(e) => setInvitePermissions(e.target.value)}
                placeholder="products:read, products:write"
              />
            </label>

            <button className="primary" onClick={() => sendInvite().catch(() => undefined)}>
              Send Invite
            </button>
          </div>
        )}
      </article>

      <article className="card">
        <h3>Pending Invites</h3>
        <div className="list">
          {invites.map((invite) => (
            <article key={invite.id} className="list-item">
              <h4>{invite.fullName}</h4>
              <p>{invite.email}</p>
              <p>
                {invite.role} | Expires: {new Date(invite.expiresAt).toLocaleDateString()}
              </p>
            </article>
          ))}
          {invites.length === 0 ? <p className="hint">No pending invites.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>Edit User</h3>
        {selectedUserId ? (
          <>
            <label>
              Role
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as StoreRole)}>
                <option value="owner">owner</option>
                <option value="staff">staff</option>
              </select>
            </label>

            <label>
              Permissions (comma separated)
              <input
                value={editPermissions}
                onChange={(e) => setEditPermissions(e.target.value)}
                placeholder="products:read, products:write"
              />
            </label>

            <div className="actions">
              <button className="primary" onClick={() => updateRole().catch(() => undefined)}>
                Update Role
              </button>
              <button onClick={() => setSelectedUserId('')}>Cancel</button>
            </div>
          </>
        ) : (
          <p className="hint">Select a user from the list to edit.</p>
        )}
      </article>

      <article className="card">
        <h3>Staff List</h3>
        <div className="actions">
          <button onClick={() => loadUsers().catch(() => undefined)}>Refresh</button>
        </div>

        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}

        <div className="list">
          {users.map((user) => (
            <article key={user.id} className="list-item">
              <div className="list-item-header">
                <h4>{user.fullName}</h4>
                {user.isActive === false && <span className="badge disabled">Disabled</span>}
              </div>
              <p>{user.email}</p>
              <p>
                {user.role} / {user.permissions.join(', ') || 'no permissions'}
              </p>
              <div className="list-item-actions">
                <button onClick={() => selectUser(user)}>Edit</button>
                {user.isActive !== false ? (
                  <button
                    className="danger"
                    onClick={() => disableUser(user.id).catch(() => undefined)}
                  >
                    Disable
                  </button>
                ) : (
                  <button onClick={() => enableUser(user.id).catch(() => undefined)}>Enable</button>
                )}
              </div>
            </article>
          ))}
          {users.length === 0 ? <p className="hint">No users found.</p> : null}
        </div>
      </article>
    </section>
  );
}

function parsePermissions(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
