import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, ShieldAlert } from 'lucide-react';

interface HashDisplayProps {
  hash: string;
  verified?: boolean;
  mismatch?: boolean;
  short?: boolean;
  className?: string;
}

export const HashDisplay: React.FC<HashDisplayProps> = ({
  hash,
  verified,
  mismatch,
  short = true,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hash) {
    return <span className="text-xs text-[#9A8C7D] font-mono italic">Not Calculated</span>;
  }

  const displayText =
    short && hash.length === 64
      ? `${hash.substring(0, 10)}...${hash.substring(54)}`
      : hash;

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-mono text-xs bg-[#EFE5D8] border border-[#D9CBBB] rounded-md px-2 py-1 text-[#342A23] max-w-full select-all shadow-2xs ${className}`}
      title={hash}
    >
      {verified && <ShieldCheck className="w-3.5 h-3.5 text-[#47765B] shrink-0" />}
      {mismatch && <ShieldAlert className="w-3.5 h-3.5 text-[#A64B43] shrink-0" />}
      <span className="tracking-wider text-[#443126] font-medium truncate">
        {displayText}
      </span>
      <button
        type="button"
        onClick={copyToClipboard}
        className="ml-0.5 text-[#796C60] hover:text-[#443126] transition-colors p-0.5 rounded hover:bg-[#D9CBBB] shrink-0 cursor-pointer"
        title="Copy full 64-char SHA-256 hash"
        aria-label="Copy hash"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-[#47765B]" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};
