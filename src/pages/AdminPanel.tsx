import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { BarChart2, Users, Globe, CheckCircle2, Eye, Trash2, Headset, Crown, Receipt, MessageSquare, X, ExternalLink, Plus, Pencil, UserMinus, Mail, Send, ArrowLeft } from 'lucide-react';
import { publicSiteUrl } from '../lib/siteUrl';
import { previewBranded, previewRaw, DEFAULT_TEMPLATE_CONTENT } from '../lib/emailTemplate';
import { EMAIL_PRESETS, getPreset } from '../lib/emailPresets';
import {
  updateUserStatusAPI, updateUserRoleAPI, adminDeleteSiteAPI, adminSetSitePlanAPI,
  getAdminRequestMessagesAPI, sendAdminEmailAPI,
  createExpertAPI, updateExpertAPI, removeExpertAPI,
} from '../api/admin.api';
import { useQueryClient } from '@tanstack/react-query';
import { adminKeys, useAdminTab } from '../queries/admin';

type Tab = 'stats' | 'users' | 'sites' | 'support' | 'experts' | 'payments';

type Audience = 'all' | 'free' | 'paid' | 'test' | 'individual';

const AUDIENCES: { key: Audience; label: string; hint: string }[] = [
  { key: 'all', label: 'All users', hint: 'Every active account' },
  { key: 'free', label: 'Free plan', hint: 'Active free users' },
  { key: 'paid', label: 'PRO plan', hint: 'Active paying users' },
  { key: 'individual', label: 'Specific people', hint: 'Enter email addresses' },
  { key: 'test', label: 'Just me (test)', hint: 'Only your inbox' },
];

/** Split a comma/newline/space separated list into clean email addresses. */
function parseRecipients(raw: string): string[] {
  return Array.from(new Set(
    raw.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.includes('@')),
  ));
}

type Template = 'branded' | 'raw';

/**
 * Full-page email composer (not a modal — the modal was too cramped).
 *
 * Two columns: the form on the left, a live preview on the right. The preview
 * runs in a sandboxed iframe (empty `sandbox`), so scripts/forms/navigation in
 * the markup can't run against this admin session.
 *
 * Two content modes:
 *  - Branded (default): the admin writes just the message body; it drops into
 *    the fixed Chasqr shell (header + footer never change). Preview and backend
 *    share the same template so what you see is what sends.
 *  - Raw HTML: the admin supplies a complete document, sent as-is.
 *
 * The real send fans out one message per recipient via the backend (never a
 * shared To/CC) with the unsubscribe footer and List-Unsubscribe header.
 */
