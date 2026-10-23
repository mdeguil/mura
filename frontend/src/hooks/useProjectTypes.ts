import { useEffect, useState } from 'react'
import api from '../services/api'
import type { ProjectType } from '../types'

// The types are rows now, so every screen that names one has to ask. Kept in
// a hook rather than a constant for exactly that reason: an administrator can
// add one while somebody else has the app open.
export function useProjectTypes() {
    const [types, setTypes] = useState<ProjectType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        api.get<ProjectType[]>('/project-types')
            .then(({ data }) => {
                if (!cancelled) setTypes(data)
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    return { types, loading }
}
