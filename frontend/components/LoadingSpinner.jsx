export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} rounded-full border-2 animate-spin`}
        style={{
          borderColor: 'var(--border)',
          borderTopColor: 'var(--primary)',
        }}
      />
      {text && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{text}</p>}
    </div>
  )
}
