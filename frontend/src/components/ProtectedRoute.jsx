import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';

// 1 Hour = 60 minutes * 60 seconds * 1000 milliseconds = 3,600,000
const ONE_HOUR = 3600000;

function isJwtExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return true;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export default function ProtectedRoute({ children, allowedRoles = null, allowGuest = false }) {
  const token = localStorage.getItem('token');
  const guestName = localStorage.getItem('guestName');
  const loginTimestamp = localStorage.getItem('loginTimestamp');

  const isStopwatchExpired = Boolean(
    token && loginTimestamp && Date.now() - parseInt(loginTimestamp, 10) > ONE_HOUR
  );
  const isTokenExpired = Boolean(token && (isJwtExpired(token) || isStopwatchExpired));
  const hasValidToken = Boolean(token && !isTokenExpired);
  const rolesKey = allowedRoles ? allowedRoles.join(',') : '';

  const [status, setStatus] = useState(() => {
    if (isTokenExpired) return 'redirect-login';
    if (allowGuest) {
      return hasValidToken || guestName ? 'allowed' : 'redirect-login';
    }
    if (!hasValidToken) {
      return guestName ? 'redirect-lost' : 'redirect-login';
    }
    return 'checking';
  });

  useEffect(() => {
    // 1. Expired JWT or 1-hour stopwatch check: shred storage and notify once
    if (isTokenExpired) {
      if (localStorage.getItem('token')) {
        localStorage.clear();
        alert("Your secure session has expired. Please log in again.");
      }
      setStatus('redirect-login');
      return;
    }

    // 2. Guest-friendly pages (/lost, /found)
    if (allowGuest) {
      if (!hasValidToken && !guestName) {
        setStatus('redirect-login');
        return;
      }
      setStatus('allowed');

      // If logged in, quietly sync real role from Django to prevent localStorage tampering
      if (hasValidToken) {
        api.get('users/profile/')
          .then((res) => localStorage.setItem('role', res.data.role))
          .catch(() => {});
      }
      return;
    }

    // 3. No valid token on protected pages (/account, /support, /reports, /history)
    if (!hasValidToken) {
      setStatus(guestName ? 'redirect-lost' : 'redirect-login');
      return;
    }

    // 4. Server-verified role check against Django
    let isMounted = true;
    const requiredRoles = rolesKey ? rolesKey.split(',') : null;

    const verifySession = async () => {
      try {
        const response = await api.get('users/profile/');
        const realRole = response.data.role;
        localStorage.setItem('role', realRole);

        if (!isMounted) return;

        if (requiredRoles && !requiredRoles.includes(realRole)) {
          setStatus('redirect-lost');
        } else {
          setStatus('allowed');
        }
      } catch (error) {
        if (!isMounted) return;
        if (error.response?.status === 401) {
          localStorage.clear();
          setStatus('redirect-login');
        } else {
          setStatus('redirect-lost');
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [token, guestName, isTokenExpired, hasValidToken, allowGuest, rolesKey]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-semibold tracking-wide">
        Verifying access...
      </div>
    );
  }

  if (status === 'redirect-login') {
    return <Navigate to="/" replace />;
  }

  if (status === 'redirect-lost') {
    return <Navigate to="/lost" replace />;
  }

  return children;
}