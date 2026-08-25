export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon || (
        <div className="w-12 h-12 rounded-xl bg-admin-100 flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-admin-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}
      {title && (
        <h3 className="text-sm font-semibold text-neutral-700 mb-1">{title}</h3>
      )}
      {description && (
        <p className="text-xs text-neutral-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-destructive-50 flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-destructive-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-neutral-700 mb-1">
        Something went wrong
      </h3>
      <p className="text-xs text-neutral-400 max-w-xs mb-4">
        {message || "An unexpected error occurred."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-admin-600 hover:text-admin-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
