import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Settings, Save, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    defaultDurationMinutes: 60,
    maxDurationMinutes: 1440,
    locationRetentionDays: 30,
    imageRetentionDays: 90,
    maxFileSizeMb: 10,
    allowQrSharing: true,
    allowWhatsappSharing: true,
    enable2FA: false,
    mapProvider: 'OpenStreetMap',
    privacyPolicyText: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
          if (data.user.role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
            return;
          }
          setUser(data.user);
          fetchSettings();
        }
      });
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const d = await res.json();
        setSettings(d.settings);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to save settings');
      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Save error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      <Head>
        <title>Admin Settings | Smart Tracker</title>
      </Head>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar
            title="Admin System Settings"
            subtitle="Configure default tracking durations, retention policies, and security parameters"
          />

          <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
            {message && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
              {/* Duration & Retention Parameters */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">Session & Retention Parameters</h3>
                  <p className="text-xs text-slate-500">Configure global limits and automated data purging schedules</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Default Tracking Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.defaultDurationMinutes}
                      onChange={(e) => setSettings({ ...settings, defaultDurationMinutes: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maximum Session Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.maxDurationMinutes}
                      onChange={(e) => setSettings({ ...settings, maxDurationMinutes: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Location Retention Period (Days)
                    </label>
                    <input
                      type="number"
                      value={settings.locationRetentionDays}
                      onChange={(e) => setSettings({ ...settings, locationRetentionDays: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Max Upload File Size (MB)
                    </label>
                    <input
                      type="number"
                      value={settings.maxFileSizeMb}
                      onChange={(e) => setSettings({ ...settings, maxFileSizeMb: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">Feature Toggles & Sharing Options</h3>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowQrSharing}
                      onChange={(e) => setSettings({ ...settings, allowQrSharing: e.target.checked })}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Enable QR Code Link Sharing</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowWhatsappSharing}
                      onChange={(e) => setSettings({ ...settings, allowWhatsappSharing: e.target.checked })}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Enable Direct WhatsApp Share Template</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </>
  );
}
