export default function EmptyState({ title, hint }) {
  return (
    <div className="text-center py-10 px-4">
      <p className="text-base font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {hint && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {hint}
        </p>
      )}
    </div>
  )
}
