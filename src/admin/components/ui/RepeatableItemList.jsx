import React from 'react';
import AdminButton from '../AdminButton';
import { FiPlus } from 'react-icons/fi';

export function RepeatableItemList({ title = "Items", items = [], onAdd, addLabel = "Add Item", emptyLabel = "No items yet.", renderItem }) {
  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-black">{title}</h4>
        <AdminButton type="button" onClick={onAdd} variant="primary" size="sm">
          <FiPlus className="w-4 h-4" /> {addLabel}
        </AdminButton>
      </div>
      {items.length === 0 && <p className="text-sm text-neutral-400 italic">{emptyLabel}</p>}
      <div className="space-y-3">
        {items.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  );
}
