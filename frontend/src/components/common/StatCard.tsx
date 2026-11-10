import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent?: 'brown' | 'accent' | 'success' | 'warning' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent = 'brown',
}) => {
  const iconAccents = {
    brown: 'text-[#604735] bg-[#EFE5D8] border-[#D9CBBB]',
    accent: 'text-[#8B684D] bg-[#EFE5D8] border-[#D9CBBB]',
    success: 'text-[#47765B] bg-[#EAF2EC] border-[#BCD5C3]',
    warning: 'text-[#B78035] bg-[#FBF5EA] border-[#E8D4B5]',
    info: 'text-[#647D91] bg-[#EFF4F8] border-[#C8D7E2]',
  };

  return (
    <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl p-5 shadow-[0_1px_3px_rgba(68,49,38,0.05)] transition-all hover:border-[#8B684D] flex flex-col justify-between group">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#796C60] truncate">
          {title}
        </span>
        <div className={`p-2 rounded-xl border ${iconAccents[accent]} shrink-0 transition-transform group-hover:scale-105`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl md:text-[32px] font-bold font-mono tracking-tight text-[#342A23] leading-none">
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-[#9A8C7D] truncate font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};