function EmailComposer({ onClose, initialRecipients }: { onClose: () => void; initialRecipients?: string[] }) {
  const hasInitial = !!initialRecipients?.length;
  const [audience, setAudience] = useState<Audience>(hasInitial ? 'individual' : 'test');
  const [template, setTemplate] = useState<Template>('branded');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState(DEFAULT_TEMPLATE_CONTENT);
  // 'custom' = free HTML editing; otherwise a preset key drives the content
  // from labelled fields the admin fills in.
  const [presetKey, setPresetKey] = useState<string>('custom');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [recipientsRaw, setRecipientsRaw] = useState((initialRecipients || []).join(', '));
  const [sending, setSending] = useState(false);

  const recipients = parseRecipients(recipientsRaw);
  const activePreset = template === 'branded' && presetKey !== 'custom' ? getPreset(presetKey) : undefined;
  // While a preset is active, its fields are the source of truth; otherwise the
  // content textarea is.
  const effectiveContent = activePreset ? activePreset.build(fieldValues) : content;
  const previewHtml = template === 'branded' ? previewBranded(effectiveContent) : previewRaw(effectiveContent);

  const choosePreset = (key: string) => {
    if (key === 'custom') { setPresetKey('custom'); return; }
    const p = getPreset(key);
    if (!p) return;
    const defaults: Record<string, string> = {};
    p.fields.forEach((f) => { defaults[f.key] = f.default; });
    setFieldValues(defaults);
    setSubject(p.defaultSubject);
    setPresetKey(key);
  };

  /** Drop the generated HTML into the editor and switch to free editing. */
  const editHtmlDirectly = () => {
    if (activePreset) setContent(activePreset.build(fieldValues));
    setPresetKey('custom');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !effectiveContent.trim()) {
      toast.error('Add a subject and some content first');
      return;
    }
    if (audience === 'individual' && recipients.length === 0) {
      toast.error('Add at least one valid email address');
      return;
    }
    if (audience !== 'test') {
      const who =
        audience === 'all' ? 'all active users'
        : audience === 'individual' ? `${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`
        : `all active ${audience === 'paid' ? 'PRO' : 'free'} users`;
      if (!window.confirm(`Send this email to ${who}?\n\nThis goes out immediately and can't be recalled. Send a "Just me (test)" copy first if you haven't yet.`)) return;
    }
    setSending(true);
    try {
      const r = await sendAdminEmailAPI({
        subject: subject.trim(),
        html: effectiveContent,
        audience,
        template,
        ...(audience === 'individual' ? { recipients } : {}),
      });
      const { sent, failed, total } = r.data.data as { sent: number; failed: number; total: number };
      if (failed > 0) toast.warn(`Sent to ${sent} of ${total} — ${failed} failed. Check the server logs.`);
      else toast.success(`Sent to ${sent} recipient${sent === 1 ? '' : 's'}.`);
      // Test sends stay on the page so a real send can follow.
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not send the email');
    } finally {
      setSending(false);
    }
  };

  const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary';
  const sendLabel = sending ? 'Sending…' : audience === 'test' ? 'Send test to me' : 'Send email';

  return (
    <form onSubmit={submit}>
      {/* Header + actions */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-2">
            <ArrowLeft size={15} /> Back to users
          </button>
          <h1 className="font-bebas text-4xl text-slate-900 leading-none">Send Email</h1>
          <p className="text-slate-500 text-sm mt-1">
            From <span className="font-mono text-slate-600">hello@chasqr.com</span> — one message per recipient, with an unsubscribe footer.
          </p>
        </div>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          <Send size={15} />
          {sendLabel}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Left — form */}
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Audience</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setAudience(a.key)}
                  className={`text-left px-3 py-2 rounded-lg border transition-colors ${
                    audience === a.key ? 'border-primary bg-primary-light' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`block text-sm font-medium ${audience === a.key ? 'text-primary' : 'text-slate-700'}`}>{a.label}</span>
                  <span className="block text-[11px] text-slate-400 leading-tight mt-0.5">{a.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {audience === 'individual' && (
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Recipients <span className="text-slate-400 font-normal">— separate with commas or new lines</span>
              </label>
              <textarea
                className={`${field} resize-y`}
                rows={2}
                value={recipientsRaw}
                onChange={(e) => setRecipientsRaw(e.target.value)}
                placeholder="alice@example.com, bob@example.com"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {recipients.length} valid address{recipients.length === 1 ? '' : 'es'} detected.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Template</label>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
              <button
                type="button"
                onClick={() => setTemplate('branded')}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${template === 'branded' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Branded template
              </button>
              <button
                type="button"
                onClick={() => setTemplate('raw')}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${template === 'raw' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Raw HTML
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {template === 'branded'
                ? 'Your content drops into the Chasqr shell — header, footer and styling stay fixed.'
                : 'You supply the entire HTML document. It’s sent exactly as written.'}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Subject</label>
            <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's new at Chasqr" required />
          </div>

          {template === 'branded' && (
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Start from</label>
              <select
                className={field}
                value={presetKey}
                onChange={(e) => choosePreset(e.target.value)}
              >
                <option value="custom">Custom — write my own</option>
                {EMAIL_PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
          )}

          {activePreset ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-600">Editable fields</label>
                <button type="button" onClick={editHtmlDirectly} className="text-xs text-primary hover:underline">
                  Edit HTML directly
                </button>
              </div>
              <div className="space-y-3">
                {activePreset.fields.map((f) => (
                  <div key={f.key}>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">{f.label}</label>
                    <input
                      type={f.type === 'url' ? 'url' : 'text'}
                      className={field}
                      value={fieldValues[f.key] ?? f.default}
                      onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                    {f.hint && <p className="text-[11px] text-slate-400 mt-1">{f.hint}</p>}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                <span className="font-mono">{'{{first_name}}'}</span> is filled in per recipient. Unsubscribe + address are already in the footer.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-600">
                  {template === 'branded' ? 'Message content' : 'Full HTML document'}
                </label>
                {template === 'branded' && (
                  <button type="button" onClick={() => setContent(DEFAULT_TEMPLATE_CONTENT)} className="text-xs text-primary hover:underline">
                    Reset to example
                  </button>
                )}
              </div>
              <textarea
                className={`${field} font-mono text-xs resize-y`}
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={template === 'branded'
                  ? '<h1>Headline</h1>\n<p>Your message…</p>'
                  : '<!DOCTYPE html><html>…</html>'}
                required
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                {template === 'branded'
                  ? 'Use <h1>, <p>, <ul>, <a class="btn">…</a>, <img>. {{first_name}} is replaced per recipient. Unsubscribe + address are in the footer already.'
                  : 'An unsubscribe footer is appended automatically. Add your postal address for full CAN-SPAM / GDPR compliance.'}
              </p>
            </div>
          )}
        </div>

        {/* Right — live preview */}
        <div className="lg:sticky lg:top-6">
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="text-[11px] font-medium text-slate-500 px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span>Live preview</span>
              <span className="text-slate-400">{template === 'branded' ? 'Branded template' : 'Raw HTML'}</span>
            </div>
            <iframe
              title="Email preview"
              sandbox=""
              srcDoc={previewHtml || '<p style="color:#94a3b8;font-family:sans-serif;padding:12px">Nothing to preview yet.</p>'}
              className="w-full h-[70vh] bg-white"
            />
          </div>
        </div>
      </div>
    </form>
  );
}

/**
 * Create/edit form for an expert.
 *
 * `expert` null means create. On edit the password field is optional and an
 * empty value leaves the existing password alone — the backend treats it the
 * same way, so a blank box can never blank out someone's login.
 */
function ExpertForm({
  expert,
  onClose,
  onSaved,
}: {
  expert: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!expert;
  const [form, setForm] = useState({
    name: expert?.name ?? '',
    email: expert?.email ?? '',
    password: '',
    expertTitle: expert?.expertTitle ?? '',
    expertBio: expert?.expertBio ?? '',
    expertSkills: (expert?.expertSkills ?? []).join(', '),
    expertStatus: expert?.expertStatus ?? 'offline',
    status: expert?.status ?? 'active',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        expertTitle: form.expertTitle,
        expertBio: form.expertBio,
        expertSkills: String(form.expertSkills)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
        expertStatus: form.expertStatus as 'available' | 'occupied' | 'offline',
        status: form.status as 'active' | 'suspended',
        ...(form.password ? { password: form.password } : {}),
      };
      if (editing) await updateExpertAPI(expert._id, payload);
      else await createExpertAPI(payload);
      toast.success(editing ? 'Expert updated' : 'Expert created');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not save expert');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary';

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4 py-8 overflow-y-auto">
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative"
      >
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
        <h2 className="font-bebas text-3xl text-slate-900 mb-1">{editing ? 'Edit Expert' : 'New Expert'}</h2>
        <p className="text-slate-500 text-sm mb-5">
          {editing ? 'Update this expert’s profile and availability.' : 'Creates a verified expert account they can sign in with.'}
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Name</label>
              <input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Email</label>
              <input type="email" className={field} value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Password {editing && <span className="text-slate-400 font-normal">— leave blank to keep current</span>}
            </label>
            <input
              type="password"
              className={field}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              minLength={8}
              required={!editing}
              placeholder={editing ? '••••••••' : 'At least 8 characters'}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Title</label>
            <input className={field} value={form.expertTitle} onChange={(e) => set('expertTitle', e.target.value)} placeholder="React &amp; Angular Developer" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Skills <span className="text-slate-400 font-normal">— comma separated</span></label>
            <input className={field} value={form.expertSkills} onChange={(e) => set('expertSkills', e.target.value)} placeholder="react, angular, frontend" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Bio</label>
            <textarea className={`${field} resize-none`} rows={3} value={form.expertBio} onChange={(e) => set('expertBio', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Availability</label>
              <select className={field} value={form.expertStatus} onChange={(e) => set('expertStatus', e.target.value)}>
                <option value="available">available</option>
                <option value="occupied">occupied</option>
                <option value="offline">offline</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Account</label>
              <select className={field} value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create expert'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('stats');
  const [chatView, setChatView] = useState<{ id: string; messages: any[] } | null>(null);
  const [expertForm, setExpertForm] = useState<{ open: boolean; expert: any | null }>({ open: false, expert: null });
  const [emailComposer, setEmailComposer] = useState<{ open: boolean; recipients?: string[] }>({ open: false });
  const qc = useQueryClient();

  // Only the tab on screen is fetched, and each is cached under its own key —
  // so flicking across the strip to compare things no longer reloads anything.
  const { data, isPending, isError } = useAdminTab(tab);
  const loading = isPending;

  useEffect(() => {
    if (isError) toast.error('Failed to load data');
  }, [isError]);

  // The panel renders six different shapes from one query; each view reads the
  // slice it owns and ignores the rest.
  const stats = tab === 'stats' ? (data as any) : null;
  const users = (tab === 'users' ? (data as any[]) : []) ?? [];
  const sites = (tab === 'sites' ? (data as any[]) : []) ?? [];
  const supportRequests = (tab === 'support' ? (data as any[]) : []) ?? [];
  const experts = (tab === 'experts' ? (data as any[]) : []) ?? [];
  const payments = (tab === 'payments' ? (data as any[]) : []) ?? [];

  /** Drop a tab's cache so it refetches — used after a mutation changes it. */
  const reloadTab = (t: Tab) => qc.invalidateQueries({ queryKey: adminKeys.tab(t) });

  const removeExpert = async (expert: any) => {
    // Spelled out because it isn't a delete: the account survives, which is
    // what keeps their past support conversations readable.
    if (!window.confirm(
      `Revoke expert access for ${expert.name}?\n\nThe account is kept (demoted to a normal user) so their support history stays intact. You can promote them again from the Users tab.`
    )) return;
    try {
      await removeExpertAPI(expert._id);
      qc.setQueryData<any[]>(adminKeys.tab('experts'), (prev: any[] | undefined) =>
        prev ? prev.filter((x: any) => x._id !== expert._id) : prev,
      );
      toast.success('Expert access revoked');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not revoke access');
    }
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
      qc.setQueryData<any[]>(adminKeys.tab('users'), (prev: any[] | undefined) =>
        prev ? prev.map((u: any) => (u.id === userId ? { ...u, status } : u)) : prev,
      );
      toast.success(`User ${status}`);
    } catch { toast.error('Failed to update user'); }
  };

  const handleUserRole = async (userId: string, role: string) => {
    try {
      await updateUserRoleAPI(userId, role);
      qc.setQueryData<any[]>(adminKeys.tab('users'), (prev: any[] | undefined) =>
        prev ? prev.map((u: any) => (u.id === userId ? { ...u, role } : u)) : prev,
      );
      toast.success(`Role updated to ${role}`);
    } catch { toast.error('Failed to update role'); }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!window.confirm('Delete this site permanently?')) return;
    try {
      await adminDeleteSiteAPI(siteId);
      qc.setQueryData<any[]>(adminKeys.tab('sites'), (prev: any[] | undefined) =>
        prev ? prev.filter((x: any) => x.siteId !== siteId) : prev,
      );
      toast.success('Site deleted');
    } catch { toast.error('Failed to delete site'); }
  };

  const handleSetPlan = async (siteId: string, plan: 'free' | 'paid') => {
    const label = plan === 'paid' ? 'PRO' : 'Free';
    if (!window.confirm(`Set this site to ${label}?${plan === 'paid' ? ' This unlocks all PRO features with no payment.' : ''}`)) return;
    try {
      await adminSetSitePlanAPI(siteId, plan);
      qc.setQueryData<any[]>(adminKeys.tab('sites'), (prev: any[] | undefined) =>
        prev ? prev.map((x: any) => (x.siteId === siteId ? { ...x, plan } : x)) : prev,
      );
      toast.success(`Site set to ${label}`);
    } catch { toast.error('Failed to change plan'); }
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
    <div className="min-h-screen bg-white pt-8 pb-16 px-6">
      <div className="max-w-[1300px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {emailComposer.open ? (
            <EmailComposer
              key={emailComposer.recipients?.join(',') || 'all'}
              initialRecipients={emailComposer.recipients}
              onClose={() => setEmailComposer({ open: false })}
            />
          ) : (
          <>
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
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setEmailComposer({ open: true })}
                      className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <Mail size={15} />
                      Send email
                    </button>
                  </div>
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
                              <button onClick={() => setEmailComposer({ open: true, recipients: [u.email] })} title={`Email ${u.email}`} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
                                <Mail size={11} /> Email
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
                        {['Site', 'Owner', 'Pages', 'Plan', 'Status', 'Visits', 'Created', 'Actions'].map(h => (
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
                            {s.plan === 'paid' ? (
                              <span className="flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600"><Crown size={11} /> PRO</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Free</span>
                            )}
                          </td>
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
                              {s.plan === 'paid' ? (
                                <button onClick={() => handleSetPlan(s.siteId, 'free')} className="flex items-center gap-1 text-xs px-2.5 py-1 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
                                  Downgrade
                                </button>
                              ) : (
                                <button onClick={() => handleSetPlan(s.siteId, 'paid')} className="flex items-center gap-1 text-xs px-2.5 py-1 border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50">
                                  <Crown size={11} /> Make PRO
                                </button>
                              )}
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
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setExpertForm({ open: true, expert: null })}
                      className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <Plus size={15} />
                      New expert
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {['Name', 'Email', 'Title', 'Skills', 'Availability', 'Account', ''].map((h, i) => (
                          <th key={h || i} className="text-left py-3 px-2 text-slate-500 font-medium">{h}</th>
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
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setExpertForm({ open: true, expert: e })}
                                title="Edit expert"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary-light transition-colors"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => removeExpert(e)}
                                title="Revoke expert access"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <UserMinus size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {experts.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-10">No experts yet — create one above, or promote a user from the Users tab</p>
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
          </>
          )}

          {expertForm.open && (
            <ExpertForm
              expert={expertForm.expert}
              onClose={() => setExpertForm({ open: false, expert: null })}
              onSaved={() => reloadTab('experts')}
            />
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
