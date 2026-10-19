import axios from 'axios'

// The backend answers every failure with { message }, and those messages are
// written for the person reading them ("Cet email est déjà utilisé."), so
// they beat anything the caller could invent. The one case it cannot speak
// for is the request never arriving.
export function apiErrorMessage(err: unknown, fallback: string): string {
    if (!axios.isAxiosError(err)) return fallback

    if (!err.response) {
        return 'Serveur injoignable. Vérifie ta connexion et réessaie.'
    }

    return (err.response.data as { message?: string } | undefined)?.message || fallback
}
