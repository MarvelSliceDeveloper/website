import React from 'react';
import AddButton from '../AddButton';

export function RepeatableItemList({ title = "Items", items = [], onAdd, addLabel = "Add Item", emptyLabel = "No items yet.", renderItem }) {
  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-black">{title}</h4>
        <AddButton onClick={onAdd} label={addLabel} />
      </div>
      {items.length === 0 && <p className="text-sm text-neutral-400 italic">{emptyLabel}</p>}
      <div className="space-y-3">
        {items.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  );
}
