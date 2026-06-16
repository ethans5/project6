import { useState } from 'react';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import '../styles/Dashboard.css';
import '../styles/Posts.css';

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

  return result.data;
}

const Dashboard = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [profileForm, setProfileForm] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : {};
    return {
      name: currentUser.name || '',
      username: currentUser.username || '',
      email: currentUser.email || ''
    };
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const location = useLocation();
  const showProfile = location.hash === '#info';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setAccountMessage('');
    setAccountError('');
    setIsSavingAccount(true);

    try {
      const updatedUser = await apiRequest('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setAccountMessage('Profile updated.');

      if (updatedUser.username !== user.username) {
        navigate(`/users/${updatedUser.username}/dashboard#info`, { replace: true });
      }
    } catch (requestError) {
      setAccountError(requestError.message);
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setAccountMessage('');
    setAccountError('');
    setIsSavingAccount(true);

    try {
      await apiRequest('/users/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm)
      });
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setAccountMessage('Password changed.');
    } catch (requestError) {
      setAccountError(requestError.message);
    } finally {
      setIsSavingAccount(false);
    }
  };

  const closeProfile = () => {
    setAccountMessage('');
    setAccountError('');
    setPasswordForm({ currentPassword: '', newPassword: '' });
    navigate('');
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">JSONPlaceholder Clone</div>
        </div>
        <div className="header-center">
          <h1 className="welcome-message">Hello, {user.name}!</h1>
        </div>
        <div className="header-right">
          {user.role === 'admin' && (
            <button className="icon-btn" onClick={() => navigate('/admin')}>Admin</button>
          )}
          <button className="icon-btn" onClick={() => navigate('#info')} style={{ textDecoration: 'none' }}>Info</button>
          <button className="icon-btn logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {showProfile && (
        <div className="modal-overlay" onClick={closeProfile}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Account Settings</h2>
              <button className="close-btn" onClick={closeProfile}>&times;</button>
            </div>
            <div className="modal-body">
              {accountError && <div className="account-error">{accountError}</div>}
              {accountMessage && <div className="account-success">{accountMessage}</div>}

              <form className="account-form" onSubmit={handleProfileSubmit}>
                <label>
                  Name
                  <input
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                    maxLength="100"
                  />
                </label>
                <label>
                  Username
                  <input
                    value={profileForm.username}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, username: event.target.value }))}
                    required
                    maxLength="50"
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                    required
                    maxLength="100"
                  />
                </label>
                <button className="primary-action" type="submit" disabled={isSavingAccount}>
                  Save Profile
                </button>
              </form>

              <form className="account-form password-form" onSubmit={handlePasswordSubmit}>
                <label>
                  Current Password
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    autoComplete="current-password"
                    required
                  />
                </label>
                <label>
                  New Password
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <button className="secondary-btn" type="submit" disabled={isSavingAccount}>
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-main">
        <nav className="resource-nav">
          <NavLink to={`/users/${user.username}/todos`} className={({ isActive }) => `resource-btn ${isActive ? 'active' : ''}`}>
            Todos
          </NavLink>
          <NavLink to={`/users/${user.username}/posts`} className={({ isActive }) => `resource-btn ${isActive ? 'active' : ''}`}>
            Posts
          </NavLink>
          <NavLink to={`/users/${user.username}/albums`} className={({ isActive }) => `resource-btn ${isActive ? 'active' : ''}`}>
            Albums
          </NavLink>
        </nav>

        <Outlet context={{ user }} />
      </main>
    </div>
  );
};

export default Dashboard;
