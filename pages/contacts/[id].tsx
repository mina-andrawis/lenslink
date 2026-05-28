import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  PlusIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import Modal from '@/components/ui/Modal';
import ContactForm from '@/components/contacts/ContactForm';
import { StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import type { Contact, OutreachLog } from '@/types';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ContactDetail {
  contact: Contact;
  logs: OutreachLog[];
}

interface EmailDraft {
  subject: string;
  body: string;
}

const LOG_TYPE_COLORS: Record<string, string> = {
  email: 'bg-indigo-100 text-indigo-700',
  call: 'bg-green-100 text-green-700',
  meeting: 'bg-purple-100 text-purple-700',
  note: 'bg-gray-100 text-gray-700',
};

export default function ContactDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [logForm, setLogForm] = useState({ type: 'note' as OutreachLog['type'], subject: '', body: '' });
  const [savingLog, setSavingLog] = useState(false);

  // AI draft state
  const [showDraft, setShowDraft] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [writingStyle, setWritingStyle] = useState('');
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [selectedLog, setSelectedLog] = useState<OutreachLog | null>(null);

  const fetchDetail = async () => {
    if (!user || !id) return;
    const data = await apiFetch<ContactDetail>(`/api/contacts/${id}`, user);
    setDetail(data);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchDetail().finally(() => setLoading(false));
  }, [id, user]);

  const handleEdit = async (data: Partial<Contact>) => {
    if (!user || !id) return;
    await apiFetch<Contact>(`/api/contacts/${id}`, user, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    toast.success('Contact updated!');
    setShowEdit(false);
    fetchDetail();
  };

  const handleDelete = async () => {
    if (!user || !id) return;
    if (!confirm('Delete this contact? This cannot be undone.')) return;
    await apiFetch(`/api/contacts/${id}`, user, { method: 'DELETE' });
    toast.success('Contact deleted');
    router.push('/contacts');
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setSavingLog(true);
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ ...logForm, contactId: id }),
      });
      if (!res.ok) throw new Error();
      toast.success('Log added');
      setShowAddLog(false);
      setLogForm({ type: 'note', subject: '', body: '' });
      fetchDetail();
    } catch {
      toast.error('Failed to add log');
    } finally {
      setSavingLog(false);
    }
  };

  const openDraftModal = async () => {
    setShowDraft(true);
    setDraft(null);

    let resolvedStyle = writingStyle;
    if (!styleLoaded && user) {
      try {
        const data = await apiFetch<{ writingStyle: string }>('/api/settings', user);
        resolvedStyle = data.writingStyle ?? '';
        setWritingStyle(resolvedStyle);
      } catch { /* use empty default */ }
      setStyleLoaded(true);
    }

    // Style already saved — skip straight to generating
    if (resolvedStyle.trim()) {
      generateDraft(resolvedStyle);
    }
    // Otherwise the modal will show the style textarea (first-time setup)
  };

  const generateDraft = async (styleOverride?: string) => {
    if (!user || !id) return;
    const styleToUse = styleOverride !== undefined ? styleOverride : writingStyle;
    setDrafting(true);
    setDraft(null);
    try {
      const token = await user.getIdToken();
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ writingStyle: styleToUse }),
      });
      const res = await fetch('/api/ai/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contactId: id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: EmailDraft = await res.json();
      setDraft(data);
    } catch {
      toast.error('Failed to generate draft');
    } finally {
      setDrafting(false);
    }
  };

  const logDraft = async () => {
    if (!user || !id || !draft) return;
    setSavingLog(true);
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ type: 'email', subject: draft.subject, body: draft.body, contactId: id }),
      });
      if (!res.ok) throw new Error();
      toast.success('Saved to activity log');
      setShowDraft(false);
      fetchDetail();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingLog(false);
    }
  };

  const copyDraft = () => {
    if (!draft) return;
    const text = `Subject: ${draft.subject}\n\n${draft.body}`;
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
  };

  const openInMail = () => {
    if (!draft || !detail) return;
    const mailto = `mailto:${encodeURIComponent(detail.contact.email)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
    window.location.href = mailto;
  };

  const composeManual = () => {
    if (!detail?.contact.email) return;
    window.location.href = `mailto:${encodeURIComponent(detail.contact.email)}`;
  };

  if (loading) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  if (!detail) {
    return (
      <AuthGuard>
        <Layout>
          <div className="p-8 text-gray-700">Contact not found.</div>
        </Layout>
      </AuthGuard>
    );
  }

  const { contact, logs } = detail;

  return (
    <AuthGuard>
      <Layout>
        <div className="p-4 md:p-8 max-w-4xl">
          {/* Back */}
          <Link href="/contacts" className="mb-6 flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Contacts
          </Link>

          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
              <div className="mt-2 flex items-center gap-3">
                <StatusBadge status={contact.status} />
                <span className="text-xs text-gray-600 capitalize">{contact.type}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Contact Info</h2>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <EnvelopeIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 truncate">{contact.email}</a>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <PhoneIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                {contact.businessName && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <BuildingOfficeIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span>{contact.businessName}</span>
                  </div>
                )}
                {contact.followUpDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CalendarIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span>Follow up: {format(new Date(contact.followUpDate), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {contact.lastContactedAt && (
                  <p className="text-xs text-gray-600">
                    Last contacted: {format(new Date(contact.lastContactedAt), 'MMM d, yyyy')}
                  </p>
                )}
                {contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {contact.tags.map((t) => (
                      <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {contact.notes && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">Notes</h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <h2 className="font-semibold text-gray-900">Activity</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={composeManual}
                      disabled={!contact.email}
                      title={!contact.email ? 'No email address on file' : 'Open blank compose in Mail'}
                      className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <EnvelopeIcon className="h-3.5 w-3.5" />
                      Compose
                    </button>
                    <button
                      onClick={openDraftModal}
                      disabled={!contact.email}
                      title={!contact.email ? 'No email address on file' : 'Draft a personalized email with AI'}
                      className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <SparklesIcon className="h-3.5 w-3.5" />
                      Draft with AI
                    </button>
                    <button
                      onClick={() => setShowAddLog(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Log Activity
                    </button>
                  </div>
                </div>
                {!contact.email && (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
                    <span>⚠</span>
                    No email address on file — add one to enable outreach.
                  </div>
                )}
                <ul className="divide-y">
                  {logs.length === 0 && (
                    <li className="px-5 py-8 text-center text-sm text-gray-600">No activity logged yet</li>
                  )}
                  {logs.map((log) => (
                    <li
                      key={log._id}
                      onClick={() => setSelectedLog(log)}
                      className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${LOG_TYPE_COLORS[log.type] ?? 'bg-gray-100 text-gray-700'}`}>
                              {log.type}
                            </span>
                            {log.subject && (
                              <span className="text-sm font-medium text-gray-900 truncate">{log.subject}</span>
                            )}
                          </div>
                          {log.body && (
                            <p className="text-sm text-gray-600 line-clamp-2">{log.body}</p>
                          )}
                        </div>
                        <span className="ml-4 flex-shrink-0 text-xs text-gray-500">
                          {format(new Date(log.sentAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Contact">
          <ContactForm initial={contact} onSubmit={handleEdit} onCancel={() => setShowEdit(false)} />
        </Modal>

        {/* Log Activity Modal */}
        <Modal open={showAddLog} onClose={() => setShowAddLog(false)} title="Log Activity">
          <form onSubmit={handleAddLog} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={logForm.type}
                onChange={(e) => setLogForm((p) => ({ ...p, type: e.target.value as OutreachLog['type'] }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="note">Note</option>
                <option value="email">Email</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                value={logForm.subject}
                onChange={(e) => setLogForm((p) => ({ ...p, subject: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={logForm.body}
                onChange={(e) => setLogForm((p) => ({ ...p, body: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddLog(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={savingLog} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {savingLog ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>

        {/* AI Draft Modal */}
        <Modal open={showDraft} onClose={() => !drafting && setShowDraft(false)} title="Draft with AI">
          {drafting ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
              <p className="text-sm text-gray-600">Writing a personalized email for {detail?.contact.name}…</p>
            </div>
          ) : draft ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Subject</label>
                <input
                  value={draft.subject}
                  onChange={(e) => setDraft((d) => d ? { ...d, subject: e.target.value } : d)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Body</label>
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft((d) => d ? { ...d, body: e.target.value } : d)}
                  rows={12}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { void generateDraft(); }}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                    Regenerate
                  </button>
                  <button
                    onClick={() => setDraft(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Edit style
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyDraft}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    Copy
                  </button>
                  <button
                    onClick={openInMail}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    Open in Mail
                  </button>
                  <button
                    onClick={logDraft}
                    disabled={savingLog}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {savingLog ? 'Saving…' : 'Log'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your writing style
                  <span className="ml-1.5 text-xs font-normal text-gray-500">— set once, used for all future drafts</span>
                </label>
                <textarea
                  value={writingStyle}
                  onChange={(e) => setWritingStyle(e.target.value)}
                  rows={8}
                  placeholder={`Paste a few examples of how you actually write — emails, captions, DMs, anything. The more you give, the more the draft will sound like you.\n\nExample:\n"Hey! Saw your café on Instagram and absolutely love the vibe you've created. I'm a photographer based in Charleston and would love to chat about capturing some content for you…"`}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDraft(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { void generateDraft(); }}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Generate Draft
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Activity detail modal */}
        <Modal
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={selectedLog?.subject || (selectedLog?.type ? selectedLog.type.charAt(0).toUpperCase() + selectedLog.type.slice(1) : 'Activity')}
        >
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${LOG_TYPE_COLORS[selectedLog.type] ?? 'bg-gray-100 text-gray-700'}`}>
                  {selectedLog.type}
                </span>
                <span className="text-xs text-gray-500">
                  {format(new Date(selectedLog.sentAt), 'MMM d, yyyy')}
                </span>
              </div>
              {selectedLog.body && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedLog.body}</p>
              )}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      </Layout>
    </AuthGuard>
  );
}
