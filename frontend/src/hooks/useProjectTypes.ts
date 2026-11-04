import { useApiQuery } from './useApiQuery'
import type { ProjectType } from '../types'

// The types are rows now, so every screen that names one has to ask. Kept in
// a hook rather than a constant for exactly that reason: an administrator can
// add one while somebody else has the app open.
export function useProjectTypes() {
    const { data: types, loading, error } = useApiQuery<ProjectType[]>(
        '/project-types',
        [],
        'Impossible de charger les types de projet.'
    )
    return { types, loading, error }
}
