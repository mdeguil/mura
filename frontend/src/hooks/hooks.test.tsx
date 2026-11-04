import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import api from '../services/api'
import { useApiQuery } from './useApiQuery'
import { destinationOf, type BellItem } from './useNotifications'
import { useProjectTypes } from './useProjectTypes'
import { useTheme } from './useTheme'
import { apiError, networkError, webType } from '../test/fixtures'
import type { AppNotification } from '../types'

vi.mock('../services/api')

describe('useTheme', () => {
    it('reads the theme index.html put on <html>', () => {
        document.documentElement.dataset.theme = 'light'

        expect(renderHook(() => useTheme()).result.current.theme).toBe('light')
    })

    it('is dark when nothing was chosen', () => {
        expect(renderHook(() => useTheme()).result.current.theme).toBe('dark')
    })

    it('toggles the page and remembers the choice on this device', () => {
        document.documentElement.dataset.theme = 'dark'
        const { result } = renderHook(() => useTheme())

        act(() => result.current.toggle())

        expect(result.current.theme).toBe('light')
        expect(document.documentElement.dataset.theme).toBe('light')
        expect(localStorage.getItem('mura-theme')).toBe('light')
    })

    it('still switches when storage is unavailable', () => {
        const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked')
        })
        document.documentElement.dataset.theme = 'dark'
        const { result } = renderHook(() => useTheme())

        act(() => result.current.toggle())

        expect(document.documentElement.dataset.theme).toBe('light')
        setItem.mockRestore()
    })
})

describe('useApiQuery', () => {
    it('reads the address and stops loading', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: ['a', 'b'] })

        const { result } = renderHook(() => useApiQuery<string[]>('/things', [], 'Raté.'))
        expect(result.current.loading).toBe(true)

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.data).toEqual(['a', 'b'])
        expect(result.current.error).toBe('')
        expect(api.get).toHaveBeenCalledWith('/things')
    })

    it("says the server's message, or the fallback, and keeps the initial data", async () => {
        vi.mocked(api.get).mockRejectedValueOnce(apiError(403, 'Tu n’as pas accès à ce projet.'))
        const { result } = renderHook(() => useApiQuery<string[]>('/things', [], 'Raté.'))
        await waitFor(() => expect(result.current.error).toBe('Tu n’as pas accès à ce projet.'))
        expect(result.current.data).toEqual([])

        vi.mocked(api.get).mockRejectedValueOnce(apiError(500))
        const other = renderHook(() => useApiQuery<string[]>('/things', [], 'Raté.'))
        await waitFor(() => expect(other.result.current.error).toBe('Raté.'))
    })

    it('asks nothing while the address is not known yet', async () => {
        const { result, rerender } = renderHook(({ url }) => useApiQuery<string[]>(url, [], 'Raté.'), {
            initialProps: { url: null as string | null },
        })
        expect(result.current.loading).toBe(false)
        expect(api.get).not.toHaveBeenCalled()

        vi.mocked(api.get).mockResolvedValueOnce({ data: ['x'] })
        rerender({ url: '/later' })
        await waitFor(() => expect(result.current.data).toEqual(['x']))
    })

    it('asks again on reload, clearing the earlier failure', async () => {
        vi.mocked(api.get).mockRejectedValueOnce(networkError())
        const { result } = renderHook(() => useApiQuery<string[]>('/things', [], 'Raté.'))
        await waitFor(() => expect(result.current.error).not.toBe(''))

        vi.mocked(api.get).mockResolvedValueOnce({ data: ['ok'] })
        act(() => result.current.reload())

        await waitFor(() => expect(result.current.data).toEqual(['ok']))
        expect(result.current.error).toBe('')
    })

    it('drops an answer that arrives after the address changed', async () => {
        let answerFirst: (value: { data: string[] }) => void = () => {}
        vi.mocked(api.get)
            .mockImplementationOnce(() => new Promise((resolve) => (answerFirst = resolve)))
            .mockResolvedValueOnce({ data: ['second'] })
        const { result, rerender } = renderHook(({ url }) => useApiQuery<string[]>(url, [], 'Raté.'), {
            initialProps: { url: '/first' },
        })

        rerender({ url: '/second' })
        await waitFor(() => expect(result.current.data).toEqual(['second']))
        act(() => answerFirst({ data: ['first'] }))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.data).toEqual(['second'])
    })

    it('lets the screen edit what it holds', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: ['a'] })
        const { result } = renderHook(() => useApiQuery<string[]>('/things', [], 'Raté.'))
        await waitFor(() => expect(result.current.loading).toBe(false))

        act(() => result.current.setData((prev) => [...prev, 'b']))

        expect(result.current.data).toEqual(['a', 'b'])
    })
})

describe('destinationOf', () => {
    const notification = (extra: Partial<AppNotification>): BellItem => {
        const n = { id: 'n1', type: 'ADDED_TO_PROJECT', createdAt: '', read: false, ...extra } as AppNotification
        return { kind: 'notification', id: n.id, createdAt: n.createdAt, read: n.read, notification: n }
    }

    it('opens the project, the group or the carnet the line is about', () => {
        expect(destinationOf(notification({ projectId: 'p1' }))).toEqual({ href: '/project/p1', label: 'le projet' })
        expect(destinationOf(notification({ groupId: 'g1', groupName: 'Design' }))).toEqual({
            href: '/groupe/g1',
            label: 'le groupe',
        })
        expect(destinationOf(notification({ type: 'CONTACT_REQUESTED' }))?.href).toBe('/carnet')
    })

    it('falls back to the carnet for a group that is gone, and to nothing otherwise', () => {
        expect(destinationOf(notification({ groupId: null, groupName: 'Ancien' }))?.href).toBe('/carnet')
        expect(destinationOf(notification({ projectId: null }))).toBeNull()
    })
})

describe('useProjectTypes', () => {
    it('loads the types once and stops loading', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: [webType] })

        const { result } = renderHook(() => useProjectTypes())
        expect(result.current.loading).toBe(true)

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.types).toEqual([webType])
        expect(api.get).toHaveBeenCalledWith('/project-types')
    })

    it('ends with an empty list when the request fails', async () => {
        vi.mocked(api.get).mockRejectedValueOnce(new Error('down'))

        const { result } = renderHook(() => useProjectTypes())

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.types).toEqual([])
    })
})
