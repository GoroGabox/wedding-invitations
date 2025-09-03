"use client";

export default function FloralDivider() {
  return (
    <div className="my-4 flex items-center justify-center">
      <svg width="180" height="18" viewBox="0 0 180 18" aria-hidden className="opacity-70">
        <path d="M5 9 H75" stroke="currentColor" strokeWidth="1" />
        <path d="M105 9 H175" stroke="currentColor" strokeWidth="1" />
        <g transform="translate(90,9)">
          <circle r="5" fill="currentColor" />
          <path d="M-2,-2 C-6,-6 -8,-10 -10,-14" stroke="currentColor" strokeWidth="1" fill="none"/>
          <path d="M2,-2 C6,-6 8,-10 10,-14" stroke="currentColor" strokeWidth="1" fill="none"/>
        </g>
      </svg>
    </div>
  );
}