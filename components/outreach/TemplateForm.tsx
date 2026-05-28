import { useState } from 'react';
import type { Template } from '@/types';

interface TemplateFormProps {
  initial?: Partial<Template>;
  onSubmit: (data: Partial<Template>) => Promise<void>;
  onCancel: () => void;
}

const VARIABLE_HINT = 'Available variables: {{name}}, {{email}}, {{businessName}}';

export default function TemplateForm({ initial, onSubmit, onCancel }: TemplateFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    subject: initial?.subject ?? '',
    body: initial?.body ?? '',
    category: initial?.category ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Initial Outreach"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g. Follow-up, Introduction"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
        <input
          name="subject"
          value={form.subject}
          onChange={handleChange}
          required
          placeholder="Hi {{name}}, photography services for your business"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Body *</label>
        <p className="text-xs text-gray-600 mb-1">{VARIABLE_HINT}</p>
        <textarea
          name="body"
          value={form.body}
          onChange={handleChange}
          required
          rows={10}
          placeholder={`Hi {{name}},\n\nI came across your business and thought my photography services might be a great fit...\n\nBest,\n[Your Name]`}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
        />
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
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : initial?._id ? 'Update Template' : 'Save Template'}
        </button>
      </div>
    </form>
  );
}
