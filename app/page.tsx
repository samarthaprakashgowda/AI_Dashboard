'use client';

import { useState } from 'react';

interface DashboardData {
  totalExpenses: number;
  highestCategory: string;
  overdraftRisk: boolean;
  tips: string[];
}

export default function Home() {
  const [inputLog, setInputLog] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDashboardData = (value: unknown): value is DashboardData => {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as any).totalExpenses === 'number' &&
      typeof (value as any).highestCategory === 'string' &&
      typeof (value as any).overdraftRisk === 'boolean' &&
      Array.isArray((value as any).tips)
    );
  };

  const handleAnalyze = async () => {
    if (!inputLog.trim()) return;
    setLoading(true);
    setData(null);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputLog.trim() }),
      });
      const result = await response.json();

      if (response.ok && isDashboardData(result)) {
        setData(result);
      } else {
        const message =
          result?.error ||
          'Unexpected API response. Please try again.';
        console.error('Invalid analysis response:', result);
        setError(message);
      }
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError('Failed to fetch analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">AI Extraction Dashboard</h1>
          <p className="text-slate-400">Convert messy financial logs into type-safe user interfaces.</p>
        </div>

        {/* Action Panel */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
          <textarea
            className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste a chaotic message here... (e.g., 'Spent 40 bucks on fuel, 20 on food, rent was 1200, balance is down to 10 bucks.')"
            value={inputLog}
            onChange={(e) => setInputLog(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-medium rounded-lg transition"
          >
            {loading ? 'Processing Cloud Models...' : 'Analyze Log'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-700 bg-red-900/20 p-4 text-red-200">
            <strong className="block font-semibold">Unable to analyze log.</strong>
            <p>{error}</p>
          </div>
        )}

        {/* Dynamic Generative Dashboard Grid */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            {/* Metric Card 1 */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</h3>
              <p className="text-3xl font-bold mt-2 text-emerald-400">${data.totalExpenses.toFixed(2)}</p>
            </div>

            {/* Metric Card 2 */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Top Category</h3>
              <p className="text-3xl font-bold mt-2 text-blue-400 capitalize">{data.highestCategory}</p>
            </div>

            {/* Metric Card 3 */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Risk Status</h3>
              <div className="mt-2">
                {data.overdraftRisk ? (
                  <span className="px-3 py-1 bg-red-900/50 text-red-400 border border-red-700 text-sm rounded-full font-bold">CRITICAL OVERDRAFT RISK</span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-900/50 text-emerald-400 border border-emerald-700 text-sm rounded-full font-bold">ACCOUNT HEALTHY</span>
                )}
              </div>
            </div>

            {/* AI Generated Insights Section */}
            <div className="md:col-span-3 bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-md font-semibold text-slate-200 mb-4">Cloud-Generated Financial Strategy</h3>
              <ul className="space-y-2">
                {data.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-blue-500 font-bold">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}