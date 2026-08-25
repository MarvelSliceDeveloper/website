import { useRef, useEffect } from 'react';

export default function FolderTabs({ tabs, activeTab, onChange }) {
  const containerRef = useRef(null);
  const tabsRef = useRef(tabs);
  const prevActiveRef = useRef(activeTab);
  tabsRef.current = tabs;

  useEffect(() => {
    if (prevActiveRef.current === activeTab) return;
    prevActiveRef.current = activeTab;
    const container = containerRef.current;
    if (!container) return;
    const idx = tabsRef.current.findIndex(t => t.id === activeTab);
    const btn = idx >= 0 ? container.querySelector(`[data-tab-index="${idx}"]`) : null;
    if (btn && typeof btn.scrollIntoView === 'function') {
      btn.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <div ref={containerRef} className="relative flex items-end flex-1 min-w-0 overflow-x-auto scrollbar-hide pt-2 z-20">
      {tabs.map((tab, i) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            data-tab-index={i}
            type="button"
            onClick={() => onChange(tab.id)}
            className="relative outline-none flex-shrink-0"
            style={{
              marginLeft: i === 0 ? 4.5 : -16,
              zIndex: isActive ? 40 : tabs.length - i,
            }}
          >
            <div
              className={`flex items-center transition-colors duration-150 ${
                isActive ? 'bg-admin-600' : 'bg-white hover:bg-gray-50'
              }`}
              style={{
                height: '35px',
                transform: 'skewX(-14deg)',
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                paddingLeft: 20,
                paddingRight: 20,
                border: isActive ? 'none' : '1px solid #E5E7EB',
                borderBottom: 'none',
                boxShadow: isActive
                  ? '0 -3px 10px rgba(37,99,235,0.28)'
                  : '0 -2px 6px rgba(0,0,0,0.06)',
              }}
            >
              <span
                className={`flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
                style={{ transform: 'skewX(14deg)' }}
              >
                {tab.icon && <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`} />}
                {tab.title}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
