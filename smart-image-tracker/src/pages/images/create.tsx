import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { QRCodeModal } from '@/components/QRCodeModal';
import {
  Upload,
  Sparkles,
  Share2,
  Clock,
  User,
  Tag,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';

export default function CreateImagePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<'UPLOAD' | 'AI_GENERATE'>('UPLOAD');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [campaign, setCampaign] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // AI Prompt
  const [aiPrompt, setAiPrompt] = useState('Modern architectural building site inspection photo');
  const [generatedFileUrl, setGeneratedFileUrl] = useState('');

  // File Upload
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');

  // Session Fields
  const [createSessionNow, setCreateSessionNow] = useState(true);
  const [recipientLabel, setRecipientLabel] = useState('');
  const [purpose, setPurpose] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [createdSessionData, setCreatedSessionData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((d) => {
        if (d?.user) setUser(d.user);
      });
  }, []);

  // Handle mock AI image generator
  const handleGenerateAI = () => {
    if (!aiPrompt) return;
    setLoading(true);
    // Generate a sleek SVG canvas data URL based on prompt
    setTimeout(() => {
      const encodedPrompt = encodeURIComponent(aiPrompt.substring(0, 30));
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0284c7;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#312e81;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#grad)"/>
        <circle cx="400" cy="300" r="180" fill="none" stroke="#38bdf8" stroke-width="4" opacity="0.4"/>
        <circle cx="400" cy="300" r="120" fill="none" stroke="#7dd3fc" stroke-width="2" stroke-dasharray="10 5"/>
        <text x="400" y="280" font-family="sans-serif" font-size="28" fill="#ffffff" font-weight="bold" text-anchor="middle">AI GENERATED MEDIA</text>
        <text x="400" y="320" font-family="monospace" font-size="16" fill="#93c5fd" text-anchor="middle">"${encodedPrompt}"</text>
        <text x="400" y="550" font-family="sans-serif" font-size="14" fill="#cbd5e1" text-anchor="middle">Smart Tracker Synthetic Engine • 100% Consent Verified</text>
      </svg>`;
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
      setGeneratedFileUrl(dataUrl);
      if (!title) setTitle(aiPrompt);
      setLoading(false);
    }, 800);
  };

  // Handle local File Upload simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size < 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedFileUrl(event.target?.result as string);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalFileUrl = mode === 'UPLOAD' ? uploadedFileUrl : generatedFileUrl;
    if (!finalFileUrl) {
      setError(mode === 'UPLOAD' ? 'Please upload an image file first.' : 'Please generate an AI image first.');
      return;
    }

    if (!title) {
      setError('Image title is required.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Image Record
      const imgRes = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          campaign,
          recipientName,
          internalNotes,
          fileUrl: finalFileUrl,
          mimeType: mode === 'UPLOAD' ? 'image/png' : 'image/svg+xml',
        }),
      });

      const imgData = await imgRes.json();
      if (!imgRes.ok) throw new Error(imgData.error || 'Failed to save image');

      // 2. Optional: Create Share Session immediately
      if (createSessionNow) {
        const targetRecipient = recipientLabel || recipientName || 'Recipient User';
        const sessRes = await fetch('/api/tracking-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId: imgData.image.id,
            recipientLabel: targetRecipient,
            purpose: purpose || campaign || 'Image view & voluntary location verification',
            durationMinutes: parseInt(durationMinutes, 10),
          }),
        });

        const sessData = await sessRes.json();
        if (!sessRes.ok) throw new Error(sessData.error || 'Failed to create share session');

        setCreatedSessionData({
          shareUrl: sessData.shareUrl,
          qrCodeDataUrl: sessData.qrCodeDataUrl,
          recipientLabel: targetRecipient,
          imageTitle: title,
        });

        setQrModalOpen(true);
      } else {
        router.push('/images');
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
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
        <title>New Image & Share Session | Smart Tracker</title>
      </Head>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar
            title="Create Image & Share Link"
            subtitle="Upload media or generate synthetic AI image, then create a consent-gated tracking session"
          />

          <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
            <Link
              href="/images"
              className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Image Library</span>
            </Link>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-3">
                <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Image Source Selection */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">1. Media Source Selection</h3>
                  <p className="text-xs text-slate-500">Choose whether to upload a file or generate an image</p>
                </div>

                {/* Tab Switcher */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setMode('UPLOAD')}
                    className={`flex items-center justify-center space-x-2 p-4 rounded-xl font-bold text-xs border transition-all ${
                      mode === 'UPLOAD'
                        ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Image File (JPG, PNG, WEBP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('AI_GENERATE')}
                    className={`flex items-center justify-center space-x-2 p-4 rounded-xl font-bold text-xs border transition-all ${
                      mode === 'AI_GENERATE'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Generate AI Synthetic Graphic</span>
                  </button>
                </div>

                {/* Mode 1: File Upload Box */}
                {mode === 'UPLOAD' && (
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    {uploadedFileUrl ? (
                      <div className="space-y-4">
                        <img
                          src={uploadedFileUrl}
                          alt="Uploaded Preview"
                          className="max-h-60 mx-auto rounded-xl shadow-md border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedFileUrl('')}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          Remove and upload different image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                        <label className="cursor-pointer inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors">
                          <span>Browse Files</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-slate-400 mt-2">Supports JPG, JPEG, PNG, WEBP (Max 10MB)</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mode 2: AI Image Generator */}
                {mode === 'AI_GENERATE' && (
                  <div className="space-y-4 bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl">
                    <div>
                      <label className="block text-xs font-semibold text-indigo-900 mb-1">
                        AI Image Generation Prompt
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="Describe the image to generate..."
                          className="flex-1 px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateAI}
                          disabled={loading}
                          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all disabled:opacity-50"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{loading ? 'Generating...' : 'Generate AI Image'}</span>
                        </button>
                      </div>
                    </div>

                    {generatedFileUrl && (
                      <div className="mt-4 pt-4 border-t border-indigo-100 text-center">
                        <p className="text-xs font-semibold text-indigo-700 mb-2">Generated Canvas Preview</p>
                        <img
                          src={generatedFileUrl}
                          alt="AI Graphic"
                          className="max-h-60 mx-auto rounded-xl shadow-md border border-indigo-200"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Image Details */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900">2. Image Metadata</h3>
                  <p className="text-xs text-slate-500">Normal media file fields (No embedded tracking code)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Image Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Project Site Blueprints"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign / Purpose</label>
                    <input
                      type="text"
                      value={campaign}
                      onChange={(e) => setCampaign(e.target.value)}
                      placeholder="e.g. Field Inspection Q3"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Recipient Name</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => {
                        setRecipientName(e.target.value);
                        if (!recipientLabel) setRecipientLabel(e.target.value);
                      }}
                      placeholder="e.g. Michael Scott"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief summary of image content"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Create Share Session */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">3. Create Share Session</h3>
                    <p className="text-xs text-slate-500">Configure recipient label and session expiry timer</p>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createSessionNow}
                      onChange={(e) => setCreateSessionNow(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <span className="text-xs font-bold text-slate-800">Generate Share Link Immediately</span>
                  </label>
                </div>

                {createSessionNow && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Label *</label>
                      <input
                        type="text"
                        required={createSessionNow}
                        value={recipientLabel}
                        onChange={(e) => setRecipientLabel(e.target.value)}
                        placeholder="e.g. Michael Scott (Onsite Lead)"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Location Request Purpose</label>
                      <input
                        type="text"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g. Onsite Arrival Verification"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Session Expiry Duration *</label>
                      <select
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="60">1 Hour (Recommended)</option>
                        <option value="180">3 Hours</option>
                        <option value="360">6 Hours</option>
                        <option value="720">12 Hours</option>
                        <option value="1440">24 Hours</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{loading ? 'Processing...' : 'Create Image & Generate Link'}</span>
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>

      {/* Share Link & QR Code Modal */}
      {createdSessionData && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => {
            setQrModalOpen(false);
            router.push('/dashboard');
          }}
          shareUrl={createdSessionData.shareUrl}
          qrCodeDataUrl={createdSessionData.qrCodeDataUrl}
          recipientLabel={createdSessionData.recipientLabel}
          imageTitle={createdSessionData.imageTitle}
        />
      )}
    </>
  );
}
