import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'

export interface ApiQuery<T> {
    data: T
    // For the screen's own edits once something has been saved: a list
    // gains or loses a row without asking the server for all of it again.
    setData: Dispatch<SetStateAction<T>>
    loading: boolean
    error: string
    reload: () => void
}

/**
 * Reads `url` when the component mounts and again whenever it changes. An
 * answer that arrives after the component has moved on is dropped. A null
 * url waits: nothing is asked until the caller knows what to ask.
 *
 * `initial` is what the screen shows before the first answer and keeps if
 * the request fails; `fallbackError` is said when the server gives no
 * message of its own.
 */
export function useApiQuery<T>(url: string | null, initial: T, fallbackError: string): ApiQuery<T> {
    const [data, setData] = useState<T>(initial)
    const [loading, setLoading] = useState(url !== null)
    const [error, setError] = useState('')
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        if (url === null) {
            setLoading(false)
            return
        }

        let cancelled = false
        setLoading(true)
        setError('')

        api.get<T>(url)
            .then(({ data }) => {
                if (!cancelled) setData(data)
            })
            .catch((err) => {
                if (!cancelled) setError(apiErrorMessage(err, fallbackError))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [url, attempt, fallbackError])

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    return { data, setData, loading, error, reload }
}
