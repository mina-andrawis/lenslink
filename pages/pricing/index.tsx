import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { PRICING_TIERS, SHOOT_TYPE_TO_PRICING } from '@/lib/pricing-data';
import type { Shoot } from '@/types';

interface RateComparison {
  shootType: string;
  targetRate: number;
  avgEffectiveRate: number | null;
  shootCount: number;
}

function buildComparisons(shoots: Shoot[]): RateComparison[] {
  const currentTier = PRICING_TIERS[0];
  const grouped: Record<string, number[]> = {};

  for (const s of shoots) {
    const pricingType = SHOOT_TYPE_TO_PRICING[s.type];
    if (!pricingType) continue;
    const totalHrs = (s.shootDuration ?? 0) + (s.editingTime ?? 0);
    if (!totalHrs || !s.feeCharged || s.paymentStatus === 'trade') continue;
    if (!grouped[pricingType]) grouped[pricingType] = [];
    grouped[pricingType].push(s.feeCharged / totalHrs);
  }

  return currentTier.rates.map((r) => {
    const rates = grouped[r.shootType] ?? [];
    return {
      shootType: r.shootType,
      targetRate: r.hourlyRate,
      avgEffectiveRate: rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : null,
      shootCount: rates.length,
    };
  });
}

function ComparisonBar({ actual, target }: { actual: number; target: number }) {
  const pct = Math.min((actual / target) * 100, 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs text-gray-700">{Math.round(pct)}%</span>
    </div>
  );
}

export default function PricingPage() {
  const { user } = useAuth();
  const [shoots, setShoots] = useState<Shoot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!user) return;
    apiFetch<Shoot[]>('/api/shoots', user)
      .then(setShoots)
      .finally(() => setLoading(false));
  }, [user]);

  const comparisons = buildComparisons(shoots);

  return (
    <AuthGuard>
      <Layout>
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
            <p className="text-sm text-gray-700">Rate reference and comparison against your actual shoots</p>
          </div>

          {/* Rate comparison */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="font-semibold text-gray-900">Your Effective Rate vs. Current Target</h2>
              <p className="text-xs text-gray-600 mt-0.5">Excludes trade/collab shoots. Based on paid shoots with duration recorded.</p>
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                    <th className="px-6 py-3">Shoot Type</th>
                    <th className="px-6 py-3 text-right">Target</th>
                    <th className="px-6 py-3 text-right">Your Avg</th>
                    <th className="px-6 py-3 text-right">Shoots</th>
                    <th className="px-6 py-3 w-48">vs. Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparisons.map((c) => (
                    <tr key={c.shootType} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{c.shootType}</td>
                      <td className="px-6 py-3 text-right text-gray-600">${c.targetRate}/hr</td>
                      <td className="px-6 py-3 text-right font-semibold">
                        {c.avgEffectiveRate != null ? (
                          <span className={c.avgEffectiveRate >= c.targetRate ? 'text-green-600' : 'text-red-500'}>
                            ${c.avgEffectiveRate.toFixed(0)}/hr
                          </span>
                        ) : (
                          <span className="text-gray-300">No data</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-600">{c.shootCount}</td>
                      <td className="px-6 py-3">
                        {c.avgEffectiveRate != null
                          ? <ComparisonBar actual={c.avgEffectiveRate} target={c.targetRate} />
                          : <div className="h-2 rounded-full bg-gray-100" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Tier reference tables */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="font-semibold text-gray-900">Rate Tiers — Reference</h2>
            </div>

            {/* Tier tabs */}
            <div className="flex border-b">
              {PRICING_TIERS.map((tier, i) => (
                <button
                  key={tier.name}
                  onClick={() => setActiveTab(i)}
                  className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === i
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-700 hover:text-gray-700'
                  }`}
                >
                  {tier.name}
                </button>
              ))}
            </div>

            <div className="px-6 py-3 text-xs text-amber-700 bg-amber-50 border-b">
              {PRICING_TIERS[activeTab].trigger}
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                  <th className="px-6 py-3">Shoot Type</th>
                  <th className="px-6 py-3 text-right">Hourly Rate</th>
                  <th className="px-6 py-3">Delivery Cap</th>
                  <th className="px-6 py-3">Target Clients / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {PRICING_TIERS[activeTab].rates.map((r) => (
                  <tr key={r.shootType} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{r.shootType}</td>
                    <td className="px-6 py-3 text-right font-semibold text-indigo-600">${r.hourlyRate}/hr</td>
                    <td className="px-6 py-3 text-gray-700">{r.deliveryCap}</td>
                    <td className="px-6 py-3 text-gray-700">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </Layout>
    </AuthGuard>
  );
}
