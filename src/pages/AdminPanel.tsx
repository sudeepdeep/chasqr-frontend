import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { BarChart2, Users, Globe, CheckCircle2, Eye, Trash2, Headset, Crown, Receipt, MessageSquare, X, ExternalLink } from 'lucide-react';
import { publicSiteUrl } from '../lib/siteUrl';
import {
  getStatsAPI, getAllUsersAPI, getAllSitesAdminAPI,
  updateUserStatusAPI, updateUserRoleAPI, adminDeleteSiteAPI,
  getAdminSupportRequestsAPI, getAdminRequestMessagesAPI,
  getAdminExpertsAPI, getAdminPaymentsAPI,
} from '../api/admin.api';

type Tab = 'stats' | 'users' | 'sites' | 'support' | 'experts' | 'payments';

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [experts, setExperts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [chatView, setChatView] = useState<{ id: string; messages: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadTab(tab); }, [tab]); // eslint-disable-line

  const loadTab = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === 'stats') { const r = await getStatsAPI(); setStats(r.data.data); }
      else if (t === 'users') { const r = await getAllUsersAPI(); setUsers(r.data.data.users); }
      else if (t === 'sites') { const r = await getAllSitesAdminAPI(); setSites(r.data.data.sites); }
      else if (t === 'support') { const r = await getAdminSupportRequestsAPI(); setSupportRequests(r.data.data.requests); }
      else if (t === 'experts') { const r = await getAdminExpertsAPI(); setExperts(r.data.data.experts); }
      else { const r = await getAdminPaymentsAPI(); setPayments(r.data.data.payments); }
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const openChat = async (id: string) => {
    try {
      const r = await getAdminRequestMessagesAPI(id);
      setChatView({ id, messages: r.data.data.messages });
    } catch { toast.error('Failed to load chat'); }
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
    { key: 'support', label: 'Support', icon: <Headset size={15} /> },
    { key: 'experts', label: 'Experts', icon: <Crown size={15} /> },
    { key: 'payments', label: 'Payments', icon: <Receipt size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6">
      <div className="max-w-[1300px] mx-auto">
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
                            {(() => {
                              const url = s.customDomain ? `https://${s.customDomain}` : publicSiteUrl(s.slug || s.siteId);
                              return (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-mono hover:underline break-all">
                                  {url.replace(/^https?:\/\//, '')}
                                </a>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-2 text-slate-500">{s.userId?.email || '—'}</td>
                          <td className="py-3 px-2 text-slate-500">{s.pages?.length ?? 0}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                          </td>
                          <td className="py-3 px-2 text-slate-500 flex items-center gap-1"><Eye size={12} />{s.visits}</td>
                          <td className="py-3 px-2 text-slate-500">{new Date(s.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <a
                                href={s.customDomain ? `https://${s.customDomain}` : publicSiteUrl(s.slug || s.siteId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs px-2.5 py-1 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                              >
                                <ExternalLink size={11} /> Visit
                              </a>
                              <button onClick={() => handleDeleteSite(s.siteId)} className="flex items-center gap-1 text-xs px-2.5 py-1 border border-red-100 text-red-500 rounded-lg hover:bg-red-50">
                                <Trash2 size={11} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {tab === 'support' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {['Topic', 'Customer', 'Expert', 'Site', 'Status', 'Code', 'Updated', 'Chat'].map(h => (
                          <th key={h} className="text-left py-3 px-2 text-slate-500 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {supportRequests.map((r) => (
                        <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-2 max-w-[16rem]"><p className="truncate">{r.topic}</p></td>
                          <td className="py-3 px-2 text-slate-500">{r.userId?.name}</td>
                          <td className="py-3 px-2 text-slate-500">{r.expertId?.name}</td>
                          <td className="py-3 px-2 text-slate-400 font-mono text-xs">{r.siteId}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              r.status === 'accepted' ? 'bg-green-50 text-green-600'
                              : r.status === 'pending' ? 'bg-amber-50 text-amber-600'
                              : 'bg-slate-100 text-slate-500'
                            }`}>{r.status}</span>
                          </td>
                          <td className="py-3 px-2 text-slate-500">{r.codeShared ? 'shared' : '—'}</td>
                          <td className="py-3 px-2 text-slate-500">{new Date(r.updated_at).toLocaleDateString()}</td>
                          <td className="py-3 px-2">
                            <button onClick={() => openChat(r._id)} className="flex items-center gap-1 text-xs px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50">
                              <MessageSquare size={11} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {supportRequests.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-10">No support requests yet</p>
                  )}
                </div>
              )}

              {tab === 'experts' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {['Name', 'Email', 'Title', 'Skills', 'Availability', 'Account'].map(h => (
                          <th key={h} className="text-left py-3 px-2 text-slate-500 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {experts.map((e) => (
                        <tr key={e._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-2 font-medium">{e.name}</td>
                          <td className="py-3 px-2 text-slate-500">{e.email}</td>
                          <td className="py-3 px-2 text-slate-500">{e.expertTitle}</td>
                          <td className="py-3 px-2 text-slate-500">{(e.expertSkills || []).join(', ')}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              e.expertStatus === 'available' ? 'bg-green-50 text-green-600'
                              : e.expertStatus === 'occupied' ? 'bg-amber-50 text-amber-600'
                              : 'bg-slate-100 text-slate-500'
                            }`}>{e.expertStatus}</span>
                          </td>
                          <td className="py-3 px-2 text-slate-500">{e.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {experts.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-10">No experts yet — promote a user or run the seed script</p>
                  )}
                </div>
              )}

              {tab === 'payments' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {['Order', 'User', 'Amount', 'Currency', 'Date'].map(h => (
                          <th key={h} className="text-left py-3 px-2 text-slate-500 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-2 font-mono text-xs">{p.orderId}</td>
                          <td className="py-3 px-2 text-slate-500">{p.userId?.email || '—'}</td>
                          <td className="py-3 px-2 font-medium">{(p.amount / 100).toFixed(2)}</td>
                          <td className="py-3 px-2 text-slate-500">{p.currency}</td>
                          <td className="py-3 px-2 text-slate-500">{new Date(p.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {payments.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-10">No payments yet</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Chat oversight modal */}
          {chatView && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-6" onClick={() => setChatView(null)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                  <span className="text-sm font-semibold text-slate-700">Conversation (read-only)</span>
                  <button onClick={() => setChatView(null)} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {chatView.messages.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-8">No messages</p>
                  )}
                  {chatView.messages.map((m: any) => (
                    <div key={m._id} className={`text-sm ${m.system ? 'text-center' : ''}`}>
                      {m.system ? (
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{m.text}</span>
                      ) : (
                        <p>
                          <strong className={m.senderId?.role === 'expert' ? 'text-amber-600' : 'text-primary'}>
                            {m.senderId?.name}:
                          </strong>{' '}
                          <span className="text-slate-700">{m.text}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
