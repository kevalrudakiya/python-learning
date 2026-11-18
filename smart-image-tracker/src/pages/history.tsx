import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDistance, formatDuration } from '@/lib/geo';
import { History as HistoryIcon, MapPin, Calendar, Clock, ShieldCheck, ExternalLink } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [retentionDays, setRetentionDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          fetchHistory();
        }
      });
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.history);
        setRetentionDays(data.retentionDays);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      <Head>
        <title>Location History | Smart Tracker</title>
      </Head>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar
            title="Location History & Timeline"
            subtitle={`Authorized tracking history (Auto-purged after ${retentionDays} days retention policy)`}
          />

          <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            {/* Banner */}
            <div className="bg-gradient-to-r from-navy-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white shadow-lg flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-bold flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                  <span>Privacy Data Retention Enforced</span>
                </h2>
                <p className="text-xs text-slate-300">
                  Detailed location points are automatically deleted after {retentionDays} days to guarantee recipient privacy.
                </p>
              </div>
              <Link
                href="/privacy"
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0"
              >
                Privacy Policy
              </Link>
            </div>

            {/* History Records Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Historical Tracking Records</h3>
                <p className="text-xs text-slate-500">Summary of consented movements and distance statistics</p>
              </div>

              {historyItems.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <HistoryIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">No historical tracking records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Session ID & Image</th>
                        <th className="px-6 py-3.5">Recipient</th>
                        <th className="px-6 py-3.5">Consent Status</th>
                        <th className="px-6 py-3.5">Points Recorded</th>
                        <th className="px-6 py-3.5">Distance Travelled</th>
                        <th className="px-6 py-3.5">Tracking Duration</th>
                        <th className="px-6 py-3.5 text-right">View Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {historyItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={item.imageFileUrl || '/samples/sample-blueprint.jpg'}
                                alt="Image"
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm"
                              />
                              <div>
                                <p className="font-bold text-slate-900 text-sm truncate max-w-[160px]">{item.imageTitle}</p>
                                <span className="font-mono text-[11px] text-sky-600 font-semibold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                  {item.publicSessionId}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-bold text-slate-900">{item.recipientLabel}</td>

                          <td className="px-6 py-4">
                            <StatusBadge status={item.status} />
                          </td>

                          <td className="px-6 py-4 font-bold text-slate-800">{item.pointCount} GPS Points</td>

                          <td className="px-6 py-4 font-bold text-sky-600">{formatDistance(item.distanceKm)}</td>

                          <td className="px-6 py-4 text-slate-500">{formatDuration(item.durationSeconds)}</td>

                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/tracking/${item.id}`}
                              className="inline-flex items-center space-x-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
