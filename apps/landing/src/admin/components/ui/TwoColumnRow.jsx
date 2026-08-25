import React from 'react';

export function TwoColumnRow({ children }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {children}
    </div>
  );
}
