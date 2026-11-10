import axios from 'axios'
import i18n from '../i18n'

/**
 * What to tell the reader about a failed request. The backend answers every
 * failure with `{ message }`, written for the person reading it and in the
 * language the request asked for, so it beats anything the caller could
 * invent. The one case it cannot speak for is the request never arriving.
 *
 * @param err whatever the request rejected with
 * @param fallback what to say when the server gave no message
 * @returns the server's message, a connection message, or the fallback
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
    if (!axios.isAxiosError(err)) return fallback

    if (!err.response) {
        return i18n.t('common.unreachable')
    }

    return (err.response.data as { message?: string } | undefined)?.message || fallback
}

/**
 * Which input the message is about, when the backend says so. Four inputs
 * on the signup form means a message floating at the bottom makes the
 * reader hunt for the one to fix.
 *
 * @param err whatever the request rejected with
 * @returns the name of the field, as the request named it, or null
 */
export function apiErrorField(err: unknown): string | null {
    if (!axios.isAxiosError(err)) return null
    return (err.response?.data as { field?: string } | undefined)?.field ?? null
}
