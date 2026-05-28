import { useState } from 'react';
import type { Contact, Template } from '@/types';

interface CampaignFormProps {
  contacts: Contact[];
  templates: Template[];
  onSubmit: (data: {
    name: string;
    subject: string;
    body: string;
    recipients: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

export default function CampaignForm({ contacts, templates, onSubmit, onCancel }: CampaignFormProps) {
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    selectedTemplate: '',
    recipients: [] as string[],
    filterStatus: 'all',
  });
  const [saving, setSaving] = useState(false);

  const filteredContacts =
    form.filterStatus === 'all'
      ? contacts
      : contacts.filter((c) => c.status === form.filterStatus);

  const handleTemplateSelect = (templateId: string) => {
    const tpl = templates.find((t) => t._id === templateId);
    if (tpl) {
      setForm((prev) => ({
        ...prev,
        selectedTemplate: templateId,
        subject: tpl.subject,
        body: tpl.body,
      }));
    } else {
      setForm((prev) => ({ ...prev, selectedTemplate: templateId }));
    }
  };

  const toggleRecipient = (id: string) => {
    setForm((prev) => ({
      ...prev,
      recipients: prev.recipients.includes(id)
        ? prev.recipients.filter((r) => r !== id)
        : [...prev.recipients, id],
    }));
  };

  const selectAll = () => {
    setForm((prev) => ({ ...prev, recipients: filteredContacts.map((c) => c._id) }));
  };

  const clearAll = () => {
    setForm((prev) => ({ ...prev, recipients: [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name: form.name,
        subject: form.subject,
        body: form.body,
        recipients: form.recipients,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
          placeholder="May 2026 Outreach"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {templates.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Load from Template</label>
          <select
            value={form.selectedTemplate}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— Select a template —</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
        <input
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Body *</label>
        <p className="text-xs text-gray-600 mb-1">Use {'{{name}}'} for personalization</p>
        <textarea
          value={form.body}
          onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
          required
          rows={8}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
        />
      </div>

      {/* Recipients */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Recipients ({form.recipients.length} selected)
          </label>
          <div className="flex gap-3 text-xs">
            <select
              value={form.filterStatus}
              onChange={(e) => setForm((p) => ({ ...p, filterStatus: e.target.value }))}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="all">All statuses</option>
              <option value="lead">Lead</option>
              <option value="contacted">Contacted</option>
              <option value="proposal_sent">Proposal Sent</option>
            </select>
            <button type="button" onClick={selectAll} className="text-indigo-600 hover:underline">
              Select all
            </button>
            <button type="button" onClick={clearAll} className="text-gray-600 hover:underline">
              Clear
            </button>
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y">
          {filteredContacts.map((c) => (
            <label key={c._id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.recipients.includes(c._id)}
                onChange={() => toggleRecipient(c._id)}
                className="rounded border-gray-300 text-indigo-600"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                <p className="text-xs text-gray-600 truncate">{c.email}</p>
              </div>
            </label>
          ))}
          {filteredContacts.length === 0 && (
            <p className="px-3 py-4 text-sm text-gray-600 text-center">No contacts match this filter</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !form.recipients.length}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Creating…' : `Create Campaign (${form.recipients.length})`}
        </button>
      </div>
    </form>
  );
}
