// A failure the reader has to know about, announced to screen readers as it
// appears. With onRetry it offers to ask again, which is usually all a lost
// connection needs.
export default function ErrorMessage({
    children,
    onRetry,
    className = '',
}: {
    children: React.ReactNode
    onRetry?: () => void
    className?: string
}) {
    return (
        <div
            role="alert"
            className={`text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 flex items-center justify-between gap-3 ${className}`}
        >
            <span>{children}</span>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="shrink-0 text-xs font-medium underline underline-offset-2 hover:no-underline"
                >
                    Réessayer
                </button>
            )}
        </div>
    )
}
