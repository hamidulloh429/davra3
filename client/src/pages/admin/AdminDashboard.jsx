import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { timeAgo } from '../../lib/utils';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    newUsers7d: 0,
    totalCircles: 0,
    activeCircles: 0,
    totalMessages: 0,
    totalMedia: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [
          { count: totalUsers },
          { count: blockedUsers },
          { count: totalCircles },
          { count: activeCircles },
          { count: totalMessages },
          { count: totalMedia },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_blocked', true),
          supabase.from('circles').select('*', { count: 'exact', head: true }),
          supabase.from('circles').select('*', { count: 'exact', head: true }).eq('is_archived', false),
          supabase.from('messages').select('*', { count: 'exact', head: true }),
          supabase.from('message_attachments').select('*', { count: 'exact', head: true }),
        ]);

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: newUsers7d } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo);

        setStats({
          totalUsers: totalUsers || 0,
          activeUsers: Math.max(0, (totalUsers || 0) - (blockedUsers || 0)),
          blockedUsers: blockedUsers || 0,
          newUsers7d: newUsers7d || 0,
          totalCircles: totalCircles || 0,
          activeCircles: activeCircles || 0,
          totalMessages: totalMessages || 0,
          totalMedia: totalMedia || 0,
        });

        // Fetch recent audit logs
        const { data: logs } = await supabase
          .from('audit_logs')
          .select('*, admins(name, google_email)')
          .order('created_at', { ascending: false })
          .limit(10);

        if (logs) setRecentLogs(logs);
      } catch (err) {
        console.error('Admin Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header mb-6">
        <h1>Boshqaruv paneli</h1>
        <p className="text-muted">Platformadagi umumiy statistika va so'nggi ma'lumotlar overview.</p>
      </div>

      {/* 8 Stats Cards Grid */}
      <div className="admin-stats-grid mb-8">
        <div className="admin-stat-card card">
          <div className="stat-icon-wrapper blue">👥</div>
          <div>
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Jami Foydalanuvchilar</span>
          </div>
        </div>

        <div className="admin-stat-card card">
          <div className="stat-icon-wrapper green">⚡</div>
          <div>
            <span className="stat-value">{stats.activeUsers}</span>
            <span className="stat-label">Faol Foydalanuvchilar</span>
          </div>
        </div>

        <div className="admin-stat-card card">
          <div className="stat-icon-wrapper red">🚫</div>
          <div>
            <span className="stat-value">{stats.blockedUsers}</span>
            <span className="stat-label">Bloklanganlar</span>
          </div>
        </div>

        <div className="admin-stat-card card">
          <div className="stat-icon-wrapper purple">✨</div>
          <div>
            <span className="stat-value">+{stats.newUsers7d}</span>
            <span className="stat-label">Yangi (7 kun)</span>
          </div>
        </div>

        <div className="admin-stat-card card">
          <div className="stat-icon-wrapper orange">🌐</div>
          <div>
            <span className="stat-value">{stats.totalCircles}</span>
            <span className="stat-label">Jami Davralar</span>
          </div>
        </div>

        <div className="admin-stat-card card">
          <div className="stat-icon-wrapper green">🔥</div>
          <div>
            <span className="stat-value">{stats.activeCircles}</span>
            <span className="stat-label">Faol Davralar</span>
          </div>
        </div>

        <div className="admin-stat-card card">
          <div className="stat-icon-wrapper blue">💬</div>
          <div>
            <span className="stat-value">{stats.totalMessages}</span>
            <span className="stat-label">Xabarlar</span>
          </div>
        </div>

        <div className="admin-stat-card card">
          <div className="stat-icon-wrapper yellow">🖼️</div>
          <div>
            <span className="stat-value">{stats.totalMedia}</span>
            <span className="stat-label">Media Fayllar</span>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="dashboard-actions-row mb-8">
        <Link to="/admin/users" className="action-card card">
          <span className="action-icon">👥</span>
          <h4>Foydalanuvchilarni boshqarish</h4>
          <p>Bloklash, roli o'zgartirish, profil ma'lumotlarini ko'rish</p>
        </Link>

        <Link to="/admin/communities" className="action-card card">
          <span className="action-icon">🌐</span>
          <h4>Davralarni boshqarish</h4>
          <p>Yangi davra ochish, tahrirlash, arxivlash, maxfiylikni o'zgartirish</p>
        </Link>

        <Link to="/admin/settings" className="action-card card">
          <span className="action-icon">⚙️</span>
          <h4>Platforma sozlamalari</h4>
          <p>Sayt nomi, fayl hajmi chegaralari, maintenance rejimi</p>
        </Link>
      </div>

      {/* Recent Audit Logs Table */}
      <div className="card dashboard-logs-card">
        <div className="logs-header justify-between items-center flex mb-4">
          <h3>So'nggi Audit Amallari</h3>
          <Link to="/admin/audit-logs" className="btn btn-sm btn-ghost">Hammasini ko'rish →</Link>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Harakat</th>
                <th>Maqsad ID</th>
                <th>Vaqt</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-semibold">{log.admins?.name || log.admins?.google_email || 'Tizim'}</td>
                    <td><span className="badge badge-primary">{log.action}</span></td>
                    <td className="font-mono text-xs">{log.target_id || '-'}</td>
                    <td className="text-muted text-xs">{timeAgo(log.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-muted">Audit loglari topilmadi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
