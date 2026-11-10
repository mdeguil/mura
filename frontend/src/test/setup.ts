import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import i18n from '../i18n'

beforeEach(async () => {
    localStorage.setItem('mura-lang', 'fr')
    await i18n.changeLanguage('fr')
})

afterEach(() => {
    cleanup()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    vi.clearAllMocks()
})
