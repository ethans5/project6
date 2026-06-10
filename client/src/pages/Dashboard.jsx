import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // The ProtectedRoute already ensures this exists, but we fetch it to display
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile);
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glassmorphism-header">
        <div className="header-left">
          <div className="logo">JSONPlaceholder Clone</div>
        </div>
        
        <div className="header-center">
          <h1 className="welcome-message">Hello, {user.name}!</h1>
        </div>
        
        <div className="header-right">
          <button className="icon-btn info-btn" onClick={toggleProfile} title="Profile Info">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>Info</span>
          </button>
          
          <button className="icon-btn logout-btn" onClick={handleLogout} title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfile && (
        <div className="modal-overlay" onClick={toggleProfile}>
          <div className="modal-content glassmorphism" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Profile</h2>
              <button className="close-btn" onClick={toggleProfile}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="profile-detail">
                <span className="detail-label">ID:</span>
                <span className="detail-value">{user.id}</span>
              </div>
              <div className="profile-detail">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{user.name}</span>
              </div>
              <div className="profile-detail">
                <span className="detail-label">Username:</span>
                <span className="detail-value">@{user.username}</span>
              </div>
              <div className="profile-detail">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-main">
        <div className="content-area placeholder-card glassmorphism">
          <h2>Dashboard Content</h2>
          <p>Placeholder for Todos/Posts</p>
          <div className="empty-state-illustration">
             <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
