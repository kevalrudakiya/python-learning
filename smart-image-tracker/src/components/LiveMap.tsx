import dynamic from 'next/dynamic';
import React from 'react';

const DynamicLiveMapInner = dynamic(
  () => import('./LiveMapInner').then((mod) => mod.LiveMapInner),
  { ssr: false }
);

export const LiveMap: React.FC<any> = (props) => {
  return <DynamicLiveMapInner {...props} />;
};
