import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

export default function AdminAuditLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*, admins(name, google_email)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        showToast(err.message || 'Audit loglarini yuklashda xatolik', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLogs();
  }, []);

  return (
    <div className="admin-audit-logs-page">
      <div className="admin-page-header mb-6">
        <h1>Audit Loglar (Tizim Jurnali)</h1>
        <p className="text-muted">Administratorlar tomonidan bajarilgan barcha muhim harakatlar tarixi.</p>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vaqt</th>
                <th>Admin</th>
                <th>Harakat</th>
                <th>Maqsad Turi</th>
                <th>Maqsad ID</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6">Yuklanmoqda...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-6">Audit loglari topilmadi</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-muted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('uz-UZ')}
                    </td>
                    <td className="font-semibold">{log.admins?.name || log.admins?.google_email || 'Tizim'}</td>
                    <td><span className="badge badge-primary">{log.action}</span></td>
                    <td className="font-medium text-xs">{log.target_type || '-'}</td>
                    <td className="font-mono text-xs">{log.target_id || '-'}</td>
                    <td className="font-mono text-xs text-muted">
                      {log.metadata ? JSON.stringify(log.metadata) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
