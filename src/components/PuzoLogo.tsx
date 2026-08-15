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

        {/* LEFT EYE - OPEN */}
        <g className="left-eye">
          <ellipse cx="49" cy="54" rx="6" ry="9" fill="white" />
          <ellipse cx="51" cy="53" rx="2.5" ry="4" fill="#171717" />
        </g>

        {/* RIGHT EYE - WINK */}
        <g className="right-eye">
          <ellipse className="wink-eye" cx="71" cy="54" rx="6" ry="9" fill="white" />
          <ellipse className="wink-pupil" cx="73" cy="53" rx="2.5" ry="4" fill="#171717" />
        </g>

        {/* SIMPLE SMILE */}
        <path
          d="M55 66 Q60 70 65 66"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <style jsx>{`
          .wink-eye,
          .wink-pupil {
            transform-box: fill-box;
            transform-origin: center;
            animation: wink 4s infinite;
          }

          @keyframes wink {
            0%, 78%, 100% {
              transform: scaleY(1);
            }
            82%, 88% {
              transform: scaleY(0.08);
            }
            92% {
              transform: scaleY(1);
            }
          }
        `}</style>
      </svg>
    );
  }

  // Static logo for UI header, sidebar, login page
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

      {/* LEFT EYE - OPEN */}
      <g className="left-eye">
        <ellipse cx="49" cy="54" rx="6" ry="9" fill="white" />
        <ellipse cx="51" cy="53" rx="2.5" ry="4" fill="#171717" />
      </g>

      {/* RIGHT EYE */}
      <g className="right-eye">
        <ellipse cx="71" cy="54" rx="6" ry="9" fill="white" />
        <ellipse cx="73" cy="53" rx="2.5" ry="4" fill="#171717" />
      </g>

      {/* SIMPLE SMILE */}
      <path
        d="M55 66 Q60 70 65 66"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
