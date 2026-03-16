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
    <section className="card-grid">
      <article className="card">
        <h3>دعوة عضو فريق</h3>
        <div className="actions">
          <button onClick={() => setShowInviteForm(!showInviteForm)}>
            {showInviteForm ? 'إلغاء' : 'دعوة جديدة'}
          </button>
        </div>

        {showInviteForm && (
          <div className="form-section">
            <label>
              البريد الإلكتروني
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="staff@example.com"
              />
            </label>

            <label>
              الاسم الكامل
              <input
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                placeholder="محمد أحمد"
              />
            </label>

            <label>
              الدور
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as StoreRole)}
              >
                <option value="staff">موظف</option>
                <option value="owner">مالك</option>
              </select>
            </label>

            <label>
              الصلاحيات (تفصل بفاصلة)
              <input
                value={invitePermissions}
                onChange={(e) => setInvitePermissions(e.target.value)}
                placeholder="products:read, products:write"
              />
            </label>

            <button className="primary" onClick={() => sendInvite().catch(() => undefined)}>
              إرسال الدعوة
            </button>
          </div>
        )}
      </article>

      <article className="card">
        <h3>الدعوات المعلقة</h3>
        <div className="list">
          {invites.map((invite) => (
            <article key={invite.id} className="list-item">
              <h4>{invite.fullName}</h4>
              <p>{invite.email}</p>
              <p>
                {invite.role} | تنتهي: {new Date(invite.expiresAt).toLocaleDateString()}
              </p>
            </article>
          ))}
          {invites.length === 0 ? <p className="hint">لا توجد دعوات معلقة.</p> : null}
        </div>
      </article>

      <article className="card">
        <h3>تعديل المستخدم</h3>
        {selectedUserId ? (
          <>
            <label>
              الدور
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as StoreRole)}>
                <option value="owner">مالك</option>
                <option value="staff">موظف</option>
              </select>
            </label>

            <label>
              الصلاحيات (تفصل بفاصلة)
              <input
                value={editPermissions}
                onChange={(e) => setEditPermissions(e.target.value)}
                placeholder="products:read, products:write"
              />
            </label>

            <div className="actions">
                <button className="primary" onClick={() => updateRole().catch(() => undefined)}>
                تحديث الدور
                </button>
              <button onClick={() => setSelectedUserId('')}>إلغاء</button>
            </div>
          </>
        ) : (
          <p className="hint">اختر مستخدماً من القائمة للتعديل.</p>
        )}
      </article>

      <article className="card">
        <h3>قائمة الفريق</h3>
        <div className="actions">
          <button onClick={() => loadUsers().catch(() => undefined)}>تحديث</button>
        </div>

        {message ? <p className="status-message success">{message}</p> : null}
        {error ? <p className="status-message error">{error}</p> : null}

        <div className="list">
          {users.map((user) => (
            <article key={user.id} className="list-item">
              <div className="list-item-header">
                <h4>{user.fullName}</h4>
                {user.isActive === false && <span className="badge disabled">معطل</span>}
              </div>
              <p>{user.email}</p>
              <p>
                {user.role} / {user.permissions.join(', ') || 'بدون صلاحيات'}
              </p>
              <div className="list-item-actions">
                <button onClick={() => selectUser(user)}>تعديل</button>
                {user.isActive !== false ? (
                  <button
                    className="danger"
                    onClick={() => disableUser(user.id).catch(() => undefined)}
                  >
                    تعطيل
                  </button>
                ) : (
                  <button onClick={() => enableUser(user.id).catch(() => undefined)}>تفعيل</button>
                )}
              </div>
            </article>
          ))}
          {users.length === 0 ? <p className="hint">لا يوجد مستخدمون.</p> : null}
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
