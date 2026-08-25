import Breadcrumbs from "./Breadcrumbs";

export default function PageShell({ title, titleLight, subtitle, actions, children, maxWidth = '', className = '', breadcrumb = true, backTo = '', hideBorder = false }) {
  return (
    <div className={`relative min-h-[calc(100vh-4rem)] bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-100/80 shadow-xs w-full max-w-full min-w-0 box-border ${maxWidth} ${className}`}>
      {breadcrumb && (
        <div className="flex items-center gap-3 mb-4">
          <Breadcrumbs />
        </div>
      )}
      {(title || subtitle || actions) && (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 mb-6 ${hideBorder ? '' : 'border-b border-gray-200'}`}>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1B365D] break-words">
              {title}
              {titleLight && <span className="text-neutral-400 font-medium ml-2 text-xs sm:text-sm">{titleLight}</span>}
            </h1>
            {subtitle && <p className="text-xs sm:text-sm text-neutral-600 mt-1 break-words">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="space-y-6 min-w-0">
        {children}
      </div>
    </div>
  );
}
