import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = (st: string) => {
    switch (st) {
      case 'CREATED':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'OPENED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONSENT_PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'LOCATION_ALLOWED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'LOCATION_DENIED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'TRACKING_ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
      case 'TRACKING_STOPPED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const formatLabel = (st: string) => {
    switch (st) {
      case 'CREATED':
        return 'Created';
      case 'OPENED':
        return 'Link Opened';
      case 'CONSENT_PENDING':
        return 'Consent Pending';
      case 'LOCATION_ALLOWED':
        return 'Location Allowed';
      case 'LOCATION_DENIED':
        return 'Location Denied';
      case 'TRACKING_ACTIVE':
        return '● Tracking Active';
      case 'TRACKING_STOPPED':
        return 'Tracking Stopped';
      case 'EXPIRED':
        return 'Expired';
      default:
        return st;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${getBadgeStyle(
        status
      )}`}
    >
      {formatLabel(status)}
    </span>
  );
};
