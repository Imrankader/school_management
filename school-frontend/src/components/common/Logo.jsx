import React from 'react';

// The EduCore mark: an open book whose pages lift into a graduation cap,
// with a small gold spark standing in for achievement. Layered gradients,
// an inner highlight and a drop shadow are what give a flat SVG the
// dimensional, "app icon" feel the brand box it replaced didn't have.
export const Logo = ({ size = 34 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="EduCore"
    role="img"
  >
    <defs>
      <linearGradient id="educore-tile" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#6366f1" />
        <stop offset="0.55" stopColor="#4f46e5" />
        <stop offset="1" stopColor="#3730a3" />
      </linearGradient>
      <linearGradient id="educore-page" x1="8" y1="14" x2="32" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#e0e7ff" />
      </linearGradient>
      <radialGradient id="educore-spark" cx="0.3" cy="0.3" r="0.9">
        <stop offset="0" stopColor="#fde68a" />
        <stop offset="1" stopColor="#f59e0b" />
      </radialGradient>
      <filter id="educore-shadow" x="-20%" y="-10%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#1e1b4b" floodOpacity="0.35" />
      </filter>
    </defs>

    <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#educore-tile)" />
    <rect x="2.5" y="2.5" width="35" height="16" rx="9.5" fill="#ffffff" opacity="0.1" />
    <rect x="2" y="2" width="36" height="36" rx="10" fill="none" stroke="#ffffff" strokeOpacity="0.14" />

    <g filter="url(#educore-shadow)">
      <path
        d="M20 15.5L9 20.5V27.2C9 27.2 13.8 29.6 20 29.6C26.2 29.6 31 27.2 31 27.2V20.5L20 15.5Z"
        fill="url(#educore-page)"
      />
      <path d="M20 15.5L9 20.5L20 24.8L31 20.5L20 15.5Z" fill="#ffffff" />
      <path d="M20 15.5L9 20.5L20 24.8L31 20.5L20 15.5Z" fill="#ffffff" opacity="0.5" />
    </g>

    <circle cx="29.5" cy="11.5" r="3.6" fill="url(#educore-spark)" />
    <path d="M29.5 9.3V13.7M27.3 11.5H31.7" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
  </svg>
);
