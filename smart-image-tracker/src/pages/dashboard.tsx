import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { QRCodeModal } from '@/components/QRCodeModal';
import {
  Image as ImageIcon,
  Radio,
  Clock,
  Ban,
  Eye,
  Plus,
  Share2,
  ExternalLink,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    totalImages: 0,
    activeShareSessions: 0,
    currentlySharingLocation: 0,
    expiredSessions: 0,
    locationSharingStopped: 0,
    totalLinkOpens: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // QRCode modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedSessionData, setSelectedSessionData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const dashRes = await fetch('/api/dashboard');
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setStats(dashData.stats);
        setRecentSessions(dashData.recentSessions);
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleOpenQRModal = (session: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/s/${session.secureToken}`;

    setSelectedSessionData({
      shareUrl,
      qrCodeDataUrl: '', // generated dynamically inside modal or via backend
      recipientLabel: session.recipientLabel,
      imageTitle: session.image?.title || 'Shared Image',
    });

    // fetch QR code
    fetch(`/api/tracking-sessions/${session.id}`)
      .then((r) => r.json())
      .then((d) => {
        // generate frontend QR if needed
        import('@/lib/qr').then(async (qrLib) => {
          const dataUrl = await qrLib.generateQRCodeDataUrl(shareUrl);
          setSelectedSessionData((prev: any) => ({ ...prev, qrCodeDataUrl: dataUrl }));
        });
      });

    setQrModalOpen(true);
  };

  return (
    <>
      <Head>
        <title>Dashboard | Smart Location Share</title>
      </Head>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar
            title="Main Dashboard"
            subtitle="Consent-based image sharing & live location telemetry overview"
            activeCount={stats.currentlySharingLocation}
          />

          <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            {/* Header Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Platform Metrics</h2>
                <p className="text-xs text-slate-500">Real-time statistics for image shares and location sessions</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchData}
                  className="p-2.5 bg-white border border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <Link
                  href="/images/create"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload / Generate Image</span>
                </Link>
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Total Images */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Images</span>
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-slate-900">{stats.totalImages}</span>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Share Sessions</span>
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Share2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-slate-900">{stats.activeShareSessions}</span>
                </div>
              </div>

              {/* Sharing Location Now */}
              <div className="bg-gradient-to-br from-emerald-900 to-teal-950 p-5 rounded-2xl border border-emerald-800 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Sharing Now</span>
                  <div className="p-2 rounded-xl bg-emerald-800/80 text-emerald-300 animate-pulse">
                    <Radio className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-white">{stats.currentlySharingLocation}</span>
                  <span className="text-[10px] text-emerald-400 block font-semibold mt-0.5">Live Telemetry Active</span>
                </div>
              </div>

              {/* Expired Sessions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expired Sessions</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-slate-900">{stats.expiredSessions}</span>
                </div>
              </div>

              {/* Location Stopped */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sharing Stopped</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Ban className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-slate-900">{stats.locationSharingStopped}</span>
                </div>
              </div>

              {/* Total Link Opens */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Link Opens</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-slate-900">{stats.totalLinkOpens}</span>
                </div>
              </div>
            </div>

            {/* Recent Tracking Sessions Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recent Tracking Sessions</h3>
                  <p className="text-xs text-slate-500">Monitor link opens, location consent, and live maps</p>
                </div>
                <Link
                  href="/tracking"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
                >
                  <span>View All Sessions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentSessions.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <MapPin className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">No active tracking sessions found</p>
                  <p className="text-xs text-slate-400 mt-1">Upload an image and create a share session to get started.</p>
                  <Link
                    href="/images/create"
                    className="mt-4 inline-flex items-center space-x-2 bg-sky-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Share Session</span>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Image & Session ID</th>
                        <th className="px-6 py-3.5">Recipient Label</th>
                        <th className="px-6 py-3.5">Created Date</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Last Location Update</th>
                        <th className="px-6 py-3.5">Expiry</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {recentSessions.map((session) => {
                        const lastPoint = session.locationPoints?.[0];
                        return (
                          <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Image Preview & Session ID */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={session.image?.fileUrl || '/samples/sample-blueprint.jpg'}
                                  alt="Preview"
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm"
                                />
                                <div>
                                  <p className="font-bold text-slate-900 text-sm truncate max-w-[180px]">
                                    {session.image?.title || 'Shared Image'}
                                  </p>
                                  <span className="font-mono text-[11px] text-sky-600 font-semibold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                    {session.publicSessionId}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Recipient */}
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800">{session.recipientLabel}</p>
                              {session.purpose && <p className="text-[11px] text-slate-400">{session.purpose}</p>}
                            </td>

                            {/* Created Date */}
                            <td className="px-6 py-4 text-slate-500">
                              {new Date(session.createdAt).toLocaleDateString()} {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <StatusBadge status={session.status} />
                            </td>

                            {/* Last Location Update */}
                            <td className="px-6 py-4">
                              {lastPoint ? (
                                <div>
                                  <p className="text-slate-800 font-semibold">
                                    {lastPoint.latitude.toFixed(4)}, {lastPoint.longitude.toFixed(4)}
                                  </p>
                                  <span className="text-[10px] text-emerald-600">
                                    {new Date(lastPoint.timestamp).toLocaleTimeString()} (±{Math.round(lastPoint.accuracy)}m)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No GPS data yet</span>
                              )}
                            </td>

                            {/* Expiry */}
                            <td className="px-6 py-4 text-slate-500">
                              {new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenQRModal(session)}
                                className="inline-flex items-center space-x-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                title="Share Link & QR Code"
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

      {/* QR Code & Share Link Modal */}
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
