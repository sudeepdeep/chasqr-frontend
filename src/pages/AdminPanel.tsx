import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { BarChart2, Users, Globe, CheckCircle2, Eye, Trash2 } from 'lucide-react';
import {
  getStatsAPI, getAllUsersAPI, getAllSitesAdminAPI,
  updateUserStatusAPI, updateUserRoleAPI, adminDeleteSiteAPI,
} from '../api/admin.api';

type Tab = 'stats' | 'users' | 'sites';

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadTab(tab); }, [tab]); // eslint-disable-line

  const loadTab = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === 'stats') { const r = await getStatsAPI(); setStats(r.data.data); }
      else if (t === 'users') { const r = await getAllUsersAPI(); setUsers(r.data.data.users); }
      else { const r = await getAllSitesAdminAPI(); setSites(r.data.data.sites); }
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleUserStatus = async (userId: string, status: string) => {
    try {
      await updateUserStatusAPI(userId, status);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
      toast.success(`User ${status}`);
    } catch { toast.error('Failed to update user'); }
  };

  const handleUserRole = async (userId: string, role: string) => {
    try {
      await updateUserRoleAPI(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      toast.success(`Role updated to ${role}`);
    } catch { toast.error('Failed to update role'); }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!window.confirm('Delete this site permanently?')) return;
    try {
      await adminDeleteSiteAPI(siteId);
      setSites(prev => prev.filter(s => s.siteId !== siteId));
      toast.success('Site deleted');
    } catch { toast.error('Failed to delete site'); }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'stats', label: 'Stats', icon: <BarChart2 size={15} /> },
    { key: 'users', label: 'Users', icon: <Users size={15} /> },
    { key: 'sites', label: 'Sites', icon: <Globe size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-bebas text-5xl text-slate-900 mb-8">Admin Panel</h1>

          <div className="flex gap-2 mb-8 border-b border-slate-200">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {tab === 'stats' && stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={24} className="text-primary/70" /> },
                    { label: 'Total Sites', value: stats.totalSites, icon: <Globe size={24} className="text-purple-400" /> },
                    { label: 'Active Sites', value: stats.activeSites, icon: <CheckCircle2 size={24} className="text-green-400" /> },
                    { label: 'Total Visits', value: stats.totalVisits, icon: <Eye size={24} className="text-orange-400" /> },
                  ].map((s) => (
                    <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                      <div className="flex justify-center mb-2">{s.icon}</div>
                      <div className="font-bebas text-4xl text-primary">{s.value}</div>
                      <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'users' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {['Name', 'Email', 'Role', 'Status', 'Plan', 'Actions'].map(h => (
                          <th key={h} className="text-left py-3 px-2 text-slate-500 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-2 font-medium">{u.name}</td>
                          <td className="py-3 px-2 text-slate-500">{u.email}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-primary-light text-primary' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{u.status}</span>
                          </td>
                          <td className="py-3 px-2 text-slate-500">{u.plan}</td>
                          <td className="py-3 px-2">
                            <div className="flex gap-2">
                              <button onClick={() => handleUserStatus(u.id, u.status === 'active' ? 'suspended' : 'active')} className="text-xs px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50">
                                {u.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                              <button onClick={() => handleUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')} className="text-xs px-2.5 py-1 border border-primary/20 text-primary rounded-lg hover:bg-primary-light">
                                {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'sites' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {['Site', 'Owner', 'Pages', 'Status', 'Visits', 'Created', 'Actions'].map(h => (
                          <th key={h} className="text-left py-3 px-2 text-slate-500 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((s) => (
                        <tr key={s.siteId} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-2">
                            <p className="font-medium">{s.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{s.siteId}</p>
                          </td>
                          <td className="py-3 px-2 text-slate-500">{s.userId?.email || '—'}</td>
                          <td className="py-3 px-2 text-slate-500">{s.pages?.length ?? 0}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                          </td>
                          <td className="py-3 px-2 text-slate-500 flex items-center gap-1"><Eye size={12} />{s.visits}</td>
                          <td className="py-3 px-2 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-2">
                            <button onClick={() => handleDeleteSite(s.siteId)} className="flex items-center gap-1 text-xs px-2.5 py-1 border border-red-100 text-red-500 rounded-lg hover:bg-red-50">
                              <Trash2 size={11} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
