import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('reports')
          .select('*, profiles!reporter_id(full_name, email)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        showToast(err.message || 'Hisobotlarni yuklashda xatolik', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus, reviewed_at: new Date().toISOString() })
        .eq('id', reportId);

      if (error) throw error;

      showToast(`Report holati "${newStatus}" ga o'zgartirildi`, 'success');
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    } catch (err) {
      showToast(err.message || 'Xatolik', 'error');
    }
  };

  return (
    <div className="admin-reports-page page-enter">
      <div className="admin-page-header mb-6">
        <h1>Shikoyatlar va Moderatsiya (Reports)</h1>
        <p className="text-muted">Foydalanuvchilar tomonidan yuborilgan shikoyatlar ro'yxati</p>
      </div>

      <div className="card card-glass">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Shikoyatchi</th>
                <th>Maqsad Turi</th>
                <th>Sabab</th>
                <th>Tavsif</th>
                <th>Holat</th>
                <th>Vaqti</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-6">Yuklanmoqda...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-6">Hozircha shikoyatlar yo'q</td></tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.profiles?.full_name || 'Noma\'lum'}</td>
                    <td><span className="badge badge-primary">{r.target_type}</span></td>
                    <td className="font-medium text-error">{r.reason}</td>
                    <td className="text-xs text-secondary">{r.description || '-'}</td>
                    <td>
                      <span className={`badge ${r.status === 'resolved' ? 'badge-success' : r.status === 'rejected' ? 'badge-muted' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-xs text-secondary">{new Date(r.created_at).toLocaleDateString('uz-UZ')}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-sm btn-outline" onClick={() => handleUpdateStatus(r.id, 'resolved')}>
                          ✓ Hal etildi
                        </button>
                        <button className="btn btn-sm btn-ghost text-error" onClick={() => handleUpdateStatus(r.id, 'rejected')}>
                          ✗ Rad etish
                        </button>
                      </div>
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
