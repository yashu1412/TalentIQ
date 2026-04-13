"use client";

import { useState, useEffect, useRef } from "react";

type AITypingProps = {
  text: string;
  speed?: number;         // ms per character
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
  showCursor?: boolean;
};

export default function AITyping({
  text,
  speed = 18,
  onComplete,
  className = "",
  style,
  showCursor = true,
}: AITypingProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);
  const prevText = useRef("");

  useEffect(() => {
    // If text changed (streaming), just display the passed text
    if (text !== prevText.current) {
      prevText.current = text;
      idxRef.current = 0;
      setDisplayed("");
      setDone(false);
    }
  }, [text]);

  useEffect(() => {
    if (done) return;
    if (idxRef.current >= text.length) {
      setDone(true);
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => {
      idxRef.current += 1;
      setDisplayed(text.slice(0, idxRef.current));
    }, speed);
    return () => clearTimeout(timer);
  }, [displayed, text, speed, done, onComplete]);

  return (
    <span className={className} style={style}>
      {displayed}
      {showCursor && !done && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            background: "#60A5FA",
            marginLeft: 2,
            verticalAlign: "text-bottom",
            animation: "blink-caret 0.75s step-end infinite",
          }}
        />
      )}
    </span>
  );
}
