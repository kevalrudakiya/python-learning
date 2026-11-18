import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default leaflet marker icon issue in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const pulseIcon = L.divIcon({
  className: 'custom-pulse-marker',
  html: '<div class="pulse-ring"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface LocationPointData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number | null;
  heading?: number | null;
  timestamp: string | Date;
}

interface LiveMapInnerProps {
  locationPoints: LocationPointData[];
  recipientLabel?: string;
  isTrackingActive?: boolean;
}

// Helper component to center map smoothly on new points
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export const LiveMapInner: React.FC<LiveMapInnerProps> = ({
  locationPoints,
  recipientLabel = 'Recipient',
  isTrackingActive = false,
}) => {
  if (!locationPoints || locationPoints.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-8 text-center rounded-xl border border-slate-800">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Awaiting Recipient Location</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Location tracking will stream live to this map once the recipient opens the link and explicitly clicks "Share My Location".
        </p>
      </div>
    );
  }

  const currentPoint = locationPoints[locationPoints.length - 1];
  const center: [number, number] = [currentPoint.latitude, currentPoint.longitude];

  const routePolyline: [number, number][] = locationPoints.map((pt) => [pt.latitude, pt.longitude]);
  const startPoint = locationPoints[0];

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-xl border border-slate-700">
      <MapContainer center={center} zoom={16} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap lat={currentPoint.latitude} lng={currentPoint.longitude} />

        {/* Movement Route Polyline */}
        {routePolyline.length > 1 && (
          <Polyline
            positions={routePolyline}
            pathOptions={{ color: '#0284c7', weight: 5, opacity: 0.85, dashArray: '8, 8' }}
          />
        )}

        {/* Accuracy Circle around latest position */}
        <Circle
          center={center}
          radius={currentPoint.accuracy}
          pathOptions={{ fillColor: '#0284c7', fillOpacity: 0.15, color: '#0284c7', weight: 1.5 }}
        />

        {/* Start Point Marker */}
        {locationPoints.length > 1 && (
          <Marker position={[startPoint.latitude, startPoint.longitude]} icon={defaultIcon}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-slate-900">Start Position</p>
                <p className="text-xs text-slate-600">{new Date(startPoint.timestamp).toLocaleTimeString()}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Current Position Live Pulse Marker */}
        <Marker position={center} icon={isTrackingActive ? pulseIcon : defaultIcon}>
          <Popup>
            <div className="p-2">
              <p className="font-bold text-slate-900">{recipientLabel}</p>
              <p className="text-xs text-slate-600">
                <strong>Lat:</strong> {currentPoint.latitude.toFixed(5)}, <strong>Lng:</strong> {currentPoint.longitude.toFixed(5)}
              </p>
              <p className="text-xs text-slate-600">
                <strong>Accuracy:</strong> ±{Math.round(currentPoint.accuracy)} meters
              </p>
              <p className="text-xs text-sky-600 font-semibold mt-1">
                Last update: {new Date(currentPoint.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
