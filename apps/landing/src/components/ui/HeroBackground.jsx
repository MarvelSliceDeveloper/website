import React from 'react';

/**
 * HeroBackground Component
 * Exact slanted half-split background matching Marvel Slice layout:
 * Left side: Clean White
 * Right side: Solid Marvel Blue (#1E56C7) slanted from ~73% top to ~45% bottom
 */
export default function HeroBackground({ className = '' }) {
  return (
    <div className={`absolute inset-0 pointer-events-none z-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Left Base White Layer */}
      <div className="absolute inset-0 bg-white" />

      {/* Slanted Right Side Solid Blue Shape */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon points="730,0 1000,0 1000,600 450,600" fill="#1E56C7" />
      </svg>
    </div>
  );
}
