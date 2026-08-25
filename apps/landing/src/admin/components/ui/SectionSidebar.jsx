import React from "react";

export function SectionSidebar({ navItems, activeItemKey, onNavClick }) {
  return (
    <div className="w-full lg:w-[220px] lg:shrink-0 transition-all duration-200">
      <nav className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto admin-scrollbar">
        <div className="bg-white rounded-xl border border-admin-200 shadow-sm p-2 flex lg:flex-col gap-1 lg:gap-0.5 overflow-x-auto lg:overflow-x-visible scrollbar-hide lg:space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeItemKey === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavClick(item.key)}
                className={`cursor-pointer flex items-center text-sm font-medium text-left transition-all rounded-lg min-h-[40px] pl-2 pr-2.5 py-2 gap-2 whitespace-nowrap shrink-0 lg:shrink lg:whitespace-normal lg:w-full ${
                  isActive
                    ? "bg-blue-50 text-brand-blue font-semibold border-l-[3px] border-brand-blue -ml-[1px]"
                    : "text-neutral-600 hover:bg-blue-50 hover:text-brand-blue border-l-[3px] border-transparent"
                }`}
                title={item.label}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-blue" : "text-neutral-400"}`}
                  />
                )}
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
