import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { FileText, ShieldCheck, User, Calendar, Tag } from 'lucide-react';

export default function AuditLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
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
          if (data.user.role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
            return;
          }
          setUser(data.user);
          fetchLogs();
        }
      });
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const d = await res.json();
        setLogs(d.logs);
      }
    } catch (err) {
      console.error('Fetch logs error:', err);
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
        <title>Audit Logs | Smart Tracker</title>
      </Head>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar
            title="System Security Audit Trail"
            subtitle="Immutable audit log of all logins, session creations, link opens, and consent events"
          />

          <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">System Activity Audit Log</h3>
                <p className="text-xs text-slate-500">Note: Audit logs store zero precise GPS coordinate history</p>
              </div>

              {logs.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">No audit logs recorded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">Timestamp</th>
                        <th className="px-6 py-3.5">Action Event</th>
                        <th className="px-6 py-3.5">Entity Type & ID</th>
                        <th className="px-6 py-3.5">Triggered By</th>
                        <th className="px-6 py-3.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 text-slate-500 font-mono">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-mono">
                              {log.action}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800">{log.entityType}</span>
                            {log.entityId && (
                              <span className="text-[10px] text-slate-400 block font-mono">ID: {log.entityId}</span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {log.user ? (
                              <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{log.user.name} ({log.user.role})</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Recipient / Anonymous</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate font-mono text-[11px]">
                            {log.details || '-'}
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
