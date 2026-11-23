import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import SetPassword from './pages/SetPassword';
import LostItems from './pages/LostItems';
import FoundItems from './pages/FoundItems';
import Support from './pages/Support';
import Reports from './pages/Reports';
import Account from './pages/Account';
import History from './pages/History';

const AUTH_ROLES = ['ADMIN', 'STUDENT', 'STAFF'];
const ADMIN_ONLY = ['ADMIN'];

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Guest + Authenticated Routes */}
        <Route
          path="/lost"
          element={
            <ProtectedRoute allowGuest>
              <LostItems />
            </ProtectedRoute>
          }
        />
        <Route
          path="/found"
          element={
            <ProtectedRoute allowGuest>
              <FoundItems />
            </ProtectedRoute>
          }
        />

        {/* Authenticated Users Only (Students, Staff, Admins) */}
        <Route
          path="/support"
          element={
            <ProtectedRoute allowedRoles={AUTH_ROLES}>
              <Support />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute allowedRoles={AUTH_ROLES}>
              <Account />
            </ProtectedRoute>
          }
        />

        {/* Strictly Admin-Only Routes */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <History />
            </ProtectedRoute>
          }
        />

        {/* Fallback for any unknown URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;