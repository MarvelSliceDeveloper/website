import { FiSave, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

export default function SaveCancelBar({ saving, saved, saveError, onSave, onDiscard }) {
  return (
    <div>
      <div className="flex justify-center items-center gap-4 mt-4 mb-2">
        {onDiscard && (
          <button type="button" onClick={onDiscard} disabled={saving}
            className="w-28 min-w-[100px] flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium rounded-[20px] text-white bg-[#FF0000] hover:bg-[#CC0000] transition-colors shadow-sm cursor-pointer disabled:opacity-50">
            <FiX className="w-4 h-4" /> Cancel
          </button>
        )}
        <button type="button" onClick={onSave} disabled={saving}
          className="w-28 min-w-[100px] flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium rounded-[20px] text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-sm cursor-pointer disabled:opacity-70">
          {saving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <FiCheck className="w-4 h-4" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
      </div>
      {saveError && (
        <div className="flex justify-center text-red-500 text-xs mt-1 font-medium">
          <FiAlertCircle className="w-4 h-4 mr-1.5" />
          {saveError}
        </div>
      )}
    </div>
  );
}
