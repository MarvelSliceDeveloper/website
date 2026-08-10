import React from 'react';

export default function SectionSelect({ items = [], value, onChange, label }) {
  return (
    <div className="lg:hidden mb-4">
      {label && <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all cursor-pointer"
      >
        {items.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
