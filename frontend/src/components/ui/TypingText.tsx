"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TypingTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  repeat?: boolean;
}

export default function TypingText({ 
  text, 
  className, 
  speed = 50, 
  delay = 0,
  repeat = false 
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const startTyping = () => {
      let index = 0;
      setIsTyping(true);
      
      const type = () => {
        if (index <= text.length) {
          setDisplayedText(text.slice(0, index));
          index++;
          timeout = setTimeout(type, speed);
        } else {
          setIsTyping(false);
          if (repeat) {
            timeout = setTimeout(() => {
              setDisplayedText("");
              startTyping();
            }, 3000);
          }
        }
      };
      
      type();
    };

    const initialDelay = setTimeout(startTyping, delay);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(timeout);
    };
  }, [text, speed, delay, repeat]);

  return (
    <div className={cn("font-mono flex items-center", className)}>
      <span>{displayedText}</span>
      <span 
        className={cn(
          "w-0.5 h-[1.2em] bg-[var(--color-teal-300)] ml-1",
          isTyping ? "opacity-100" : "animate-[blink-caret_0.75s_step-end_infinite]"
        )} 
      />
    </div>
  );
}
