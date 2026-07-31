import React from 'react';
import PageShell from './PageShell';
import SaveBar from '../SaveBar';
import { SectionSidebar } from './SectionSidebar';

export function PageEditorLayout({
  title,
  backTo = '/admin',
  navItems = [],
  activeSectionKey,
  onNavClick,
  saving,
  saved,
  saveError,
  onSave,
  dirty,
  children
}) {
  const selectedNav = navItems.find(n => n.key === activeSectionKey) || navItems[0];
  
  return (
    <PageShell backTo={backTo} title={title} maxWidth="max-w-none">
      <div className="flex gap-6 items-start">
        <SectionSidebar navItems={navItems} activeItemKey={activeSectionKey} onNavClick={onNavClick} />
        
        <div className="flex-1 min-w-0">
          {selectedNav && (
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedNav.label}</h2>
                <p className="text-sm text-neutral-500 mt-0.5">Manage {selectedNav.label.toLowerCase()} section assets, content, and display settings.</p>
              </div>
            </div>
          )}
          {onSave && <SaveBar saving={saving} saved={saved} saveError={saveError} onSave={onSave} label="Page" top />}
          
          <div className="mb-6 space-y-6">
             {children}
          </div>
          
          {onSave && <SaveBar saving={saving} saved={saved} saveError={saveError} onSave={onSave} label="Page" dirty={dirty} onDiscard={() => window.location.reload()} />}
        </div>
      </div>
    </PageShell>
  );
}
