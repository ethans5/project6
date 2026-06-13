import { useState } from 'react';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import '../styles/Dashboard.css';
import '../styles/Posts.css';

const Dashboard = () => {
  const [user] = useState(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const location = useLocation();
  const showProfile = location.hash === '#info';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
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
          <button className="icon-btn" onClick={() => navigate('#info')} style={{ textDecoration: 'none' }}>Info</button>
          <button className="icon-btn logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {showProfile && (
        <div className="modal-overlay" onClick={() => navigate('')}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>User Profile</h2>
              <button className="close-btn" onClick={() => navigate('')}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="profile-detail"><span className="detail-label">Name:</span><span>{user.name}</span></div>
              <div className="profile-detail"><span className="detail-label">Username:</span><span>@{user.username}</span></div>
              <div className="profile-detail"><span className="detail-label">Email:</span><span>{user.email}</span></div>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-main">
        <nav className="resource-nav">
          {/* Using end or specific styles for DashboardHome might not be necessary if we just link to todos and posts */}
          <NavLink to={`/users/${user.username}/todos`} className={({ isActive }) => `resource-btn ${isActive ? 'active' : ''}`}>
            Todos
          </NavLink>
          <NavLink to={`/users/${user.username}/posts`} className={({ isActive }) => `resource-btn ${isActive ? 'active' : ''}`}>
            Posts
          </NavLink>
        </nav>

        <Outlet context={{ user }} />
      </main>
    </div>
  );
};

export default Dashboard;
