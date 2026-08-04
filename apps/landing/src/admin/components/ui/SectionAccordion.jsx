import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function SectionAccordion({ title, defaultExpanded = false, expanded: controlledExpanded, onToggle, children }) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  function handleToggle() {
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalExpanded((p) => !p);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-admin-200 overflow-hidden mb-6 w-full">
      <button 
        type="button" 
        onClick={handleToggle} 
        className={`w-full flex items-center justify-between px-6 py-2.5 bg-brand-blue hover:bg-blue-700 transition-colors ${expanded ? 'border-b border-white/20' : ''}`}
      >
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {expanded ? (
          <FiChevronUp className="w-5 h-5 text-white" />
        ) : (
          <FiChevronDown className="w-5 h-5 text-white" />
        )}
      </button>
      {expanded && (
        <div className="p-6 space-y-6">
          {children}
        </div>
      )}
    </div>
  );
}
