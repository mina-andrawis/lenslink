import { useEffect, useState, useCallback } from 'react';
import { PlusIcon, PaperAirplaneIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import Modal from '@/components/ui/Modal';
import TemplateForm from '@/components/outreach/TemplateForm';
import CampaignForm from '@/components/outreach/CampaignForm';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import type { Template, Campaign, Contact } from '@/types';
import toast from 'react-hot-toast';

type Tab = 'campaigns' | 'templates';

const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sending: 'bg-amber-100 text-amber-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function OutreachPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [c, t, ct] = await Promise.all([
      apiFetch<Campaign[]>('/api/campaigns', user),
      apiFetch<Template[]>('/api/templates', user),
      apiFetch<Contact[]>('/api/contacts', user),
    ]);
    setCampaigns(c);
    setTemplates(t);
    setContacts(ct);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const handleCreateCampaign = async (data: {
    name: string; subject: string; body: string; recipients: string[];
  }) => {
    if (!user) return;
    await apiFetch<Campaign>('/api/campaigns', user, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('Campaign created as draft');
    setShowNewCampaign(false);
    fetchAll();
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!user) return;
    if (!confirm('Send this campaign now? This will email all recipients immediately.')) return;
    setSendingId(campaignId);
    try {
      const updated = await apiFetch<Campaign>(`/api/campaigns/${campaignId}`, user, { method: 'POST' });
      toast.success(`Sent to ${updated.stats.sent} of ${updated.stats.total} recipients`);
      fetchAll();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSendingId(null);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!user) return;
    if (!confirm('Delete this campaign?')) return;
    await apiFetch(`/api/campaigns/${id}`, user, { method: 'DELETE' });
    toast.success('Campaign deleted');
    fetchAll();
  };

  const handleSaveTemplate = async (data: Partial<Template>) => {
    if (!user) return;
    if (editingTemplate) {
      await apiFetch<Template>(`/api/templates/${editingTemplate._id}`, user, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      toast.success('Template updated');
      setEditingTemplate(null);
    } else {
      await apiFetch<Template>('/api/templates', user, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Template saved');
      setShowNewTemplate(false);
    }
    fetchAll();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!user) return;
    if (!confirm('Delete this template?')) return;
    await apiFetch(`/api/templates/${id}`, user, { method: 'DELETE' });
    toast.success('Template deleted');
    fetchAll();
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Outreach</h1>
            <div className="flex gap-2">
              {tab === 'campaigns' && (
                <button
                  onClick={() => setShowNewCampaign(true)}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  New Campaign
                </button>
              )}
              {tab === 'templates' && (
                <button
                  onClick={() => setShowNewTemplate(true)}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  New Template
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex border-b border-gray-200">
            {(['campaigns', 'templates'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                  tab === t
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-700 hover:text-gray-700'
                }`}
              >
                {t} {t === 'campaigns' ? `(${campaigns.length})` : `(${templates.length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : tab === 'campaigns' ? (
            <div className="space-y-3">
              {campaigns.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
                  <p className="text-sm text-gray-700">No campaigns yet. Create one to start reaching out!</p>
                </div>
              )}
              {campaigns.map((c) => (
                <div key={c._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{c.name}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CAMPAIGN_STATUS_STYLES[c.status]}`}>
                          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 truncate">{c.subject}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                        <span>{c.recipients.length} recipient{c.recipients.length !== 1 ? 's' : ''}</span>
                        {c.status === 'sent' && (
                          <span className="text-green-600">{c.stats.sent} sent · {c.stats.failed} failed</span>
                        )}
                        {c.sentAt && <span>Sent {format(new Date(c.sentAt), 'MMM d, yyyy')}</span>}
                        {!c.sentAt && <span>Created {format(new Date(c.createdAt), 'MMM d, yyyy')}</span>}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      {c.status === 'draft' && (
                        <button
                          onClick={() => handleSendCampaign(c._id)}
                          disabled={sendingId === c._id}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          <PaperAirplaneIcon className="h-3.5 w-3.5" />
                          {sendingId === c._id ? 'Sending…' : 'Send'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCampaign(c._id)}
                        className="rounded-lg p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-12 text-center">
                  <p className="text-sm text-gray-700">No templates yet. Create one to speed up your outreach!</p>
                </div>
              )}
              {templates.map((t) => (
                <div key={t._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingTemplate(t)}
                        className="rounded p-1 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(t._id)}
                        className="rounded p-1 text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {t.category && (
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 mb-2">{t.category}</span>
                  )}
                  <p className="text-sm text-gray-600 font-medium truncate">{t.subject}</p>
                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">{t.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Campaign Modal */}
        <Modal open={showNewCampaign} onClose={() => setShowNewCampaign(false)} title="New Campaign">
          <CampaignForm
            contacts={contacts}
            templates={templates}
            onSubmit={handleCreateCampaign}
            onCancel={() => setShowNewCampaign(false)}
          />
        </Modal>

        {/* New Template Modal */}
        <Modal open={showNewTemplate} onClose={() => setShowNewTemplate(false)} title="New Template">
          <TemplateForm onSubmit={handleSaveTemplate} onCancel={() => setShowNewTemplate(false)} />
        </Modal>

        {/* Edit Template Modal */}
        <Modal open={!!editingTemplate} onClose={() => setEditingTemplate(null)} title="Edit Template">
          <TemplateForm
            initial={editingTemplate ?? undefined}
            onSubmit={handleSaveTemplate}
            onCancel={() => setEditingTemplate(null)}
          />
        </Modal>
      </Layout>
    </AuthGuard>
  );
}
