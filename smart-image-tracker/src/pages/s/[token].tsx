import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import io from 'socket.io-client';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import {
  ShieldCheck,
  MapPin,
  Clock,
  User,
  Ban,
  CheckCircle2,
  AlertCircle,
  Radio,
  Lock,
} from 'lucide-react';

interface RecipientPageProps {
  initialSession: any;
  errorMsg?: string;
  fullImageUrl?: string;
}

export default function RecipientLandingPage({ initialSession, errorMsg, fullImageUrl }: RecipientPageProps) {
  const [session, setSession] = useState<any>(initialSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorMsg || '');

  // Consent & Tracking State
  const [consentGranted, setConsentGranted] = useState(false);
  const [consentDeclined, setConsentDeclined] = useState(false);
  const [trackingStopped, setTrackingStopped] = useState(false);

  // Live Telemetry State
  const [lastPosition, setLastPosition] = useState<any>(null);
  const [lastUpdatedSecs, setLastUpdatedSecs] = useState<number>(0);
  const [gpsError, setGpsError] = useState('');

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (session) {
      if (session.status === 'TRACKING_ACTIVE' || session.status === 'LOCATION_ALLOWED') {
        setConsentGranted(true);
      } else if (session.status === 'TRACKING_STOPPED') {
        setTrackingStopped(true);
      } else if (session.status === 'LOCATION_DENIED') {
        setConsentDeclined(true);
      }
    }
  }, [session]);

  // Timer tick for "Last updated X seconds ago"
  useEffect(() => {
    if (consentGranted && !trackingStopped) {
      timerRef.current = setInterval(() => {
        setLastUpdatedSecs((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [consentGranted, trackingStopped]);

  // Initialize Socket.IO connection when tracking starts
  const initSocket = () => {
    if (!socketRef.current && session) {
      const socket = io();
      socket.emit('join_session', session.id);
      socketRef.current = socket;
    }
  };

  // 2. EXPLICIT ACTION: Recipient clicks "SHARE MY LOCATION"
  const handleShareLocationClick = async () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser or device.');
      return;
    }

    try {
      // Record explicit consent in backend
      const res = await fetch(`/api/public/session/${session.token}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'allow', userAgent: navigator.userAgent }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to record consent');
      }

      setConsentGranted(true);
      initSocket();

      // Trigger browser navigator.geolocation.watchPosition() ONLY NOW
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const pointData = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
          };

          setLastPosition(pointData);
          setLastUpdatedSecs(0);

          // Emit to socket room for instant map update
          if (socketRef.current && session) {
            socketRef.current.emit('location_update', {
              sessionId: session.id,
              point: { ...pointData, timestamp: new Date() },
            });
          }

          // Send position to secure backend API
          fetch(`/api/public/session/${session.token}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pointData),
          }).catch((e) => console.error('Location post error:', e));
        },
        (err) => {
          console.error('Geolocation error:', err);
          if (err.code === err.PERMISSION_DENIED) {
            setGpsError('Geolocation permission was denied in your browser settings.');
          } else {
            setGpsError('Unable to acquire location position.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 10000,
        }
      );
    } catch (err: any) {
      setError(err.message || 'Consent error');
    }
  };

  // EXPLICIT ACTION: Recipient clicks "NOT NOW" (Declines)
  const handleDeclineClick = async () => {
    try {
      await fetch(`/api/public/session/${session.token}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deny', userAgent: navigator.userAgent }),
      });
      setConsentDeclined(true);
    } catch (err) {
      console.error('Decline error:', err);
    }
  };

  // EXPLICIT ACTION: Recipient clicks "STOP SHARING LOCATION"
  const handleStopSharingClick = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (socketRef.current && session) {
      socketRef.current.emit('tracking_stopped', { sessionId: session.id });
      socketRef.current.disconnect();
    }

    setTrackingStopped(true);

    try {
      await fetch(`/api/public/session/${session.token}/stop`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Stop sharing error:', err);
    }
  };

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-extrabold text-white">Session Unavailable</h2>
          <p className="text-xs text-slate-400">{error || 'This link has expired or is invalid.'}</p>
        </div>
      </div>
    );
  }

  const isExpired = session.status === 'EXPIRED' || new Date() > new Date(session.expiresAt);
  const pageTitle = session.image?.title || 'Shared Image';
  const pageDesc = `Image shared by ${session.senderName}. View media and optional location session.`;

  return (
    <>
      <Head>
        <title>{pageTitle} | Smart Tracker</title>
        <meta name="description" content={pageDesc} />

        {/* WhatsApp & Social Open Graph Tags for Rich Image Cards */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:image" content={fullImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <meta name="twitter:image" content={fullImageUrl} />
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
        {/* Top Header */}
        <header className="max-w-lg mx-auto w-full flex items-center justify-between py-2 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">Smart Tracker</span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Session</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-lg mx-auto w-full my-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          {/* Shared Image Display */}
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative max-h-80 flex items-center justify-center">
              <img
                src={session.image?.fileUrl || '/samples/sample-blueprint.jpg'}
                alt={session.image?.title || 'Shared Image'}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white leading-snug">{session.image?.title}</h2>
              {session.image?.description && (
                <p className="text-xs text-slate-400 mt-1">{session.image?.description}</p>
              )}
            </div>
          </div>

          {/* Sender & Purpose Card */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300">
                <User className="w-4 h-4 text-sky-400" />
                <span>Shared by: <strong>{session.senderName}</strong></span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Expires in {session.durationMinutes}m</span>
              </div>
            </div>
            {session.purpose && (
              <p className="text-slate-400 border-t border-slate-800/80 pt-2 mt-2">
                <strong>Purpose:</strong> {session.purpose}
              </p>
            )}
          </div>

          {/* SCREEN STATE 1: Expired Link */}
          {isExpired ? (
            <div className="bg-amber-950/40 border border-amber-800/60 p-5 rounded-2xl text-center space-y-2 text-amber-200">
              <Clock className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="font-bold text-sm">Tracking Session Expired</h3>
              <p className="text-xs text-amber-300/80">
                This tracking session has reached its configured expiry time. Location collection is automatically disabled.
              </p>
            </div>
          ) : trackingStopped ? (
            /* SCREEN STATE 2: Stopped by Recipient */
            <div className="bg-purple-950/40 border border-purple-800/60 p-6 rounded-2xl text-center space-y-3 text-purple-200">
              <Ban className="w-10 h-10 text-purple-400 mx-auto" />
              <h3 className="font-bold text-base text-white">Location Sharing Stopped</h3>
              <p className="text-xs text-purple-300/80">
                You have stopped sharing your live location. No further position data is being transmitted to the sender.
              </p>
            </div>
          ) : consentDeclined ? (
            /* SCREEN STATE 3: Declined */
            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl text-center space-y-3 text-slate-300">
              <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-base text-white">Location Request Declined</h3>
              <p className="text-xs text-slate-400">
                You chose not to share your location. You can view the image above safely.
              </p>
            </div>
          ) : consentGranted ? (
            /* SCREEN STATE 4: ACTIVE TRACKING AFTER CONSENT */
            <div className="bg-emerald-950/50 border border-emerald-800/80 p-6 rounded-2xl space-y-5 text-center">
              <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold text-sm">
                <Radio className="w-5 h-5 animate-spin" />
                <span>✓ Live Location Sharing Active</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/60 space-y-1 text-xs text-slate-300">
                <p className="font-semibold text-emerald-300">Streaming Position to Sender</p>
                <p className="text-slate-400 text-[11px]">
                  Last updated {lastUpdatedSecs} second{lastUpdatedSecs === 1 ? '' : 's'} ago
                </p>
                {lastPosition && (
                  <p className="text-[10px] font-mono text-sky-400 mt-2 pt-2 border-t border-slate-800">
                    Lat: {lastPosition.latitude.toFixed(5)}, Lng: {lastPosition.longitude.toFixed(5)} (±{Math.round(lastPosition.accuracy)}m)
                  </p>
                )}
              </div>

              {gpsError && <p className="text-xs text-rose-400 bg-rose-950/60 p-2 rounded-lg">{gpsError}</p>}

              <button
                type="button"
                onClick={handleStopSharingClick}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/30"
              >
                <Ban className="w-4 h-4" />
                <span>STOP SHARING LOCATION</span>
              </button>
            </div>
          ) : (
            /* SCREEN STATE 0: INITIAL CONSENT DISCLOSURE SCREEN */
            <div className="space-y-6 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-sky-400" />
                  <span>Share Your Live Location</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If you continue, your device will ask for permission to share your current/live location with the sender. Location sharing is optional and can be stopped at any time.
                </p>
              </div>

              {/* Explicit Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleShareLocationClick}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-600/30 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  <span>SHARE MY LOCATION</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeclineClick}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  NOT NOW
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer Disclaimers */}
        <footer className="max-w-lg mx-auto w-full text-center space-y-1 py-2 text-[11px] text-slate-500">
          <p>🔒 100% Consent Gated • Zero Silent Tracking Policy</p>
          <p>Opening this image alone never collects your location.</p>
        </footer>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { token } = context.params || {};

  if (!token || typeof token !== 'string') {
    return { props: { errorMsg: 'Invalid session token' } };
  }

  try {
    const session = await prisma.trackingSession.findUnique({
      where: { secureToken: token },
      include: {
        image: { select: { title: true, description: true, fileUrl: true } },
        user: { select: { name: true } },
      },
    });

    if (!session) {
      return { props: { errorMsg: 'Tracking session not found or invalid link' } };
    }

    const host = context.req.headers.host || 'localhost:3000';
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const fullImageUrl = session.image.fileUrl.startsWith('http')
      ? session.image.fileUrl
      : `${protocol}://${host}${session.image.fileUrl}`;

    // Record open event if first open
    if (!session.openedAt) {
      await prisma.trackingSession.update({
        where: { id: session.id },
        data: {
          openedAt: new Date(),
          status: session.status === 'CREATED' ? 'CONSENT_PENDING' : session.status,
        },
      });
      await logAudit('LINK_OPENED', 'TrackingSession', session.id, undefined, {
        publicSessionId: session.publicSessionId,
      });
    }

    return {
      props: {
        initialSession: {
          id: session.id,
          token,
          publicSessionId: session.publicSessionId,
          recipientLabel: session.recipientLabel,
          purpose: session.purpose,
          durationMinutes: session.durationMinutes,
          status: session.status,
          expiresAt: session.expiresAt.toISOString(),
          senderName: session.user.name,
          image: session.image,
        },
        fullImageUrl,
      },
    };
  } catch (err) {
    console.error('SSR Session error:', err);
    return { props: { errorMsg: 'Failed to load tracking session' } };
  }
};
