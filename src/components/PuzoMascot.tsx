'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export type MascotMood =
  | 'idle'
  | 'attentive'
  | 'listening'
  | 'speaking'
  | 'loading'
  | 'error'
  | 'happy'
  | 'glee'
  | 'loving'
  | 'curious'
  | 'excited'
  | 'sleepy'
  | 'angry'
  | 'sad'
  | 'surprised'
  | 'skeptic'
  | 'worried'
  | 'focused'
  | 'furious'
  | 'suspicious';

interface PuzoMascotProps {
  mood?: MascotMood;
  speaking?: boolean;
  size?: number;
  trackMouse?: boolean;
  className?: string;
}

type EyeCfg = {
  OffsetX: number;
  OffsetY: number;
  Height: number;
  Width: number;
  Slope_Top: number;
  Slope_Bottom: number;
  Radius_Top: number;
  Radius_Bottom: number;
  Inverse_Radius_Bottom: number;
};

const PRESETS: Record<string, EyeCfg> = {
  Normal: { OffsetX: 0, OffsetY: 0, Height: 26, Width: 26, Slope_Top: 0, Slope_Bottom: 0, Radius_Top: 6, Radius_Bottom: 6, Inverse_Radius_Bottom: 0 },
  Happy: { OffsetX: 0, OffsetY: 1, Height: 7, Width: 28, Slope_Top: 0, Slope_Bottom: 0, Radius_Top: 7, Radius_Bottom: 0, Inverse_Radius_Bottom: 0 },
  Glee: { OffsetX: 0, OffsetY: 1, Height: 6, Width: 28, Slope_Top: 0, Slope_Bottom: 0, Radius_Top: 6, Radius_Bottom: 0, Inverse_Radius_Bottom: 3.5 },
  Sad: { OffsetX: 0, OffsetY: 1, Height: 11, Width: 26, Slope_Top: -0.5, Slope_Bottom: 0, Radius_Top: 1.8, Radius_Bottom: 7, Inverse_Radius_Bottom: 0 },
  Worried: { OffsetX: 0, OffsetY: 0, Height: 16, Width: 26, Slope_Top: -0.15, Slope_Bottom: 0, Radius_Top: 4.5, Radius_Bottom: 7, Inverse_Radius_Bottom: 0 },
  Focused: { OffsetX: 0, OffsetY: 0, Height: 9.5, Width: 28, Slope_Top: 0.22, Slope_Bottom: 0, Radius_Top: 2, Radius_Bottom: 2, Inverse_Radius_Bottom: 0 },
  Annoyed: { OffsetX: 0, OffsetY: 0, Height: 7, Width: 28, Slope_Top: 0, Slope_Bottom: 0, Radius_Top: 0, Radius_Bottom: 7, Inverse_Radius_Bottom: 0 },
  Surprised: { OffsetX: 0, OffsetY: 0, Height: 30, Width: 30, Slope_Top: 0, Slope_Bottom: 0, Radius_Top: 9, Radius_Bottom: 9, Inverse_Radius_Bottom: 0 },
  Skeptic: { OffsetX: 0, OffsetY: 0, Height: 26, Width: 26, Slope_Top: 0, Slope_Bottom: 0, Radius_Top: 7, Radius_Bottom: 7, Inverse_Radius_Bottom: 0 },
  SkepticAlt: { OffsetX: 0, OffsetY: -3, Height: 16, Width: 26, Slope_Top: 0.32, Slope_Bottom: 0, Radius_Top: 1.8, Radius_Bottom: 7, Inverse_Radius_Bottom: 0 },
  Frustrated: { OffsetX: 1.5, OffsetY: -1.5, Height: 8, Width: 26, Slope_Top: 0, Slope_Bottom: 0, Radius_Top: 0, Radius_Bottom: 7, Inverse_Radius_Bottom: 0 },
  Unimpressed: { OffsetX: 1.5, OffsetY: 0, Height: 8.5, Width: 26, Slope_Top: 0, Slope_Bottom: 0, Radius_Top: 1, Radius_Bottom: 7, Inverse_Radius_Bottom: 0 },
  Sleepy: { OffsetX: 0, OffsetY: -1, Height: 9.5, Width: 26, Slope_Top: -0.45, Slope_Bottom: -0.45, Radius_Top: 2.5, Radius_Bottom: 2.5, Inverse_Radius_Bottom: 0 },
  Suspicious: { OffsetX: 0, OffsetY: 0, Height: 13, Width: 26, Slope_Top: 0, Slope_Bottom: 0, Radius_Top: 5.5, Radius_Bottom: 2.5, Inverse_Radius_Bottom: 0 },
  Squint: { OffsetX: -6, OffsetY: -1, Height: 21, Width: 23, Slope_Top: 0, Slope_Bottom: 0, Radius_Top: 6, Radius_Bottom: 6, Inverse_Radius_Bottom: 0 },
  Angry: { OffsetX: -1, OffsetY: 0, Height: 13, Width: 26, Slope_Top: 0.32, Slope_Bottom: 0, Radius_Top: 1.8, Radius_Bottom: 9, Inverse_Radius_Bottom: 0 },
  Furious: { OffsetX: -1, OffsetY: 0, Height: 19, Width: 26, Slope_Top: 0.42, Slope_Bottom: 0, Radius_Top: 1.8, Radius_Bottom: 7, Inverse_Radius_Bottom: 0 },
  Scared: { OffsetX: -1, OffsetY: 0, Height: 26, Width: 26, Slope_Top: -0.1, Slope_Bottom: 0, Radius_Top: 9, Radius_Bottom: 7, Inverse_Radius_Bottom: 0 },
  Awe: { OffsetX: 1, OffsetY: 0, Height: 23, Width: 30, Slope_Top: -0.08, Slope_Bottom: 0.08, Radius_Top: 9, Radius_Bottom: 9, Inverse_Radius_Bottom: 0 },
};

