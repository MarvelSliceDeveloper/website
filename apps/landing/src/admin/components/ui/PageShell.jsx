import Breadcrumbs from "./Breadcrumbs";

export default function PageShell({ title, titleLight, subtitle, actions, children, maxWidth = '', className = '', breadcrumb = true, backTo = '', hideBorder = false }) {
  return (
    <div className={`relative min-h-[calc(100vh-4rem)] bg-white p-4 lg:p-8 ${maxWidth} ${className}`}>
      {breadcrumb && (
        <div className="flex items-center gap-3 mb-5">
          <Breadcrumbs />
        </div>
      )}
      {(title || subtitle || actions) && (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 mb-6 ${hideBorder ? '' : 'border-b-[2px] border-[#175cdd]'}`}>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-black">
              {title}
              {titleLight && <span className="text-neutral-400 font-medium ml-2 text-sm">{titleLight}</span>}
            </h1>
            {subtitle && <p className="text-sm text-neutral-700 mt-1">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex items-center gap-3 self-start sm:self-auto">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
