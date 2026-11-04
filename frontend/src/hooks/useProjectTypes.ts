import { useApiQuery } from './useApiQuery'
import type { ProjectType } from '../types'

/**
 * The project types, read from the server. They are rows, so every screen
 * that names one has to ask -- kept in a hook rather than a constant for
 * exactly that reason: an administrator can add one while somebody else has
 * the app open.
 *
 * @returns the `types` in the order offered, whether they are still
 *          `loading`, and the `error` if they could not be read
 */
export function useProjectTypes() {
    const { data: types, loading, error } = useApiQuery<ProjectType[]>(
        '/project-types',
        [],
        'Impossible de charger les types de projet.'
    )
    return { types, loading, error }
}
