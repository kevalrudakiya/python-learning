import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { ShieldCheck, Lock, Eye, Trash2, Ban, CheckCircle2 } from 'lucide-react';

export default function PrivacyCenterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

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
        if (data?.user) setUser(data.user);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      <Head>
        <title>Privacy Center | Smart Tracker</title>
      </Head>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar
            title="Privacy Center & Transparency Guarantees"
            subtitle="Understand our 100% consent-based location principles and data retention rules"
          />

          <main className="p-8 space-y-8 max-w-5xl mx-auto w-full">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white p-8 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold">Smart Tracker Privacy Commitment</h2>
                  <p className="text-xs text-sky-200">Zero Silent Tracking • Voluntary Recipient Consent Only</p>
                </div>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                Smart Tracker is designed strictly as an authorized, consent-first location sharing system for legitimate business operations, logistics verification, and temporary site safety. We enforce zero background surveillance or silent tracking.
              </p>
            </div>

            {/* Core Privacy Guarantees */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">1. Explicit Consent Required</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Opening an image alone will NEVER trigger location collection. Geolocation (`navigator.geolocation.watchPosition`) begins ONLY after the recipient reads the disclosure and explicitly presses <strong>“SHARE MY LOCATION”</strong>.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Ban className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">2. Instant Recipient Revocation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The recipient can press <strong>“STOP SHARING LOCATION”</strong> on their screen at any second. Once pressed, the location watcher is immediately destroyed and no further coordinates are transmitted.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">3. Automatic Session Expiry</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every share session has a strict, hard-coded expiry duration (e.g. 1 hour, 6 hours, 24 hours). Once expired, the backend instantly rejects all incoming telemetry.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">4. Configured Data Retention</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Detailed GPS location points are automatically purged from the database after the configured retention period (default 30 days). No perpetual location logs are kept.
                </p>
              </div>
            </div>

            {/* Anti-Abuse Rules Section */}
            <div className="bg-slate-900 text-slate-100 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
                <span>Anti-Abuse & Non-Surveillance Policy</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1">
                  <p className="font-bold text-rose-300">🚫 Forbidden: Hidden Tracking Pixels</p>
                  <p className="text-[11px] text-slate-400">
                    We strictly prohibit embedding EXIF or invisible tracking pixels inside raw image files.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1">
                  <p className="font-bold text-rose-300">🚫 Forbidden: Deceptive Messaging</p>
                  <p className="text-[11px] text-slate-400">
                    Senders must not use misleading texts like "Open image to claim prize" when requesting location.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
