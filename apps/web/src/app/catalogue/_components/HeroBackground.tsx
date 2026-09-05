"use client";
export default function HeroBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none z-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-white" />
      <svg className="hidden lg:block absolute inset-0 w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="730,0 1000,0 1000,600 450,600" fill="#1E56C7" />
      </svg>
    </div>
  );
}
