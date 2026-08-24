'use client';

import { useState, useEffect } from 'react';
import { PuzoMascot, type MascotMood } from './PuzoMascot';

const TYPED_MESSAGES: string[] = [
  "Hi! I'm PUZO, your desk companion 👋",
  "Your expressive OLED buddy ✨",
  "Sending taps to loved ones 💙",
  "Staying focused with you ⚡",
  "Ready to brighten your desk! 😊",
];

const EMOTION_WEIGHTS: { mood: MascotMood; weight: number }[] = [
  { mood: 'idle', weight: 2.0 },
  { mood: 'happy', weight: 1.2 },
  { mood: 'glee', weight: 0.7 },
  { mood: 'loving', weight: 0.9 },
  { mood: 'curious', weight: 0.8 },
  { mood: 'excited', weight: 0.8 },
  { mood: 'surprised', weight: 0.4 },
  { mood: 'skeptic', weight: 0.4 },
  { mood: 'sleepy', weight: 0.25 },
  { mood: 'sad', weight: 0.25 },
  { mood: 'worried', weight: 0.35 },
  { mood: 'focused', weight: 0.6 },
  { mood: 'angry', weight: 0.25 },
  { mood: 'suspicious', weight: 0.25 },
  { mood: 'furious', weight: 0.15 },
];

function pickWeightedEmotion(exclude?: MascotMood): MascotMood {
  const total = EMOTION_WEIGHTS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of EMOTION_WEIGHTS) {
    r -= e.weight;
    if (r <= 0) {
      if (e.mood === exclude) return pickWeightedEmotion(exclude);
      return e.mood;
    }
  }
  return 'idle';
}

export function PuzoMascotTalk({
  size = 200,
  mascotClassName,
  className,
}: {
  size?: number;
  mascotClassName?: string;
  className?: string;
}) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [displayText, setDisplayText] = useState(TYPED_MESSAGES[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoMood, setAutoMood] = useState<MascotMood>('idle');

  useEffect(() => {
    const currentFullText = TYPED_MESSAGES[msgIndex];
    const typingSpeed = isDeleting ? 28 : 55;
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentFullText.slice(0, displayText.length + 1));
        if (displayText.length + 1 === currentFullText.length) {
          setTimeout(() => setIsDeleting(true), 2200);
        }
      } else {
        setDisplayText(currentFullText.slice(0, displayText.length - 1));
        if (displayText.length - 1 === 0) {
          setIsDeleting(false);
          setMsgIndex((prev) => (prev + 1) % TYPED_MESSAGES.length);
        }
      }
    }, typingSpeed);
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, msgIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAutoMood((prev) => pickWeightedEmotion(prev));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center text-center w-full ${className || ''}`}>
      <PuzoMascot size={size} mood={autoMood} trackMouse className={mascotClassName} />

      <div className="mt-5 inline-flex max-w-[88vw] sm:max-w-[380px] items-center justify-center gap-2 rounded-[980px] bg-white border border-[#d2d2d7]/40 px-4 sm:px-5 py-2 sm:py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300">
        <span className="h-2 w-2 rounded-full bg-[#0071e3] animate-pulse shrink-0" />
        <span className="text-[13px] sm:text-[14px] font-normal text-[#1d1d1f] tracking-[-0.01em] min-h-[20px] inline-flex items-center text-center leading-snug break-words">
          <span className="break-words">{displayText}</span>
          <span className="inline-block w-0.5 h-4 bg-[#0071e3] ml-1 animate-pulse shrink-0" />
        </span>
      </div>
    </div>
  );
}
