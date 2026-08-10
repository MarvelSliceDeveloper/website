import { FiSave, FiCheck, FiX } from 'react-icons/fi';

const base =
  'w-28 min-w-[100px] inline-flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium rounded-[20px] transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export function CancelButton({ onClick, label = 'Cancel', disabled = false, className = '' }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} text-white bg-[#FF0000] hover:bg-[#CC0000] ${className}`}>
      <FiX className="w-4 h-4" /> {label}
    </button>
  );
}

export function SubmitButton({ saving, saved, label = 'Save', savingLabel = 'Saving...', savedLabel = 'Saved!', type = 'button', onClick, disabled = false, className = '', icon: Icon = FiSave }) {
  return (
    <button
      type={type}
      onClick={type === 'submit' ? undefined : onClick}
      disabled={disabled || saving}
      className={`${base} text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-70 ${className}`}
    >
      {saving ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : saved ? (
        <FiCheck className="w-4 h-4" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {saving ? savingLabel : saved ? savedLabel : label}
    </button>
  );
}
