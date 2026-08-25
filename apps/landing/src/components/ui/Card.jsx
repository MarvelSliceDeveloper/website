export default function Card({
  children,
  accent = false,
  className = '',
  ...props
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 transition-shadow duration-300 hover:shadow-md ${accent ? 'border-l-4 border-brand-orange' : ''} ${className}`}
      style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}
      {...props}
    >
      {children}
    </div>
  );
}
