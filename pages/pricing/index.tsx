import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { PRICING_PILLARS, SHOOT_TYPE_TO_PRICING } from '@/lib/pricing-data';
import type { Shoot } from '@/types';

interface RateComparison {
  shootType: string;
  targetRate: number;
  rateLabel?: string;
  avgEffectiveRate: number | null;
  shootCount: number;
}

function buildComparisons(shoots: Shoot[]): RateComparison[] {
  const allRates = PRICING_PILLARS.flatMap((p) => p.rates);
  const grouped: Record<string, number[]> = {};

  for (const s of shoots) {
    const pricingType = SHOOT_TYPE_TO_PRICING[s.type];
    if (!pricingType) continue;
    const totalHrs = (s.shootDuration ?? 0) + (s.editingTime ?? 0);
    if (!totalHrs || !s.feeCharged || s.paymentStatus === 'trade') continue;
    if (!grouped[pricingType]) grouped[pricingType] = [];
    grouped[pricingType].push(s.feeCharged / totalHrs);
  }

  return allRates.map((r) => {
    const rates = grouped[r.shootType] ?? [];
    return {
      shootType: r.shootType,
      targetRate: r.hourlyRate,
      rateLabel: r.rateLabel,
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
        <div className="p-4 md:p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
            <p className="text-sm text-gray-700">Rate reference and comparison against your actual shoots</p>
          </div>

          {/* Pricing pillars */}
          <section>
            <h2 className="font-semibold text-gray-900 mb-3">Rate Pillars</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRICING_PILLARS.map((pillar) => (
                <div key={pillar.name} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="font-semibold text-gray-900">{pillar.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{pillar.description}</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="px-6 py-2">Type</th>
                        <th className="px-6 py-2 text-right whitespace-nowrap">Rate</th>
                        <th className="px-6 py-2 whitespace-nowrap">Delivery</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pillar.rates.map((r) => (
                        <tr key={r.shootType} className="hover:bg-gray-50 align-top">
                          <td className="px-6 py-3">
                            <div className="font-medium text-gray-900">{r.shootType}</div>
                            <div className="text-xs text-gray-500 mt-0.5 leading-snug">{r.notes}</div>
                          </td>
                          <td className="px-6 py-3 text-right font-semibold text-indigo-600 whitespace-nowrap">${r.hourlyRate}/hr</td>
                          <td className="px-6 py-3 text-gray-600 text-xs whitespace-nowrap">{r.deliveryCap}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>

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
                      <td className="px-6 py-3 text-right text-gray-600">{c.rateLabel ?? `$${c.targetRate}/hr`}</td>
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
        </div>
      </Layout>
    </AuthGuard>
  );
}
