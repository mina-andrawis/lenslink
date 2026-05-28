import { useState } from 'react';
import type { Shoot, ShootType } from '@/types';
import { SHOOT_TYPES, PAYMENT_STATUSES } from '@/types';

interface Props {
  initial?: Partial<Shoot>;
  onSubmit: (data: Partial<Shoot>) => Promise<void>;
  onCancel: () => void;
}

const CONTRACT_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
  { value: '', label: 'N/A' },
];

export default function ShootForm({ initial = {}, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    shootId: initial.shootId ?? '',
    date: initial.date ? initial.date.slice(0, 10) : '',
    contactName: initial.contactName ?? '',
    companyName: initial.companyName ?? '',
    type: initial.type ?? ('' as ShootType | ''),
    contractSigned: initial.contractSigned === true ? 'true' : initial.contractSigned === false ? 'false' : '',
    shootDuration: initial.shootDuration?.toString() ?? '',
    editingTime: initial.editingTime?.toString() ?? '',
    feeCharged: initial.feeCharged?.toString() ?? '',
    paymentStatus: initial.paymentStatus ?? 'unpaid',
    paymentMethod: initial.paymentMethod ?? '',
    paymentDate: initial.paymentDate ? initial.paymentDate.slice(0, 10) : '',
    deliverByDate: initial.deliverByDate ? initial.deliverByDate.slice(0, 10) : '',
    deliveryLink: initial.deliveryLink ?? '',
    notes: initial.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const effectiveRate = (() => {
    const fee = parseFloat(form.feeCharged);
    const shoot = parseFloat(form.shootDuration);
    const edit = parseFloat(form.editingTime);
    const totalHours = (isNaN(shoot) ? 0 : shoot) + (isNaN(edit) ? 0 : edit);
    if (!fee || !totalHours) return null;
    return (fee / totalHours).toFixed(2);
  })();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        shootId: form.shootId,
        date: form.date,
        contactName: form.contactName,
        companyName: form.companyName || undefined,
        type: form.type as ShootType,
        contractSigned: form.contractSigned === 'true' ? true : form.contractSigned === 'false' ? false : null,
        shootDuration: form.shootDuration ? parseFloat(form.shootDuration) : undefined,
        editingTime: form.editingTime ? parseFloat(form.editingTime) : undefined,
        feeCharged: form.feeCharged ? parseFloat(form.feeCharged) : 0,
        paymentStatus: form.paymentStatus as Shoot['paymentStatus'],
        paymentMethod: form.paymentMethod || undefined,
        paymentDate: form.paymentDate || undefined,
        deliverByDate: form.deliverByDate || undefined,
        deliveryLink: form.deliveryLink || undefined,
        notes: form.notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Shoot ID</label>
          <input className={inputCls} value={form.shootId} onChange={(e) => set('shootId', e.target.value)} placeholder="S-0016" required />
        </div>
        <div>
          <label className={labelCls}>Date *</label>
          <input type="date" className={inputCls} value={form.date} onChange={(e) => set('date', e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Contact Name *</label>
          <input className={inputCls} value={form.contactName} onChange={(e) => set('contactName', e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Company Name</label>
          <input className={inputCls} value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Shoot Type *</label>
          <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)} required>
            <option value="">Select type…</option>
            {SHOOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Contract Signed?</label>
          <select className={inputCls} value={form.contractSigned} onChange={(e) => set('contractSigned', e.target.value)}>
            {CONTRACT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Shoot Duration (hrs)</label>
          <input type="number" step="0.25" min="0" className={inputCls} value={form.shootDuration} onChange={(e) => set('shootDuration', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Editing Time (hrs)</label>
          <input type="number" step="0.25" min="0" className={inputCls} value={form.editingTime} onChange={(e) => set('editingTime', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Effective Rate</label>
          <div className={`${inputCls} bg-gray-50 text-gray-700`}>
            {effectiveRate ? `$${effectiveRate}/hr` : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Fee Charged ($)</label>
          <input type="number" step="0.01" min="0" className={inputCls} value={form.feeCharged} onChange={(e) => set('feeCharged', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Payment Status</label>
          <select className={inputCls} value={form.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value)}>
            {PAYMENT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Payment Method</label>
          <input className={inputCls} value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)} placeholder="Venmo, Zelle…" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Payment Date</label>
          <input type="date" className={inputCls} value={form.paymentDate} onChange={(e) => set('paymentDate', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Deliver By</label>
          <input type="date" className={inputCls} value={form.deliverByDate} onChange={(e) => set('deliverByDate', e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Delivery Link</label>
        <input type="url" className={inputCls} value={form.deliveryLink} onChange={(e) => set('deliveryLink', e.target.value)} placeholder="https://photoswithmina.pixieset.com/…" />
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea rows={2} className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Save Shoot'}
        </button>
      </div>
    </form>
  );
}
