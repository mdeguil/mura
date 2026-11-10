import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LegalLinks, { MURA_WEBSITE } from '../components/LegalLinks'
import LanguageSwitch from '../components/LanguageSwitch'
import en from './en'
import fr from './fr'
import { currentLanguage, initialLanguage } from '.'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { account } from '../test/fixtures'

vi.mock('../services/api')

function keysOf(value: object, prefix = ''): string[] {
    return Object.entries(value).flatMap(([key, child]) =>
        typeof child === 'object' && child !== null ? keysOf(child, `${prefix}${key}.`) : [`${prefix}${key}`]
    )
}

describe('languages', () => {
    it('gives every French text an English one, and no more', () => {
        expect(keysOf(en).sort()).toEqual(keysOf(fr).sort())
        for (const key of keysOf(en)) {
            const text = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en)
            expect(text, key).not.toBe('')
        }
    })

    it('switches the footer, the page language and the saved choice together', async () => {
        render(<MemoryRouter><LegalLinks /></MemoryRouter>)
        expect(screen.getByRole('link', { name: 'Mentions légales' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'true')

        await userEvent.click(screen.getByRole('button', { name: 'English' }))

        expect(screen.getByRole('link', { name: 'Legal notice' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
        expect(document.documentElement.lang).toBe('en')
        expect(localStorage.getItem('mura-lang')).toBe('en')
        expect(currentLanguage()).toBe('en')
    })

    it('links to the website in a new tab, without handing it this page', () => {
        render(<MemoryRouter><LegalLinks /></MemoryRouter>)

        const link = screen.getByRole('link', { name: /mura\.novadev-studio\.fr/ })
        expect(link).toHaveAttribute('href', MURA_WEBSITE)
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('names the language a click on the top-bar button leads to, in that language', async () => {
        render(<LanguageSwitch variant="compact" />)

        const button = screen.getByRole('button', { name: 'Switch to English' })
        expect(button).toHaveTextContent('EN')

        await userEvent.click(button)
        expect(screen.getByRole('button', { name: 'Passer en français' })).toHaveTextContent('FR')
    })

    it('opens in the language saved on this device, then follows the browser', () => {
        localStorage.setItem('mura-lang', 'en')
        expect(initialLanguage()).toBe('en')

        localStorage.removeItem('mura-lang')
        const expected = navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
        expect(initialLanguage()).toBe(expected)
    })

    it('tells the signed-in account, so its mails follow, and nobody else', async () => {
        render(<LanguageSwitch variant="compact" />)
        await userEvent.click(screen.getByRole('button', { name: 'Switch to English' }))
        expect(api.put).not.toHaveBeenCalled()

        useAuthStore.getState().setAuth('jwt', account('alice'))
        await userEvent.click(screen.getByRole('button', { name: 'Passer en français' }))
        expect(api.put).toHaveBeenCalledWith('/auth/me/language', { language: 'fr' })
        useAuthStore.getState().logout()
    })
})