function getPreset(mood: MascotMood, isRight: boolean): EyeCfg {
  switch (mood) {
    case 'happy': return PRESETS.Happy;
    case 'glee': return PRESETS.Glee;
    case 'sad': return PRESETS.Sad;
    case 'worried': return PRESETS.Worried;
    case 'focused': return PRESETS.Focused;
    case 'angry': return PRESETS.Angry;
    case 'furious': return PRESETS.Furious;
    case 'surprised': return PRESETS.Surprised;
    case 'skeptic': return isRight ? PRESETS.SkepticAlt : PRESETS.Skeptic;
    case 'sleepy': return PRESETS.Sleepy;
    case 'suspicious': return PRESETS.Suspicious;
    default: return PRESETS.Normal;
  }
}

function eyePath(cx: number, cy: number, cfg: EyeCfg, isRight: boolean): string {
  const slopeTop = isRight ? cfg.Slope_Top : -cfg.Slope_Top;
  const slopeBottom = isRight ? cfg.Slope_Bottom : -cfg.Slope_Bottom;
  const offX = isRight ? -cfg.OffsetX : cfg.OffsetX;
  const offY = -cfg.OffsetY;

  let rt = cfg.Radius_Top;
  let rb = cfg.Radius_Bottom;
  const deltaTop = cfg.Height * slopeTop / 2;
  const deltaBottom = cfg.Height * slopeBottom / 2;
  const totalH = cfg.Height + deltaTop - deltaBottom;
  if (rb > 0 && rt > 0 && totalH - 1 < rb + rt) {
    const corrTop = (rt * (totalH - 1)) / (rb + rt);
    const corrBottom = (rb * (totalH - 1)) / (rb + rt);
    rt = corrTop;
    rb = corrBottom;
  }
  const TLc_x = cx + offX - cfg.Width / 2 + rt;
  const TLc_y = cy + offY - cfg.Height / 2 + rt - deltaTop;
  const TRc_x = cx + offX + cfg.Width / 2 - rt;
  const TRc_y = cy + offY - cfg.Height / 2 + rt + deltaTop;
  const BLc_x = cx + offX - cfg.Width / 2 + rb;
  const BLc_y = cy + offY + cfg.Height / 2 - rb - deltaBottom;
  const BRc_x = cx + offX + cfg.Width / 2 - rb;
  const BRc_y = cy + offY + cfg.Height / 2 - rb + deltaBottom;

  let d = `M ${TLc_x} ${TLc_y - rt} `;
  d += `L ${TRc_x} ${TRc_y - rt} `;
  if (rt > 0.5) d += `A ${rt} ${rt} 0 0 1 ${TRc_x + rt} ${TRc_y} `;
  else d += `L ${TRc_x + rt} ${TRc_y} `;
  d += `L ${BRc_x + rb} ${BRc_y} `;
  if (rb > 0.5) d += `A ${rb} ${rb} 0 0 1 ${BRc_x} ${BRc_y + rb} `;
  else d += `L ${BRc_x} ${BRc_y + rb} `;
  d += `L ${BLc_x} ${BLc_y + rb} `;
  if (rb > 0.5) d += `A ${rb} ${rb} 0 0 1 ${BLc_x - rb} ${BLc_y} `;
  else d += `L ${BLc_x - rb} ${BLc_y} `;
  d += `L ${TLc_x - rt} ${TLc_y} `;
  if (rt > 0.5) d += `A ${rt} ${rt} 0 0 1 ${TLc_x} ${TLc_y - rt} `;
  else d += `L ${TLc_x} ${TLc_y - rt} `;
  d += `Z`;
  if (cfg.Inverse_Radius_Bottom > 0) {
    const invR = cfg.Inverse_Radius_Bottom;
    const midX = cx + offX;
    const cutY = cy + offY + cfg.Height / 2 - rb - deltaBottom + invR;
    d += ` M ${BLc_x - rb + 4} ${BLc_y + 1} Q ${midX} ${cutY + 6} ${BRc_x + rb - 4} ${BRc_y + 1} Z`;
  }
  return d;
}

