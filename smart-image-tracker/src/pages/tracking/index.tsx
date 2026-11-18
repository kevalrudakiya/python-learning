import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { QRCodeModal } from '@/components/QRCodeModal';
import { MapPin, Share2, Plus, Eye, Clock, Ban } from 'lucide-react';

export default function TrackingSessionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedSessionData, setSelectedSessionData] = useState<any>(null);

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
          fetchSessions();
        }
      });
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/tracking-sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Fetch sessions error:', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleOpenQRModal = (session: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/s/${session.secureToken}`;

    setSelectedSessionData({
      shareUrl,
      qrCodeDataUrl: '',
      recipientLabel: session.recipientLabel,
      imageTitle: session.image?.title || 'Shared Image',
    });

    import('@/lib/qr').then(async (qrLib) => {
      const dataUrl = await qrLib.generateQRCodeDataUrl(shareUrl);
      setSelectedSessionData((prev: any) => ({ ...prev, qrCodeDataUrl: dataUrl }));
    });

    setQrModalOpen(true);
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return s.status === 'TRACKING_ACTIVE';
    if (filter === 'STOPPED') return s.status === 'TRACKING_STOPPED';
    if (filter === 'EXPIRED') return s.status === 'EXPIRED';
    return true;
  });

  return (
    <>
      <Head>
        <title>Tracking Sessions | Smart Tracker</title>
      </Head>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar
            title="Tracking Sessions"
            subtitle="View all share links, live recipient locations, and consent statuses"
          />

          <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">All Sessions ({sessions.length})</h2>
                <p className="text-xs text-slate-500">Filtered by consent status and active telemetry</p>
              </div>

              <div className="flex items-center space-x-3">
                {/* Filter Pills */}
                <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center space-x-1 shadow-sm text-xs font-semibold">
                  {['ALL', 'ACTIVE', 'STOPPED', 'EXPIRED'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        filter === f ? 'bg-sky-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <Link
                  href="/images/create"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Session</span>
                </Link>
              </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {filteredSessions.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <MapPin className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">No sessions match filter "{filter}"</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Image & ID</th>
                        <th className="px-6 py-3.5">Recipient</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Duration</th>
                        <th className="px-6 py-3.5">Last Location</th>
                        <th className="px-6 py-3.5">Expires At</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredSessions.map((session) => {
                        const lastPoint = session.locationPoints?.[0];
                        return (
                          <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={session.image?.fileUrl || '/samples/sample-blueprint.jpg'}
                                  alt="Preview"
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm"
                                />
                                <div>
                                  <p className="font-bold text-slate-900 text-sm truncate max-w-[160px]">
                                    {session.image?.title || 'Shared Image'}
                                  </p>
                                  <span className="font-mono text-[11px] text-sky-600 font-semibold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                    {session.publicSessionId}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{session.recipientLabel}</p>
                              {session.purpose && <p className="text-[11px] text-slate-400">{session.purpose}</p>}
                            </td>

                            <td className="px-6 py-4">
                              <StatusBadge status={session.status} />
                            </td>

                            <td className="px-6 py-4 text-slate-600 font-semibold">
                              {session.durationMinutes} Minutes
                            </td>

                            <td className="px-6 py-4">
                              {lastPoint ? (
                                <div>
                                  <p className="text-slate-800 font-bold">
                                    {lastPoint.latitude.toFixed(4)}, {lastPoint.longitude.toFixed(4)}
                                  </p>
                                  <span className="text-[10px] text-emerald-600">
                                    {new Date(lastPoint.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No GPS data</span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-slate-500">
                              {new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>

                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenQRModal(session)}
                                className="inline-flex items-center space-x-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                title="Share QR & Link"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              <Link
                                href={`/tracking/${session.id}`}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Live Map</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {selectedSessionData && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          shareUrl={selectedSessionData.shareUrl}
          qrCodeDataUrl={selectedSessionData.qrCodeDataUrl}
          recipientLabel={selectedSessionData.recipientLabel}
          imageTitle={selectedSessionData.imageTitle}
        />
      )}
    </>
  );
}
