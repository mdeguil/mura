import ErrorMessage from './ErrorMessage'

/** A request that failed to load, and how to ask it again. */
export interface LoadFailure {
    /** What went wrong. */
    message: string
    /** Asks the request again. */
    retry: () => void
}

/**
 * The load failures of a screen. Several requests failing for the same
 * reason -- the server out of reach, most often -- say so once, and its one
 * Réessayer asks them all again.
 *
 * @param props the failures, and where to place them
 */
export default function LoadErrors({
    failures,
    className = '',
}: {
    /** The requests that failed; none shows nothing. */
    failures: LoadFailure[]
    /** Classes for spacing around each message. */
    className?: string
}) {
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
