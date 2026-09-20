export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
      <div className="w-full sm:w-auto max-w-2xl">
        <h1 className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-slate-800 dark:text-slate-100 mb-1">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action ? <div className="w-full sm:w-auto flex-shrink-0">{action}</div> : null}
    </div>
  )
}
