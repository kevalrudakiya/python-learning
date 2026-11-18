import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { LiveMap } from '@/components/LiveMap';
import { calculateTotalRouteDistance, formatDistance, formatDuration } from '@/lib/geo';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Navigation,
  ShieldCheck,
  Ban,
  Trash2,
  Share2,
  Compass,
  Zap,
} from 'lucide-react';

export default function TrackingDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [locationPoints, setLocationPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((d) => {
        if (d?.user) setUser(d.user);
      });
  }, []);

  const fetchSessionDetail = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const res = await fetch(`/api/tracking-sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setLocationPoints(data.session.locationPoints || []);
      }
    } catch (err) {
      console.error('Fetch session detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchSessionDetail();

    // Setup Socket.IO listener for real-time location stream
    const socket = io();
    socket.emit('join_session', id);

    socket.on('location_broadcast', (point: any) => {
      console.log('[Dashboard Socket] Received live position point:', point);
      setLocationPoints((prev) => [...prev, point]);
      setSession((prev: any) => (prev ? { ...prev, status: 'TRACKING_ACTIVE' } : prev));
    });

    socket.on('tracking_stopped', () => {
      setSession((prev: any) => (prev ? { ...prev, status: 'TRACKING_STOPPED' } : prev));
    });

    return () => {
      socket.emit('leave_session', id);
      socket.disconnect();
    };
  }, [id]);

  const handleStopSession = async () => {
    if (!confirm('Are you sure you want to stop this tracking session?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tracking-sessions/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      if (res.ok) {
        fetchSessionDetail();
      }
    } catch (err) {
      console.error('Stop session error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!confirm('Permanently delete this tracking session and location history?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tracking-sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/tracking');
      }
    } catch (err) {
      console.error('Delete session error:', err);
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">
        <div className="text-center space-y-2">
          <Zap className="w-8 h-8 text-sky-600 animate-bounce mx-auto" />
          <p className="font-semibold text-sm">Loading Live Map Telemetry...</p>
        </div>
      </div>
    );
  }

  const latestPoint = locationPoints[locationPoints.length - 1];
  const distanceKm = calculateTotalRouteDistance(locationPoints);

  return (
    <>
      <Head>
        <title>Live Map - {session.recipientLabel} | Smart Tracker</title>
      </Head>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar
            title={`Session: ${session.publicSessionId}`}
            subtitle={`Target Recipient: ${session.recipientLabel}`}
            activeCount={session.status === 'TRACKING_ACTIVE' ? 1 : 0}
          />

          <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
            {/* Navigation & Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Link
                href="/tracking"
                className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Tracking Sessions</span>
              </Link>

              <div className="flex items-center space-x-3">
                {session.status === 'TRACKING_ACTIVE' && (
                  <button
                    onClick={handleStopSession}
                    disabled={actionLoading}
                    className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Stop Session</span>
                  </button>
                )}

                <button
                  onClick={handleDeleteSession}
                  disabled={actionLoading}
                  className="inline-flex items-center space-x-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Status Summary Banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <img
                  src={session.image?.fileUrl || '/samples/sample-blueprint.jpg'}
                  alt="Preview"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-slate-900">{session.recipientLabel}</h2>
                    <StatusBadge status={session.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <strong>Image:</strong> {session.image?.title} • <strong>Purpose:</strong> {session.purpose || 'Verification'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px]">Created</span>
                  <span className="font-bold text-slate-800">{new Date(session.createdAt).toLocaleTimeString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px]">Expires At</span>
                  <span className="font-bold text-slate-800">{new Date(session.expiresAt).toLocaleTimeString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px]">Distance</span>
                  <span className="font-bold text-sky-600">{formatDistance(distanceKm)}</span>
                </div>
              </div>
            </div>

            {/* Main Interactive Map & Telemetry Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
              {/* Map Container (Takes 2 columns) */}
              <div className="lg:col-span-2 h-full">
                <LiveMap
                  locationPoints={locationPoints}
                  recipientLabel={session.recipientLabel}
                  isTrackingActive={session.status === 'TRACKING_ACTIVE'}
                />
              </div>

              {/* Side Telemetry & Consent Audit Panel */}
              <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h3 className="font-bold text-base text-white flex items-center space-x-2">
                      <Navigation className="w-5 h-5 text-sky-400" />
                      <span>Live Telemetry</span>
                    </h3>
                    {session.status === 'TRACKING_ACTIVE' && (
                      <span className="flex items-center space-x-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 animate-pulse">
                        ● Streaming
                      </span>
                    )}
                  </div>

                  {/* Current Coordinates Box */}
                  {latestPoint ? (
                    <div className="space-y-4">
                      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Latest Position</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 block">Latitude</span>
                            <span className="font-mono font-bold text-sky-300 text-sm">{latestPoint.latitude.toFixed(6)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Longitude</span>
                            <span className="font-mono font-bold text-sky-300 text-sm">{latestPoint.longitude.toFixed(6)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Accuracy Radius</span>
                          <span className="font-bold text-white">±{Math.round(latestPoint.accuracy)} meters</span>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Last Update</span>
                          <span className="font-bold text-emerald-400">
                            {new Date(latestPoint.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-800/50 rounded-xl text-center text-slate-400 text-xs border border-slate-800 space-y-2">
                      <Clock className="w-6 h-6 text-slate-500 mx-auto" />
                      <p className="font-semibold text-slate-300">Awaiting Geolocation Data</p>
                      <p className="text-[11px] text-slate-500">
                        Recipient must open link and press "Share My Location".
                      </p>
                    </div>
                  )}

                  {/* Route & Session Stats */}
                  <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
                    <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Session Audit</p>
                    <div className="flex justify-between py-1 text-slate-400 border-b border-slate-800/50">
                      <span>Total GPS Points:</span>
                      <span className="font-bold text-white">{locationPoints.length}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-400 border-b border-slate-800/50">
                      <span>Link Opened:</span>
                      <span className="font-bold text-white">
                        {session.openedAt ? new Date(session.openedAt).toLocaleTimeString() : 'Not Opened'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-400">
                      <span>Consent Granted:</span>
                      <span className="font-bold text-emerald-400">
                        {session.consentAt ? new Date(session.consentAt).toLocaleTimeString() : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Privacy Rule Disclaimer Footer */}
                <div className="pt-4 border-t border-slate-800 flex items-center space-x-2 text-[10px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Consensual Geolocation Stream • Recipient can stop sharing anytime.</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
