import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const loginTimestamp = localStorage.getItem('loginTimestamp');

  // 1 Hour = 60 minutes * 60 seconds * 1000 milliseconds = 3,600,000
  const ONE_HOUR = 3600000; 

  // 1. Kick out users with no token at all
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. The Stopwatch Check: If it has been more than 1 hour, shred the token
  if (loginTimestamp && (Date.now() - parseInt(loginTimestamp)) > ONE_HOUR) {
    localStorage.clear(); // Shreds all secure data
    alert("Your secure session has expired. Please log in again.");
    return <Navigate to="/" replace />;
  }

  // 3. Kick out Students trying to access Admin pages
  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. All security checks passed, open the door!
  return children;
}