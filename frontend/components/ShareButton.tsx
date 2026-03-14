
import React, { useState } from 'react';
import { ShareIcon, CheckIcon } from './Icons';

interface ShareButtonProps {
    className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ className = "p-2 rounded-full transition-colors duration-200 ease-in-out text-white hover:bg-white/20" }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: document.title,
      text: `Check out this amazing market on the VI Markets Network!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback for desktop: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <button
      onClick={handleShare}
      className={className}
      aria-label="Share this profile"
      title={copied ? "Link Copied!" : "Share this profile"}
    >
      {copied ? <CheckIcon className="w-7 h-7" /> : <ShareIcon className="w-7 h-7" />}
    </button>
  );
};

export default ShareButton;
