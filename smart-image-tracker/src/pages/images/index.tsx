import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Image as ImageIcon, Plus, Share2, Calendar, User, Tag } from 'lucide-react';

export default function ImageLibraryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
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
          setUser(data.user);
          fetchImages();
        }
      });
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/images');
      if (res.ok) {
        const data = await res.json();
        setImages(data.images);
      }
    } catch (err) {
      console.error('Fetch images error:', err);
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
        <title>Image Library | Smart Tracker</title>
      </Head>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar
            title="Image Library"
            subtitle="Manage media assets, generate AI images, and create tracking links"
          />

          <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Your Images ({images.length})</h2>
                <p className="text-xs text-slate-500">Each image can be linked to unique tracking sessions</p>
              </div>

              <Link
                href="/images/create"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Upload / AI Generate</span>
              </Link>
            </div>

            {images.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700">No images uploaded yet</p>
                <p className="text-xs text-slate-400 mt-1">Upload a JPG, PNG, WEBP, or generate an AI graphic.</p>
                <Link
                  href="/images/create"
                  className="mt-4 inline-flex items-center space-x-2 bg-sky-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Image</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Image Preview Container */}
                      <div className="h-48 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                        <img
                          src={img.fileUrl}
                          alt={img.title}
                          className="w-full h-full object-cover"
                        />
                        {img.campaign && (
                          <span className="absolute top-3 left-3 bg-slate-950/80 text-sky-400 backdrop-blur-sm text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border border-slate-800">
                            {img.campaign}
                          </span>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="p-5 space-y-3">
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug">{img.title}</h3>
                        {img.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">{img.description}</p>
                        )}

                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                          {img.recipientName && (
                            <div className="flex items-center space-x-2">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>Target: <strong>{img.recipientName}</strong></span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Uploaded: {new Date(img.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        {img.sessions?.length || 0} Session{img.sessions?.length === 1 ? '' : 's'} Created
                      </span>

                      <Link
                        href={`/images/create?selectedImageId=${img.id}`}
                        className="inline-flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Create Share Session</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
