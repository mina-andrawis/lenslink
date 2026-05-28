import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  UsersIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import { StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import type { Contact, Campaign } from '@/types';

interface DashboardData {
  totalContacts: number;
  statusMap: Record<string, number>;
  overdueFollowups: Contact[];
  upcomingFollowups: Contact[];
  recentCampaigns: Campaign[];
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<DashboardData>('/api/dashboard', user)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AuthGuard>
      <Layout>
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : data ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard icon={UsersIcon} label="Total Contacts" value={data.totalContacts} color="bg-indigo-500" />
                <StatCard icon={CheckCircleIcon} label="Booked" value={data.statusMap['booked'] ?? 0} color="bg-green-500" />
                <StatCard icon={EnvelopeIcon} label="Proposals Sent" value={data.statusMap['proposal_sent'] ?? 0} color="bg-amber-500" />
                <StatCard icon={ExclamationCircleIcon} label="Overdue Follow-ups" value={data.overdueFollowups.length} color={data.overdueFollowups.length > 0 ? 'bg-red-500' : 'bg-gray-400'} />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b px-5 py-4">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
                      Overdue Follow-ups
                    </h2>
                    <Link href="/contacts" className="text-xs text-indigo-600 hover:underline">View all</Link>
                  </div>
                  <ul className="divide-y">
                    {data.overdueFollowups.length === 0 && (
                      <li className="px-5 py-6 text-center text-sm text-gray-400">All caught up!</li>
                    )}
                    {data.overdueFollowups.map((c) => (
                      <li key={c._id}>
                        <Link href={`/contacts/${c._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={c.status} />
                            <p className="mt-1 text-xs text-red-500">
                              Due {c.followUpDate ? format(new Date(c.followUpDate), 'MMM d') : '—'}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b px-5 py-4">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-indigo-500" />
                      Upcoming (7 days)
                    </h2>
                    <Link href="/contacts" className="text-xs text-indigo-600 hover:underline">View all</Link>
                  </div>
                  <ul className="divide-y">
                    {data.upcomingFollowups.length === 0 && (
                      <li className="px-5 py-6 text-center text-sm text-gray-400">Nothing scheduled</li>
                    )}
                    {data.upcomingFollowups.map((c) => (
                      <li key={c._id}>
                        <Link href={`/contacts/${c._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={c.status} />
                            <p className="mt-1 text-xs text-indigo-500">
                              {c.followUpDate ? format(new Date(c.followUpDate), 'MMM d') : '—'}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {data.recentCampaigns.length > 0 && (
                <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b px-5 py-4">
                    <h2 className="font-semibold text-gray-900">Recent Campaigns</h2>
                    <Link href="/outreach" className="text-xs text-indigo-600 hover:underline">View all</Link>
                  </div>
                  <ul className="divide-y">
                    {data.recentCampaigns.map((c) => (
                      <li key={c._id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.subject}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-medium ${
                            c.status === 'sent' ? 'text-green-600' :
                            c.status === 'failed' ? 'text-red-500' :
                            c.status === 'sending' ? 'text-amber-500' : 'text-gray-400'
                          }`}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </span>
                          {c.status === 'sent' && (
                            <p className="text-xs text-gray-400">{c.stats.sent}/{c.stats.total} sent</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Failed to load dashboard data.</p>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}
