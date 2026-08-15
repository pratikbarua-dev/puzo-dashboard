'use client';

interface PuzoLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function PuzoLogo({ size = 40, animated = false, className }: PuzoLogoProps) {
  if (animated) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Robot body */}
        <rect
          x="20"
          y="20"
          width="80"
          height="75"
          rx="22"
          fill="#292929"
          stroke="#454545"
          strokeWidth="1"
        />

        {/* Purple screen */}
        <rect x="30" y="30" width="60" height="55" rx="13" fill="#68429A" />

        {/* Black display */}
        <rect x="36" y="36" width="48" height="43" rx="8" fill="#050505" />

        {/* LEFT EYE */}
        <g className="left-eye">
          <ellipse cx="49" cy="54" rx="6" ry="9" fill="white" />
          <ellipse cx="51" cy="53" rx="2.5" ry="4" fill="#171717" />
        </g>

        {/* RIGHT EYE / WINK */}
        <g transform="translate(71 54)" className="right-eye">
          <ellipse className="wink-eye" cx="0" cy="0" rx="6" ry="9" fill="white" />
          <ellipse className="wink-eye" cx="2" cy="-1" rx="2.5" ry="4" fill="#171717" />
        </g>

        {/* PUCKERED KISS MOUTH */}
        <g className="kiss-mouth">
          <path
            d="M57 64.8 C58.2 63.2 60.2 63.2 60.8 64.7 C61.4 63.2 63.4 63.2 64.5 64.8 C63.7 66.2 62.4 66.5 61.5 66 C62.4 66.8 62.9 67.5 62.2 68 C60.8 68.8 59.1 68.2 58.8 67 C58.2 67.7 56.8 67.5 56.5 66.5 C56.3 65.8 56.6 65.2 57 64.8 Z"
            fill="white"
          />
          <path
            d="M58.2 65.8 Q60.2 66.7 62.7 65.8"
            fill="none"
            stroke="#171717"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        </g>

        {/* HEART */}
        <g className="kiss-heart">
          <path
            d="M68 64 C66 61 61 63 63 67 C64 69 68 72 68 72 C68 72 72 69 73 67 C75 63 70 61 68 64 Z"
            fill="#ff3158"
          />
        </g>

        <style jsx>{`
          .wink-eye {
            transform-box: fill-box;
            transform-origin: center;
            animation: wink 4s infinite;
          }
          @keyframes wink {
            0%, 82%, 100% {
              transform: scaleY(1);
            }
            85%, 89% {
              transform: scaleY(0.08);
            }
            92% {
              transform: scaleY(1);
            }
          }
          .kiss-mouth {
            transform-box: fill-box;
            transform-origin: center;
            animation: kiss 4s infinite;
          }
          @keyframes kiss {
            0%, 82%, 100% {
              opacity: 0;
              transform: scale(0.8);
            }
            84% {
              opacity: 1;
              transform: scale(0.9);
            }
            87% {
              opacity: 1;
              transform: scale(1.12);
            }
            91% {
              opacity: 0;
              transform: scale(1);
            }
          }
          .kiss-heart {
            transform-box: fill-box;
            transform-origin: center;
            opacity: 0;
            animation: heart-kiss 4s infinite;
          }
          @keyframes heart-kiss {
            0%, 84% {
              opacity: 0;
              transform: translate(0, 0) scale(0.3);
            }
            87% {
              opacity: 1;
              transform: translate(2px, -2px) scale(1);
            }
            92% {
              opacity: 0;
              transform: translate(8px, -7px) scale(0.6);
            }
            100% {
              opacity: 0;
              transform: translate(8px, -7px) scale(0.6);
            }
          }
        `}</style>
      </svg>
    );
  }

  // Static logo for UI header, sidebar, login page (no kissing animation)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Robot body */}
      <rect
        x="20"
        y="20"
        width="80"
        height="75"
        rx="22"
        fill="#292929"
        stroke="#454545"
        strokeWidth="1"
      />

      {/* Purple screen */}
      <rect x="30" y="30" width="60" height="55" rx="13" fill="#68429A" />

      {/* Black display */}
      <rect x="36" y="36" width="48" height="43" rx="8" fill="#050505" />

      {/* LEFT EYE */}
      <g className="left-eye">
        <ellipse cx="49" cy="54" rx="6" ry="9" fill="white" />
        <ellipse cx="51" cy="53" rx="2.5" ry="4" fill="#171717" />
      </g>

      {/* RIGHT EYE */}
      <g transform="translate(71 54)" className="right-eye">
        <ellipse cx="0" cy="0" rx="6" ry="9" fill="white" />
        <ellipse cx="2" cy="-1" rx="2.5" ry="4" fill="#171717" />
      </g>
    </svg>
  );
}
