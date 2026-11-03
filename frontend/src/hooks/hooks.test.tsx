import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import api from '../services/api'
import { useProjectTypes } from './useProjectTypes'
import { useTheme } from './useTheme'
import { webType } from '../test/fixtures'

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
