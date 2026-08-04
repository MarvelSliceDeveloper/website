export default function FolderTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="relative flex items-end flex-1 overflow-x-auto pt-2 z-20">
      {tabs.map((tab, i) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
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
                className={`block text-sm font-semibold whitespace-nowrap ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
                style={{ transform: 'skewX(14deg)' }}
              >
                {tab.title}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
