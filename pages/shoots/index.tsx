import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  PlusIcon, PencilIcon, TrashIcon, LinkIcon,
  ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import Modal from '@/components/ui/Modal';
import ShootForm from '@/components/shoots/ShootForm';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { SHOOT_TYPES, PAYMENT_STATUSES } from '@/types';
import type { Shoot } from '@/types';
import toast from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────────────────

function calcEffectiveRate(s: Shoot): number | null {
  const total = (s.shootDuration ?? 0) + (s.editingTime ?? 0);
  if (!s.feeCharged || !total) return null;
  return s.feeCharged / total;
}

function fmtRate(s: Shoot): string {
  const r = calcEffectiveRate(s);
  return r != null ? `$${r.toFixed(2)}/hr` : '—';
}

const PAYMENT_COLORS: Record<string, string> = {
  paid:    'bg-green-100 text-green-700',
  trade:   'bg-purple-100 text-purple-700',
  pending: 'bg-amber-100 text-amber-700',
  unpaid:  'bg-red-100 text-red-700',
};

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Paid', trade: 'Trade', pending: 'Pending', unpaid: 'Unpaid',
};

type SortKey = 'date' | 'contactName' | 'type' | 'feeCharged' | 'effectiveRate';
type SortDir = 'asc' | 'desc';

