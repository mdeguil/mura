import ErrorMessage from './ErrorMessage'

export interface LoadFailure {
    message: string
    retry: () => void
}

// Several requests failing for the same reason -- the server out of reach,
// most often -- say so once, and its one Réessayer asks them all again.
export default function LoadErrors({ failures, className = '' }: { failures: LoadFailure[]; className?: string }) {
    const byMessage = new Map<string, Array<() => void>>()
    for (const { message, retry } of failures) {
        byMessage.set(message, [...(byMessage.get(message) ?? []), retry])
    }

    return (
        <>
            {[...byMessage].map(([message, retries]) => (
                <ErrorMessage key={message} onRetry={() => retries.forEach((retry) => retry())} className={className}>
                    {message}
                </ErrorMessage>
            ))}
        </>
    )
}
