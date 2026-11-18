import React from 'react';
import { ShieldCheck, Radio } from 'lucide-react';

interface NavbarProps {
  title: string;
  subtitle?: string;
  activeCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle, activeCount = 0 }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {/* Consent Protection Badge */}
        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>100% Consent Gated</span>
        </div>

        {/* Live Active Tracker Status */}
        {activeCount > 0 && (
          <div className="flex items-center space-x-2 bg-sky-50 border border-sky-200 text-sky-700 px-3 py-1.5 rounded-lg text-xs font-semibold animate-pulse">
            <Radio className="w-4 h-4 text-sky-600 animate-spin" />
            <span>{activeCount} Live Session{activeCount > 1 ? 's' : ''} Active</span>
          </div>
        )}
      </div>
    </header>
  );
};
