import { useState } from 'react';

export default function TabBar({ tabs, activeIndex = 0, onChange }) {
  const [active, setActive] = useState(activeIndex);

  function handleClick(i) {
    setActive(i);
    onChange?.(i);
  }

  return (
    <div className="relative z-30 flex items-center flex-nowrap min-w-0 pb-4 -mb-4 gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
      {tabs.map((label, i) => {
        const isActive = i === active;
        return (
          <button
            key={label}
            type="button"
            onClick={() => handleClick(i)}
            className={`relative px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-t-lg sm:rounded-t-xl text-xs sm:text-sm font-semibold whitespace-nowrap border-0 outline-none transition-all cursor-pointer select-none ${
              isActive
                ? 'bg-[#f59e0b] text-white z-30 shadow-xs'
                : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 z-10'
            }`}
          >
            {label}
            {isActive && (
              <span className="absolute -bottom-1 sm:-bottom-1.5 left-1/2 -translate-x-1/2 rotate-45 w-2 h-2 sm:w-3 sm:h-3 bg-[#f59e0b] pointer-events-none z-50" />
            )}
          </button>
        );
      })}
    </div>
  );
}
