import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || 'UNKNOWN').toUpperCase();

  let bg = 'bg-[#EFE5D8] text-[#604735] border-[#D9CBBB]';
  let dot = 'bg-[#8B684D]';

  // Success states
  if (
    (norm.includes('MATCH') && !norm.includes('MISMATCH')) ||
    norm === 'VERIFIED' ||
    norm === 'CONFIRMED' ||
    norm === 'COMPLETED' ||
    norm === 'SUCCESS' ||
    norm === 'PROCESSED'
  ) {
    bg = 'bg-[#EAF2EC] text-[#47765B] border-[#BCD5C3]';
    dot = 'bg-[#47765B]';
  }
  // Error / Mismatch / Critical states
  else if (
    norm.includes('MISMATCH') ||
    norm.includes('FAILED') ||
    norm === 'CRITICAL' ||
    norm === 'REJECTED' ||
    norm === 'FAILURE' ||
    norm === 'TAMPERED'
  ) {
    bg = 'bg-[#F8EBEA] text-[#A64B43] border-[#E3BFBC]';
    dot = 'bg-[#A64B43]';
  }
  // Warning / Pending / Review states
  else if (
    norm.includes('PENDING') ||
    norm.includes('UNVERIFIED') ||
    norm === 'UNDER REVIEW' ||
    norm === 'WARNING' ||
    norm === 'MEDIUM' ||
    norm === 'HIGH' ||
    norm === 'CANDIDATE'
  ) {
    bg = 'bg-[#FBF5EA] text-[#B78035] border-[#E8D4B5]';
    dot = 'bg-[#B78035]';
  }
  // Info / Active states
  else if (
    norm === 'ACTIVE' ||
    norm === 'OPEN' ||
    norm === 'QUEUED' ||
    norm === 'LOW' ||
    norm === 'INFORMATIONAL'
  ) {
    bg = 'bg-[#EFF4F8] text-[#647D91] border-[#C8D7E2]';
    dot = 'bg-[#647D91]';
  }
  // Neutral / Preprocessing states
  else if (
    norm === 'PREPROCESSING' ||
    norm === 'PROCESSING' ||
    norm === 'UPLOADED' ||
    norm === 'ARCHIVED' ||
    norm === 'CLOSED'
  ) {
    bg = 'bg-[#F3EFE9] text-[#796C60] border-[#D9CBBB]';
    dot = 'bg-[#8B684D]';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs font-medium' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border tracking-wide whitespace-nowrap shadow-2xs ${bg} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span>{status}</span>
    </span>
  );
};
