import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Image as ImageIcon,
  MapPin,
  History,
  ShieldCheck,
  Settings,
  FileText,
  LogOut,
  Crosshair,
} from 'lucide-react';

interface SidebarProps {
  user?: any;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const router = useRouter();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Image Library', href: '/images', icon: ImageIcon },
    { label: 'Tracking Sessions', href: '/tracking', icon: MapPin },
    { label: 'Location History', href: '/history', icon: History },
    { label: 'Privacy Center', href: '/privacy', icon: ShieldCheck },
  ];

  if (user?.role === 'SUPER_ADMIN') {
    navItems.push(
      { label: 'Admin Settings', href: '/settings', icon: Settings },
      { label: 'Audit Logs', href: '/admin/logs', icon: FileText }
    );
  }

  return (
    <aside className="w-64 bg-navy-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
          <Crosshair className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-base leading-tight">Smart Tracker</h1>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/50">
            Consent Platform
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 font-semibold'
                  : 'hover:bg-slate-800/80 hover:text-white text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-navy-950/50">
        <div className="flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Authorized User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || 'user@smarttracker.com'}</p>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
