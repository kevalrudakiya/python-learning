import React, { useState } from 'react';
import { X, Copy, Check, Download, Share2, MessageSquare, Mail, Send } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  qrCodeDataUrl: string;
  recipientLabel: string;
  imageTitle?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  qrCodeDataUrl,
  recipientLabel,
  imageTitle = 'Shared Image',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `QR-${recipientLabel.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Share Message Text
  const shareMessage = `I'm sharing "${imageTitle}" with you. If you choose, you can also share your live location with me through the secure link below. Location sharing starts only after you approve it and can be stopped anytime.\n\n${shareUrl}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(`Shared Image: ${imageTitle}`)}&body=${encodeURIComponent(shareMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-lg">Share Session Link & QR</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Recipient Label & Disclosure */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Recipient</p>
            <p className="text-base font-bold text-slate-900">{recipientLabel}</p>
            <p className="text-xs text-slate-500 mt-1">
              Consent-gated location link generated. Recipient must explicitly approve before tracking begins.
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-sky-200 rounded-2xl">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Share QR Code"
                className="w-56 h-56 object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-56 h-56 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
                Loading QR Code...
              </div>
            )}
            <button
              onClick={handleDownloadQR}
              className="mt-3 inline-flex items-center space-x-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download High-Res QR Code</span>
            </button>
          </div>

          {/* Share Link Copy Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Secure Share URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Platform Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-600">Direct Platform Sharing</p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <a
                href={smsUrl}
                className="flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>SMS</span>
              </a>
              <a
                href={mailUrl}
                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
