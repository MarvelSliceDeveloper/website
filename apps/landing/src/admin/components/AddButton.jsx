import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';

export default function AddButton({ onClick, to, label = 'Add', size = 'sm', className = '', disabled = false, type = 'button', title }) {
  const sizes = {
    xs: 'px-1.5 py-1 lg:py-0.5 gap-1',
    sm: 'px-2 py-1.5 lg:py-1 gap-1.5',
    md: 'px-3 py-2 lg:py-1.5 gap-2',
    lg: 'px-4 py-2 gap-2',
  };
  const textSizes = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };
  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };
  const plusSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };
  const cls = `inline-flex items-center ${sizes[size]} ${textSizes[size]} font-medium rounded-[20px] text-white bg-admin-600 hover:bg-admin-700 transition-colors shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
  const inner = (
    <>
      <span className={`${iconSizes[size]} rounded-full bg-white flex items-center justify-center`}>
        <FiPlus className={`${plusSizes[size]} text-admin-600`} />
      </span>
      {label}
    </>
  );
  if (to) return <Link to={to} className={cls} title={title}>{inner}</Link>;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cls}
    >
      {inner}
    </button>
  );
}
