import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkillBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  skill: string;
  status?: 'matched' | 'missing' | 'bonus' | 'neutral';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ 
  skill, 
  status = 'neutral', 
  className, 
  ...props 
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold',
        {
          'skill-badge-matched': status === 'matched',
          'skill-badge-missing': status === 'missing',
          'skill-badge-bonus': status === 'bonus',
          'bg-[#161616] text-[#D4D4D8] border border-[#262626]': status === 'neutral',
        },
        className
      )}
      {...props}
    >
      {skill}
    </span>
  );
};
