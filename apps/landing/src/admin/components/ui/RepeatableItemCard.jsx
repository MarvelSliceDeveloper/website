import React, { useState } from "react";
import { FiTrash2, FiChevronDown } from "react-icons/fi";

export function RepeatableItemCard({
  index,
  label = "Item",
  title,
  onRemove,
  collapsible = false,
  defaultExpanded = true,
  children,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-lg border border-admin-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`flex items-center gap-2 ${collapsible ? "cursor-pointer" : ""}`}
          onClick={() => collapsible && setExpanded(!expanded)}
        >
          <span className="text-xs font-semibold text-black uppercase tracking-wider">
            {label} {index + 1}
          </span>
          {title && <span className="text-xs text-neutral-500">— {title}</span>}
          {collapsible && (
            <FiChevronDown
              className={`w-4 h-4 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-destructive-50 rounded-lg transition-colors"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>
      {(!collapsible || expanded) && (
        <div className="space-y-3 pt-1">{children}</div>
      )}
    </div>
  );
}
