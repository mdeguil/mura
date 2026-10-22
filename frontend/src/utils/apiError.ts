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

// Which input the message is about, when the backend says so. Four inputs on
// the signup form means a message floating at the bottom makes the reader
// hunt for the one to fix.
export function apiErrorField(err: unknown): string | null {
    if (!axios.isAxiosError(err)) return null
    return (err.response?.data as { field?: string } | undefined)?.field ?? null
}