function sortShoots(shoots: Shoot[], key: SortKey, dir: SortDir): Shoot[] {
  return [...shoots].sort((a, b) => {
    let av: number | string, bv: number | string;
    if (key === 'date') {
      av = new Date(a.date).getTime();
      bv = new Date(b.date).getTime();
    } else if (key === 'feeCharged') {
      av = a.feeCharged ?? 0;
      bv = b.feeCharged ?? 0;
    } else if (key === 'effectiveRate') {
      av = calcEffectiveRate(a) ?? -1;
      bv = calcEffectiveRate(b) ?? -1;
    } else {
      av = (a[key] ?? '').toString().toLowerCase();
      bv = (b[key] ?? '').toString().toLowerCase();
    }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

// ── sub-components ────────────────────────────────────────────────────────────

function SortHeader({
  label, sortKey, current, dir, onSort, className = '',
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void; className?: string;
}) {
  const active = current === sortKey;
  return (
    <th
      className={`cursor-pointer select-none px-4 py-3 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="flex flex-col">
          <ChevronUpIcon  className={`h-2.5 w-2.5 ${active && dir === 'asc'  ? 'text-indigo-600' : 'text-gray-300'}`} />
          <ChevronDownIcon className={`h-2.5 w-2.5 ${active && dir === 'desc' ? 'text-indigo-600' : 'text-gray-300'}`} />
        </span>
      </span>
    </th>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function ShootsPage() {
  const { user } = useAuth();
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Shoot | null>(null);

  // sort
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const load = async () => {
    if (!user) return;
    const data = await apiFetch<Shoot[]>('/api/shoots', user);
    setShoots(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s: Shoot) => { setEditing(s); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (data: Partial<Shoot>) => {
    if (!user) return;
    try {
      if (editing) {
        await apiFetch(`/api/shoots/${editing._id}`, user, { method: 'PUT', body: JSON.stringify(data) });
        toast.success('Shoot updated');
      } else {
        await apiFetch('/api/shoots', user, { method: 'POST', body: JSON.stringify(data) });
        toast.success('Shoot added');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (shoot: Shoot) => {
    if (!user || !confirm(`Delete shoot ${shoot.shootId}?`)) return;
    try {
      await apiFetch(`/api/shoots/${shoot._id}`, user, { method: 'DELETE' });
      toast.success('Shoot deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = useMemo(() => {
    let result = shoots;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.contactName.toLowerCase().includes(q) || (s.companyName ?? '').toLowerCase().includes(q)
      );
    }
    if (filterType) result = result.filter((s) => s.type === filterType);
    if (filterPayment) result = result.filter((s) => s.paymentStatus === filterPayment);
    return sortShoots(result, sortKey, sortDir);
  }, [shoots, search, filterType, filterPayment, sortKey, sortDir]);

  const totalRevenue = shoots.reduce((sum, s) => sum + (s.feeCharged ?? 0), 0);
  const paidShoots = shoots.filter((s) => s.paymentStatus === 'paid');
  const hasFilters = search || filterType || filterPayment;

  const selectCls = 'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <AuthGuard>
      <Layout>
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shoots</h1>
              <p className="text-sm text-gray-700">
                {shoots.length} total · {paidShoots.length} paid · ${totalRevenue.toLocaleString()} revenue
              </p>
            </div>
            <button onClick={openNew} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add Shoot</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          {/* Filter bar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                placeholder="Search client…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40 sm:w-48"
              />
            </div>

            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectCls}>
              <option value="">All types</option>
              {SHOOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className={selectCls}>
              <option value="">All payments</option>
              {PAYMENT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>

            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setFilterType(''); setFilterPayment(''); }}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            {hasFilters && (
              <span className="text-sm text-gray-600">{filtered.length} of {shoots.length}</span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-600">
              {hasFilters ? 'No shoots match your filters.' : 'No shoots yet. Add your first one.'}
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {filtered.map((s) => (
                  <div key={s._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{s.contactName}</p>
                        {s.companyName && <p className="text-xs text-gray-600">{s.companyName}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => openEdit(s)} className="text-gray-500 hover:text-indigo-600">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(s)} className="text-gray-500 hover:text-red-500">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-600">{format(new Date(s.date), 'MMM d, yyyy')}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-700">{s.type}</span>
                      {s.paymentStatus && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_COLORS[s.paymentStatus] ?? ''}`}>
                          {PAYMENT_LABELS[s.paymentStatus]}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="font-medium text-gray-900">
                        {s.feeCharged ? `$${s.feeCharged.toLocaleString()}` : '—'}
                      </span>
                      <span className="text-gray-600 text-xs">{fmtRate(s)}</span>
                      {s.deliveryLink && (
                        <a href={s.deliveryLink} target="_blank" rel="noreferrer" className="ml-auto text-indigo-500">
                          <LinkIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                      <th className="px-4 py-3">ID</th>
                      <SortHeader label="Date"      sortKey="date"          current={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortHeader label="Client"    sortKey="contactName"   current={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortHeader label="Type"      sortKey="type"          current={sortKey} dir={sortDir} onSort={handleSort} />
                      <th className="px-4 py-3">Contract</th>
                      <th className="px-4 py-3 text-right">Shoot Hrs</th>
                      <th className="px-4 py-3 text-right">Edit Hrs</th>
                      <SortHeader label="Fee"       sortKey="feeCharged"    current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                      <SortHeader label="Eff. Rate" sortKey="effectiveRate" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Deliver By</th>
                      <th className="px-4 py-3">Link</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((s) => (
                      <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.shootId}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                          {format(new Date(s.date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{s.contactName}</p>
                          {s.companyName && <p className="text-xs text-gray-600">{s.companyName}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{s.type}</td>
                        <td className="px-4 py-3 text-center">
                          {s.contractSigned === true ? '✓' : s.contractSigned === false ? '✗' : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {s.shootDuration ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {s.editingTime ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {s.feeCharged ? `$${s.feeCharged.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{fmtRate(s)}</td>
                        <td className="px-4 py-3">
                          {s.paymentStatus && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_COLORS[s.paymentStatus] ?? ''}`}>
                              {PAYMENT_LABELS[s.paymentStatus] ?? s.paymentStatus}
                              {s.paymentMethod ? ` · ${s.paymentMethod}` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-xs">
                          {s.deliverByDate ? format(new Date(s.deliverByDate), 'MMM d') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {s.deliveryLink && (
                            <a href={s.deliveryLink} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700">
                              <LinkIcon className="h-4 w-4" />
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(s)} className="text-gray-600 hover:text-indigo-600 transition-colors">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(s)} className="text-gray-600 hover:text-red-500 transition-colors">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <Modal
          open={modalOpen}
          onClose={closeModal}
          title={editing ? `Edit ${editing.shootId}` : 'Add Shoot'}
        >
          <ShootForm
            initial={editing ?? {}}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      </Layout>
    </AuthGuard>
  );
}
