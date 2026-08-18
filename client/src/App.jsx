import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Public & User Pages
import HomePage from './pages/HomePage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import CreateCommunityPage from './pages/CreateCommunityPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCommunitiesPage from './pages/admin/AdminCommunitiesPage';
import AdminAdminsPage from './pages/admin/AdminAdminsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminMediaPage from './pages/admin/AdminMediaPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <Routes>
            {/* Public & User Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="communities" element={<CommunitiesPage />} />
              <Route path="communities/new" element={<CreateCommunityPage />} />
              <Route path="communities/:slug" element={<CommunityDetailPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="communities" element={<AdminCommunitiesPage />} />
              <Route path="admins" element={<AdminAdminsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="media" element={<AdminMediaPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="profile" element={<AdminProfilePage />} />
            </Route>
          </Routes>
        </AdminAuthProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
