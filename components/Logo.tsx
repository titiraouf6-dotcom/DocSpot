"use client";

interface LogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function Logo({ size = 40, animate = false, className = "" }: LogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${animate ? "animate-pulse-slow" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        {/* Heart shape */}
        <path
          d="M50 88C50 88 10 65 10 38C10 24 20 14 33 14C41 14 47.5 18.5 50 25C52.5 18.5 59 14 67 14C80 14 90 24 90 38C90 65 50 88 50 88Z"
          fill="#10B981"
        />
        {/* Heartbeat / ECG line */}
        <polyline
          points="18,50 32,50 38,50 42,35 46,62 50,42 54,55 58,46 62,50 68,50 82,50"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
