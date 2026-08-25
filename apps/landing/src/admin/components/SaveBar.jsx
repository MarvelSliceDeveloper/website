import { FiSave, FiCheck, FiAlertCircle, FiX } from 'react-icons/fi';
import AdminButton from './AdminButton';

export default function SaveBar({ saving, saved, saveError, onSave, onDiscard, label = 'Save', top = false, dirty }) {
  if (top) {
    return (
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {saveError && (
          <div className="p-4 bg-destructive-50 border border-destructive-500 rounded-xl flex items-center gap-3 text-destructive-700 text-sm shadow-xl animate-fade-in-up pointer-events-auto min-w-[300px] max-w-[calc(100vw-2rem)]">
            <FiAlertCircle className="w-5 h-5 shrink-0" /> {saveError}
          </div>
        )}
        {saved && (
          <div className="p-4 bg-success-50 border border-success-500 rounded-xl flex items-center gap-3 text-success-700 text-sm shadow-xl animate-fade-in-up pointer-events-auto min-w-[300px] max-w-[calc(100vw-2rem)]">
            <FiCheck className="w-5 h-5 shrink-0 text-success-600" /> 
            <span className="font-medium">{label} saved successfully!</span>
          </div>
        )}
      </div>
    );
  }

  // Standard inline action buttons at the bottom of forms/editors
  return (
    <div className="mt-8 pt-6 border-t border-admin-200 flex items-center justify-center gap-2 w-full">
      {onDiscard && (
        <button 
          type="button"
          onClick={onDiscard} 
          disabled={saving} 
          className="px-4 py-2 text-sm font-semibold text-white bg-destructive-500 hover:bg-destructive-600 rounded-lg shadow-sm transition-colors flex items-center gap-2 active:scale-[0.98]"
        >
          <FiX className="w-4 h-4" /> Cancel
        </button>
      )}
      <AdminButton onClick={onSave} disabled={saving} variant="primary" size="md" className="!px-6">
        <FiSave className="w-4.5 h-4.5" /> {saving ? 'Saving...' : label ? `Save ${label}` : 'Save'}
      </AdminButton>
    </div>
  );
}
