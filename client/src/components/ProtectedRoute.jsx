import { Navigate, useParams } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const currentUserStr = localStorage.getItem('currentUser');
  const { username } = useParams();
  
  if (!currentUserStr) {
    return <Navigate to="/login" replace />;
  }

  const currentUser = JSON.parse(currentUserStr);

  if (username && currentUser.username !== username) {
    return <Navigate to={`/users/${currentUser.username}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute;
