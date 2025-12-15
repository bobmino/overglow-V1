import React, { useState } from 'react';
import { Share2, Facebook, Twitter, MessageCircle, Link as LinkIcon, Check } from 'lucide-react';

const ShareButtons = ({ product, url, title, description }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title || product?.title || 'Découvrez cette expérience sur Overglow Trip';
  const shareDescription = description || product?.description?.substring(0, 200) || '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    const encodedDescription = encodeURIComponent(shareDescription);

    let shareLink = '';

    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'native':
        if (typeof navigator !== 'undefined' && navigator.share) {
          navigator.share({
            title: shareTitle,
            text: shareDescription,
            url: shareUrl,
          }).catch(() => {});
          return;
        }
        break;
      default:
        return;
    }

    if (shareLink && typeof window !== 'undefined') {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-700 mr-2">Partager :</span>
      
      {/* Native Share API (mobile) */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          onClick={() => handleShare('native')}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
          aria-label="Partager"
          title="Partager"
        >
          <Share2 size={18} />
        </button>
      )}

      {/* Facebook */}
      <button
        onClick={() => handleShare('facebook')}
        className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition"
        aria-label="Partager sur Facebook"
        title="Facebook"
      >
        <Facebook size={18} />
      </button>

      {/* Twitter */}
      <button
        onClick={() => handleShare('twitter')}
        className="p-2 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 transition"
        aria-label="Partager sur Twitter"
        title="Twitter"
      >
        <Twitter size={18} />
      </button>

      {/* WhatsApp */}
      <button
        onClick={() => handleShare('whatsapp')}
        className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition"
        aria-label="Partager sur WhatsApp"
        title="WhatsApp"
      >
        <MessageCircle size={18} />
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1"
        aria-label="Copier le lien"
        title="Copier le lien"
      >
        {copied ? (
          <>
            <Check size={18} className="text-green-600" />
            <span className="text-xs text-green-600">Copié!</span>
          </>
        ) : (
          <LinkIcon size={18} />
        )}
      </button>
    </div>
  );
};

export default ShareButtons;

