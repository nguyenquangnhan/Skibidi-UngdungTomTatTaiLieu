export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-[2.5px]'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} rounded-full animate-spin`}
        style={{
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderTopColor: '#6366f1',
          borderRightColor: '#6366f1',
          boxShadow: '0 0 20px -3px rgba(99, 102, 241, 0.3)',
        }}
      />
      {text && (
        <p className="text-xs font-medium text-slate-400 tracking-wide">
          {text}
        </p>
      )}
    </div>
  )
}
