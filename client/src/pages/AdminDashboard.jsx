import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import '../styles/Admin.css';

const API_URL = 'http://localhost:3000';

async function apiRequest(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include'
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Request failed');
  }

  return {
    data: result.data,
    total: Number(response.headers.get('X-Total-Count') || 0),
    page: Number(response.headers.get('X-Page') || 1),
    totalPages: Number(response.headers.get('X-Total-Pages') || 1)
  };
}

function formatDate(value) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

const AdminDashboard = () => {
  const storedUser = localStorage.getItem('currentUser');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [blockedFilter, setBlockedFilter] = useState('');
  const [activityAction, setActivityAction] = useState('');
  const [activityEntity, setActivityEntity] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    role: 'user'
  });

  const loadSummary = async () => {
    const result = await apiRequest('/admin/summary');
    setSummary(result.data);
  };

  const loadUsers = async () => {
    const params = new URLSearchParams({ page: '1', limit: '20', sortBy: 'id' });
    if (userSearch.trim()) params.set('search', userSearch.trim());
    if (roleFilter) params.set('role', roleFilter);
    if (blockedFilter) params.set('isBlocked', blockedFilter);
    const result = await apiRequest(`/admin/users?${params.toString()}`);
    setUsers(result.data);
  };

  const loadActivity = async () => {
    const params = new URLSearchParams({
      page: '1',
      limit: '20',
      sortBy: 'createdAt',
      order: 'desc'
    });
    if (activityAction.trim()) params.set('action', activityAction.trim());
    if (activityEntity.trim()) params.set('entityType', activityEntity.trim());
    const result = await apiRequest(`/admin/activity?${params.toString()}`);
    setActivity(result.data);
  };

  const loadAdminData = async () => {
    setIsLoading(true);
    setError('');
    try {
      await Promise.all([loadSummary(), loadUsers(), loadActivity()]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role !== 'admin') return undefined;

    const timeoutId = window.setTimeout(() => {
      loadAdminData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // Initial admin boot load is intentionally scheduled once after role confirmation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to={`/users/${currentUser.username}/dashboard`} replace />;
  }

  const handleUserSearch = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleActivitySearch = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await loadActivity();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleRoleChange = async (user, role) => {
    setError('');
    setMessage('');
    try {
      await apiRequest(`/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      setMessage(`Updated ${user.username}'s role.`);
      await Promise.all([loadSummary(), loadUsers(), loadActivity()]);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role
    });
    setMessage('');
    setError('');
  };

  const closeEditUser = () => {
    setEditingUser(null);
  };

  const handleEditUserSubmit = async (event) => {
    event.preventDefault();
    if (!editingUser) return;

    setError('');
    setMessage('');

    try {
      await apiRequest(`/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      setMessage(`Updated ${editForm.username}.`);
      setEditingUser(null);
      await Promise.all([loadSummary(), loadUsers(), loadActivity()]);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleBlockToggle = async (user) => {
    setError('');
    setMessage('');
    const action = user.is_blocked ? 'unblock' : 'block';
    try {
      await apiRequest(`/admin/users/${user.id}/${action}`, {
        method: 'PATCH'
      });
      setMessage(`${user.username} is now ${user.is_blocked ? 'unblocked' : 'blocked'}.`);
      await Promise.all([loadSummary(), loadUsers(), loadActivity()]);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleLogout = async () => {
    await apiRequest('/logout', { method: 'POST' }).catch(() => null);
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const metrics = summary
    ? [
        ['Users', summary.totalUsers],
        ['Admins', summary.adminUsers],
        ['Blocked', summary.blockedUsers],
        ['Posts', summary.totalPosts],
        ['Todos', summary.totalTodos],
        ['Comments', summary.totalComments]
      ]
    : [];

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <div className="admin-eyebrow">System Management</div>
          <h1>Admin Console</h1>
        </div>
        <div className="admin-header-actions">
          <button className="secondary-btn" onClick={() => navigate(`/users/${currentUser.username}/dashboard`)}>
            Dashboard
          </button>
          <button className="secondary-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="admin-main">
        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-success">{message}</div>}
        {isLoading && <div className="admin-muted">Loading admin data...</div>}

        <section className="admin-metrics">
          {metrics.map(([label, value]) => (
            <div className="metric-tile" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>User Management</h2>
              <p>Search users, change roles, and block access.</p>
            </div>
            <button className="secondary-btn" onClick={loadAdminData}>Refresh</button>
          </div>

          <form className="admin-filters" onSubmit={handleUserSearch}>
            <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users" />
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="">Any role</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <select value={blockedFilter} onChange={(event) => setBlockedFilter(event.target.value)}>
              <option value="">Any status</option>
              <option value="false">Active</option>
              <option value="true">Blocked</option>
            </select>
            <button className="primary-action" type="submit">Apply</button>
          </form>

          <div className="admin-table">
            <div className="admin-row admin-row-head">
              <span>User</span>
              <span>Role</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {users.map((user) => (
              <div className="admin-row" key={user.id}>
                <span>
                  <strong>{user.name}</strong>
                  <small>@{user.username} · {user.email}</small>
                </span>
                <select value={user.role} onChange={(event) => handleRoleChange(user, event.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <span className={user.is_blocked ? 'status blocked' : 'status active'}>
                  {user.is_blocked ? 'Blocked' : 'Active'}
                </span>
                <span className="admin-row-actions">
                  <button className="small-btn" onClick={() => openEditUser(user)}>
                    Edit
                  </button>
                  <button className="small-btn" onClick={() => handleBlockToggle(user)}>
                    {user.is_blocked ? 'Unblock' : 'Block'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Activity</h2>
              <p>Recent authentication, content, and admin events.</p>
            </div>
          </div>

          <form className="admin-filters" onSubmit={handleActivitySearch}>
            <input value={activityAction} onChange={(event) => setActivityAction(event.target.value)} placeholder="Action" />
            <input value={activityEntity} onChange={(event) => setActivityEntity(event.target.value)} placeholder="Entity type" />
            <button className="primary-action" type="submit">Filter</button>
          </form>

          <div className="activity-list">
            {activity.map((event) => (
              <article className="activity-item" key={event.id}>
                <div>
                  <strong>{event.action}</strong>
                  <span>{event.entityType} #{event.entityId || '-'}</span>
                </div>
                <div>
                  <span>{event.actorUsername ? `by @${event.actorUsername}` : 'system'}</span>
                  <span>{formatDate(event.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {editingUser && (
        <div className="admin-modal-overlay" onClick={closeEditUser}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Edit User</h2>
              <button className="close-btn" onClick={closeEditUser}>&times;</button>
            </div>
            <form className="admin-edit-form" onSubmit={handleEditUserSubmit}>
              <label>
                Name
                <input
                  value={editForm.name}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  maxLength="100"
                />
              </label>
              <label>
                Username
                <input
                  value={editForm.username}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, username: event.target.value }))}
                  required
                  maxLength="50"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                  maxLength="100"
                />
              </label>
              <label>
                Role
                <select value={editForm.role} onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div className="admin-modal-actions">
                <button className="secondary-btn" type="button" onClick={closeEditUser}>Cancel</button>
                <button className="primary-action" type="submit">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
