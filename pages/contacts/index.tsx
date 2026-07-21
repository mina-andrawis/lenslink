import { useEffect, useState, useCallback } from 'react';
import {
  PlusIcon, Squares2X2Icon, ListBulletIcon, MagnifyingGlassIcon,
  EnvelopeIcon, PhoneIcon, GlobeAltIcon, ArrowUpTrayIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import Modal from '@/components/ui/Modal';
import ContactForm from '@/components/contacts/ContactForm';
import CsvImportModal from '@/components/contacts/CsvImportModal';
import PipelineBoard from '@/components/contacts/PipelineBoard';
import { StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import type { Contact, ContactStatus } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

type ViewMode = 'pipeline' | 'list';
type Tab = 'clients' | 'past_clients' | 'network';

function PhotographerCard({ p }: { p: Contact }) {
  const handle = p.instagram
    ? (p.instagram.startsWith('@') ? p.instagram : `@${p.instagram}`)
    : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <Link href={`/contacts/${p._id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
              {p.name}
            </Link>
            {p.specialty && (
              <p className="text-xs text-indigo-600 mt-0.5">{p.specialty}</p>
            )}
          </div>
          {p.city && (
            <span className="ml-2 flex-shrink-0 text-xs text-gray-500">{p.city}</span>
          )}
        </div>

        <div className="space-y-1.5 text-sm">
          {handle && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-gray-400 font-medium text-xs">IG</span>
              <a
                href={`https://instagram.com/${handle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {handle}
              </a>
            </div>
          )}
          {p.website && (
            <div className="flex items-center gap-2 text-gray-600">
              <GlobeAltIcon className="h-3.5 w-3.5 flex-shrink-0" />
              <a
                href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {p.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <EnvelopeIcon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{p.email}</span>
          </div>
          {p.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <PhoneIcon className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{p.phone}</span>
            </div>
          )}
        </div>

        {p.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {p.tags.map((t) => (
              <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t}</span>
            ))}
          </div>
        )}

        {p.notes && (
          <p className="mt-3 text-xs text-gray-500 line-clamp-2">{p.notes}</p>
        )}

        {p.lastContactedAt && (
          <p className="mt-2 text-xs text-gray-400">
            Last contacted {format(new Date(p.lastContactedAt), 'MMM d, yyyy')}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('clients');
  const [view, setView] = useState<ViewMode>('pipeline');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await apiFetch<Contact[]>(`/api/contacts${params}`, user);
    setContacts(data);
  }, [user, search]);

  useEffect(() => {
    setLoading(true);
    fetchContacts().finally(() => setLoading(false));
  }, [fetchContacts]);

  const handleAdd = async (data: Partial<Contact>) => {
    if (!user) return;
    await apiFetch<Contact>('/api/contacts', user, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('Contact added!');
    setShowAdd(false);
    fetchContacts();
  };

  const handleStatusChange = async (contactId: string, newStatus: ContactStatus) => {
    if (!user) return;
    setContacts(prev => prev.map(c => c._id === contactId ? { ...c, status: newStatus } : c));
    try {
      await apiFetch(`/api/contacts/${contactId}`, user, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      toast.error('Failed to update status');
      fetchContacts();
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!user) return;
    setContacts(prev => prev.filter(c => c._id !== contactId));
    try {
      await apiFetch(`/api/contacts/${contactId}`, user, { method: 'DELETE' });
      toast.success('Contact deleted');
    } catch {
      toast.error('Failed to delete contact');
      fetchContacts();
    }
  };

  const nonPhotographers = contacts.filter(c => c.type !== 'photographer');
  const activeClients = nonPhotographers.filter(c => c.status !== 'past_client');
  const pastClients = nonPhotographers.filter(c => c.status === 'past_client');
  const photographers = contacts.filter(c => c.type === 'photographer');

  const tabLabel = tab === 'clients'
    ? `${activeClients.length} active`
    : tab === 'past_clients'
    ? `${pastClients.length} past clients`
    : `${photographers.length} photographers`;

  return (
    <AuthGuard>
      <Layout>
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
              <p className="text-sm text-gray-700">{tabLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                Import CSV
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                {tab === 'network' ? 'Add Photographer' : 'Add Contact'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setTab('clients')}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'clients' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              Pipeline ({activeClients.length})
            </button>
            <button
              onClick={() => setTab('past_clients')}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'past_clients' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              Past Clients ({pastClients.length})
            </button>
            <button
              onClick={() => setTab('network')}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'network' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-700 hover:text-gray-900'
              }`}
            >
              Photographer Network ({photographers.length})
            </button>
          </div>

          {tab === 'clients' && (
            <>
              <div className="mb-5 flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, or business…"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setView('pipeline')}
                    className={`px-3 py-2 ${view === 'pipeline' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                    title="Pipeline view"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`px-3 py-2 ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors`}
                    title="List view"
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
              ) : view === 'pipeline' ? (
                <PipelineBoard contacts={activeClients} onStatusChange={handleStatusChange} onDelete={handleDelete} />
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Name', 'Email', 'Business', 'Status', 'Follow-up', ''].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activeClients.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-600">
                            No contacts found.
                          </td>
                        </tr>
                      )}
                      {activeClients.map((c) => (
                        <tr key={c._id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{c.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{c.businessName ?? '—'}</td>
                          <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {c.followUpDate ? format(new Date(c.followUpDate), 'MMM d, yyyy') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Link href={`/contacts/${c._id}`} className="text-xs text-indigo-600 hover:underline">
                                View
                              </Link>
                              <button
                                onClick={() => handleDelete(c._id)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'past_clients' && (
            loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              </div>
            ) : pastClients.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
                <p className="text-sm text-gray-700">No past clients yet. They'll appear here once marked as Past Client.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Email', 'Business', 'Last Contacted', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pastClients.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{c.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{c.businessName ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {c.lastContactedAt ? format(new Date(c.lastContactedAt), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Link href={`/contacts/${c._id}`} className="text-xs text-indigo-600 hover:underline">
                              View
                            </Link>
                            <button
                              onClick={() => handleDelete(c._id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'network' && (
            loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              </div>
            ) : photographers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
                <p className="text-sm text-gray-700">No photographers yet. Add one to start building your network!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {photographers.map((p) => (
                  <PhotographerCard key={p._id} p={p} />
                ))}
              </div>
            )
          )}
        </div>

        <Modal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          title={tab === 'network' ? 'Add Photographer' : 'Add Contact'}
        >
          <ContactForm
            initial={tab === 'network' ? { type: 'photographer' } : undefined}
            onSubmit={handleAdd}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>

        <CsvImportModal
          open={showImport}
          onClose={() => setShowImport(false)}
          onImported={fetchContacts}
        />
      </Layout>
    </AuthGuard>
  );
}