export function PuzoMascot({
  mood = 'idle',
  speaking = false,
  size = 200,
  trackMouse = true,
  className,
}: PuzoMascotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const lastInputTimeRef = useRef<number>(Date.now());

  const updatePupilTarget = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const clampedX = Math.max(-7, Math.min(7, dx / 18));
    const clampedY = Math.max(-5, Math.min(5, dy / 18));
    setPupilOffset({ x: clampedX, y: clampedY });
    lastInputTimeRef.current = Date.now();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => updatePupilTarget(e.clientX, e.clientY), [updatePupilTarget]);
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) updatePupilTarget(e.touches[0].clientX, e.touches[0].clientY);
  }, [updatePupilTarget]);

  useEffect(() => {
    const shouldTrack = trackMouse && (mood === 'idle' || mood === 'attentive' || mood === 'curious' || mood === 'focused');
    if (!shouldTrack) { setPupilOffset({ x: 0, y: 0 }); return; }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    const wander = setInterval(() => {
      if (Date.now() - lastInputTimeRef.current > 2500) {
        setPupilOffset({ x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 5 });
      }
    }, 3000);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchMove);
      window.removeEventListener('touchmove', handleTouchMove);
      clearInterval(wander);
    };
  }, [trackMouse, mood, handleMouseMove, handleTouchMove]);

  const isParametricMood = ['idle','attentive','happy','glee','sad','worried','focused','angry','furious','surprised','skeptic','sleepy','suspicious'].includes(mood);

  const renderParametricEyes = () => {
    const leftCfg: EyeCfg = { ...getPreset(mood as MascotMood, false), OffsetX: getPreset(mood as MascotMood, false).OffsetX + pupilOffset.x * 0.35, OffsetY: getPreset(mood as MascotMood, false).OffsetY + pupilOffset.y * 0.35 };
    const rightCfg: EyeCfg = { ...getPreset(mood as MascotMood, true), OffsetX: getPreset(mood as MascotMood, true).OffsetX + pupilOffset.x * 0.35, OffsetY: getPreset(mood as MascotMood, true).OffsetY + pupilOffset.y * 0.35 };
    const lD = eyePath(78, 90, leftCfg, false);
    const rD = eyePath(122, 90, rightCfg, true);
    const blinkClass = (mood === 'idle' || mood === 'attentive' || mood === 'worried' || mood === 'focused') ? 'puzo-blink' : '';
    return (
      <>
        <g className={blinkClass} style={{ transformBox: 'fill-box', transformOrigin: 'center' } as any}>
          <path d={lD} fill="white" />
        </g>
        <g className={blinkClass} style={{ transformBox: 'fill-box', transformOrigin: 'center' } as any}>
          <path d={rD} fill="white" />
        </g>
      </>
    );
  };

  const renderEyes = () => {
    if (mood === 'loading') {
      return (
        <>
          <g className="puzo-loading-eye" style={{ transformOrigin: '78px 90px' }}>
            <circle cx={78} cy={88} r={7} fill="none" stroke="white" strokeWidth={2.5} strokeDasharray="8 6" />
            <circle cx={78} cy={88} r={2.8} fill="white" opacity={0.7} />
          </g>
          <g className="puzo-loading-eye" style={{ transformOrigin: '122px 90px' }}>
            <circle cx={122} cy={88} r={7} fill="none" stroke="white" strokeWidth={2.5} strokeDasharray="8 6" />
            <circle cx={122} cy={88} r={2.8} fill="white" opacity={0.7} />
          </g>
        </>
      );
    }
    if (mood === 'error') {
      return (
        <>
          <g className="puzo-left-eye">
            <line x1={70} y1={82} x2={86} y2={98} stroke="#FF5A5F" strokeWidth={3.5} strokeLinecap="round" />
            <line x1={86} y1={82} x2={70} y2={98} stroke="#FF5A5F" strokeWidth={3.5} strokeLinecap="round" />
          </g>
          <g className="puzo-right-eye">
            <line x1={114} y1={82} x2={130} y2={98} stroke="#FF5A5F" strokeWidth={3.5} strokeLinecap="round" />
            <line x1={130} y1={82} x2={114} y2={98} stroke="#FF5A5F" strokeWidth={3.5} strokeLinecap="round" />
          </g>
        </>
      );
    }
    if (mood === 'loving') {
      return (
        <>
          <g className="puzo-bounce">
            <path d="M78 82 C74 75 63 79 67 89 C71 96 78 102 78 102 C78 102 85 96 89 89 C93 79 82 75 78 82 Z" fill="url(#puzo-heart-grad)" />
          </g>
          <g className="puzo-bounce">
            <path d="M122 82 C118 75 107 79 111 89 C115 96 122 102 122 102 C122 102 129 96 133 89 C137 79 126 75 122 82 Z" fill="url(#puzo-heart-grad)" />
          </g>
        </>
      );
    }
    if (mood === 'curious') {
      const lD = eyePath(78, 88, { OffsetX: pupilOffset.x * 0.35, OffsetY: pupilOffset.y * 0.35 - 1, Height: 30, Width: 32, Slope_Top: -0.12, Slope_Bottom: 0, Radius_Top: 9, Radius_Bottom: 9, Inverse_Radius_Bottom: 0 }, false);
      const rD = eyePath(122, 92, { OffsetX: pupilOffset.x * 0.35, OffsetY: pupilOffset.y * 0.35 + 1, Height: 22, Width: 28, Slope_Top: 0, Slope_Bottom: 0, Radius_Top: 9, Radius_Bottom: 9, Inverse_Radius_Bottom: 0 }, true);
      return (
        <>
          <path d="M63 70 Q76 63 89 70" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" opacity={0.9} />
          <g className="puzo-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' } as any}>
            <path d={lD} fill="white" />
          </g>
          <g className="puzo-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' } as any}>
            <path d={rD} fill="white" />
          </g>
        </>
      );
    }
    if (mood === 'excited') {
      return (
        <>
          <g className="puzo-bounce">
            <path d={eyePath(78, 88, PRESETS.Surprised, false)} fill="white" />
          </g>
          <g className="puzo-bounce">
            <path d={eyePath(122, 88, PRESETS.Surprised, true)} fill="white" />
          </g>
        </>
      );
    }
    if (isParametricMood) return renderParametricEyes();
    return renderParametricEyes();
  };

  const renderMouth = () => null;

  const blinkDuration = mood === 'attentive' ? '6s' : '4s';
  const robotGroupClass = ['puzo-robot-group', (mood === 'idle' || mood === 'attentive') && 'puzo-bob', mood === 'error' && 'puzo-shake', (mood === 'happy' || mood === 'excited' || mood === 'glee') && 'puzo-bounce'].filter(Boolean).join(' ');

  return (
    <svg ref={svgRef} width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={cn('block mx-auto shrink-0 select-none', className)} style={{ '--pupil-x': `${pupilOffset.x}px`, '--pupil-y': `${pupilOffset.y}px` } as React.CSSProperties}>
      <style>{`
        @keyframes puzo-blink-kf { 0%, 78%, 92%, 100% { transform: scaleY(1); } 82%, 88% { transform: scaleY(0.08); } }
        @keyframes puzo-bob-kf { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-3px); } }
        @keyframes puzo-shake-kf { 0%, 100% { transform: translateX(0px); } 15% { transform: translateX(-4px); } 30% { transform: translateX(4px); } 45% { transform: translateX(-4px); } 60% { transform: translateX(4px); } 75% { transform: translateX(-2px); } 90% { transform: translateX(2px); } }
        @keyframes puzo-bounce-kf { 0%, 100% { transform: translateY(0px); } 40%, 60% { transform: translateY(-7px); } }
        @keyframes puzo-loading-spin-kf { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes puzo-bezel-pulse-kf { 0%, 100% { opacity: 1; } 50% { opacity: 0.82; } }
        @keyframes puzo-speaking-mouth-kf { 0%, 100% { transform: scaleY(0.4); } 30% { transform: scaleY(1.3); } 60% { transform: scaleY(0.5); } 85% { transform: scaleY(1.1); } }
        @keyframes puzo-zzz-float-kf { 0% { transform: translateY(0px); opacity: 0.3; } 100% { transform: translateY(-4px); opacity: 0.8; } }
        .puzo-pupil { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        .puzo-blink { transform-box: fill-box; transform-origin: center; animation: puzo-blink-kf ${blinkDuration} ease-in-out infinite; }
        .puzo-bob { animation: puzo-bob-kf 3s ease-in-out infinite; }
        .puzo-shake { animation: puzo-shake-kf 0.4s ease-in-out 1 forwards; }
        .puzo-bounce { animation: puzo-bounce-kf 0.5s ease-in-out infinite; }
        .puzo-speaking-mouth { transform-box: fill-box; transform-origin: center; animation: puzo-speaking-mouth-kf 0.32s ease-in-out infinite alternate; }
        .puzo-loading-eye { animation: puzo-loading-spin-kf 1s linear infinite; }
        .puzo-bezel-pulse { animation: puzo-bezel-pulse-kf 1s ease-in-out infinite; }
        .puzo-zzz text { animation: puzo-zzz-float-kf 2.5s ease-in-out infinite alternate; }
        .puzo-zzz text:nth-child(2) { animation-delay: 0.3s; }
        .puzo-zzz text:nth-child(3) { animation-delay: 0.6s; }
      `}</style>
      <defs>
        <filter id="puzo-glow-filter"><feGaussianBlur in="SourceGraphic" stdDeviation="12" /></filter>
        <filter id="puzo-eye-glow"><feGaussianBlur in="SourceGraphic" stdDeviation="4" /></filter>
        <filter id="puzo-heart-glow"><feGaussianBlur in="SourceGraphic" stdDeviation="3" /></filter>
        <radialGradient id="puzo-pupil-grad" cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#333" /><stop offset="100%" stopColor="#0a0a0a" /></radialGradient>
        <radialGradient id="puzo-heart-grad" cx="45%" cy="30%" r="65%"><stop offset="0%" stopColor="#FF8A8E" /><stop offset="100%" stopColor="#E03040" /></radialGradient>
        <radialGradient id="puzo-excited-grad" cx="40%" cy="30%" r="65%"><stop offset="0%" stopColor="#FFD166" /><stop offset="100%" stopColor="#FF8A00" /></radialGradient>
      </defs>
      <g className={robotGroupClass}>
        <ellipse cx={100} cy={100} rx={70} ry={55} fill="#68429A" opacity={0.15} filter="url(#puzo-glow-filter)" />
        <rect x={30} y={35} width={140} height={130} rx={38} fill="#292929" stroke="#3A3A3A" strokeWidth={1.5} />
        <circle cx={80} cy={30} r={6} fill="#3A3A3A" />
        <circle cx={120} cy={30} r={6} fill="#3A3A3A" />
        <rect x={42} y={48} width={116} height={95} rx={24} fill="#68429A" className={mood === 'loading' ? 'puzo-bezel-pulse' : undefined} />
        <rect x={52} y={58} width={96} height={75} rx={16} fill="#0A0A0A" />
        {renderEyes()}
        {renderMouth()}
      </g>
    </svg>
  );
}
