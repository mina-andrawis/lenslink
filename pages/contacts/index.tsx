import { useEffect, useState, useCallback } from 'react';
import { PlusIcon, Squares2X2Icon, ListBulletIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import Modal from '@/components/ui/Modal';
import ContactForm from '@/components/contacts/ContactForm';
import PipelineBoard from '@/components/contacts/PipelineBoard';
import { StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import type { Contact } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';

type ViewMode = 'pipeline' | 'list';

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('pipeline');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

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

  return (
    <AuthGuard>
      <Layout>
        <div className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
              <p className="text-sm text-gray-700">{contacts.length} total</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Contact
            </button>
          </div>

          {/* Controls */}
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
            <PipelineBoard contacts={contacts} />
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
                  {contacts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-600">
                        No contacts found. Add your first one!
                      </td>
                    </tr>
                  )}
                  {contacts.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.businessName ?? '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {c.followUpDate ? format(new Date(c.followUpDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/contacts/${c._id}`} className="text-xs text-indigo-600 hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Contact">
          <ContactForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      </Layout>
    </AuthGuard>
  );
}
