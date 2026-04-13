"use client";

import React, { useEffect, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ScoreChipProps {
  score: number;
  label?: string;
  className?: string;
}

export const ScoreChip: React.FC<ScoreChipProps> = ({ score, label, className }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Animate score from 0 to target
    let current = 0;
    const step = score / 20; // 20 frames animation
    
    const interval = setInterval(() => {
      current += step;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, [score]);

  // Determine color based on score
  let colorClass = 'text-green-400 bg-green-400/10 border-green-400/30';
  if (score < 60) colorClass = 'text-rose-400 bg-rose-400/10 border-rose-400/30';
  else if (score < 80) colorClass = 'text-amber-400 bg-amber-400/10 border-amber-400/30';
  else if (score >= 90) colorClass = 'text-[#60A5FA] bg-[#60A5FA]/10 border-[#60A5FA]/30 shadow-[0_0_15px_rgba(45,212,191,0.2)]';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && <span className="text-sm font-medium text-[#D4D4D8]">{label}</span>}
      <div 
        className={cn(
          'px-3 py-1 rounded-full border font-mono font-bold text-sm tracking-wide',
          colorClass
        )}
      >
        {displayScore}%
      </div>
    </div>
  );
};
