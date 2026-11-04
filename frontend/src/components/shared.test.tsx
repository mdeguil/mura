import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'
import ErrorMessage from './ErrorMessage'
import LegalLinks from './LegalLinks'
import Logo from './Logo'
import Modal from './Modal'
import PasswordInput from './PasswordInput'
import PasswordStrength from './PasswordStrength'
import { passwordRules } from '../utils/passwordRules'
import ThemeToggle from './ThemeToggle'
import UserAvatar, { SuspendedPill } from './UserAvatar'
import { user } from '../test/fixtures'
import { ROUTER_FUTURE } from '../test/render'

describe('ConfirmDialog', () => {
    it('names what is at stake and cancels without acting', async () => {
        const onCancel = vi.fn()
        const onConfirm = vi.fn()
        render(<ConfirmDialog title="Supprimer « Refonte » ?" body="Tout part avec." confirmLabel="Supprimer"
            onCancel={onCancel} onConfirm={onConfirm} />)

        expect(screen.getByRole('heading', { name: 'Supprimer « Refonte » ?' })).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))

        expect(onCancel).toHaveBeenCalledOnce()
        expect(onConfirm).not.toHaveBeenCalled()
    })

    it('shows it is working while the action runs, then comes back', async () => {
        let finish: () => void = () => {}
        const onConfirm = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
        render(<ConfirmDialog title="Quitter ?" body="" confirmLabel="Quitter" onCancel={vi.fn()} onConfirm={onConfirm} />)

        await userEvent.click(screen.getByRole('button', { name: 'Quitter' }))
        expect(screen.getByRole('button', { name: 'En cours…' })).toBeDisabled()

        finish()
        expect(await screen.findByRole('button', { name: 'Quitter' })).toBeEnabled()
    })
})

describe('Modal', () => {
    function Dialog({ title, onClose, withField = false }: { title: string; onClose: () => void; withField?: boolean }) {
        return (
            <Modal labelledBy={`${title}-title`} onClose={onClose}>
                <h2 id={`${title}-title`}>{title}</h2>
                {withField && <input aria-label="Nom" autoFocus />}
                <button>Dans {title}</button>
            </Modal>
        )
    }

    it('is a dialog named by its heading, and takes the focus', () => {
        render(<Dialog title="Réglages" onClose={vi.fn()} />)

        const dialog = screen.getByRole('dialog', { name: 'Réglages' })
        expect(dialog).toHaveAttribute('aria-modal', 'true')
        expect(dialog).toHaveFocus()
    })

    it('closes on Escape, only the one on top', async () => {
        const closeOuter = vi.fn()
        const closeInner = vi.fn()
        render(
            <>
                <Dialog title="Dessous" onClose={closeOuter} />
                <Dialog title="Dessus" onClose={closeInner} />
            </>
        )

        await userEvent.keyboard('{Escape}')

        expect(closeInner).toHaveBeenCalledOnce()
        expect(closeOuter).not.toHaveBeenCalled()
    })

    it.each([false, true])(
        'hands the focus back to what opened it (field taking the focus: %s)',
        async (withField) => {
            function Opener() {
                const [open, setOpen] = useState(false)
                return (
                    <>
                        <button onClick={() => setOpen(true)}>Ouvrir</button>
                        {open && <Dialog title="Fiche" withField={withField} onClose={() => setOpen(false)} />}
                    </>
                )
            }
            render(<Opener />)

            await userEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))
            if (withField) expect(screen.getByLabelText('Nom')).toHaveFocus()
            await userEvent.keyboard('{Escape}')

            expect(screen.queryByRole('dialog')).toBeNull()
            expect(screen.getByRole('button', { name: 'Ouvrir' })).toHaveFocus()
        }
    )
})

describe('ErrorMessage', () => {
    it('is announced, and offers to try again when it can', async () => {
        const retry = vi.fn()
        const { rerender } = render(<ErrorMessage>Panne.</ErrorMessage>)
        expect(screen.getByRole('alert')).toHaveTextContent('Panne.')
        expect(screen.queryByRole('button')).toBeNull()

        rerender(<ErrorMessage onRetry={retry}>Panne.</ErrorMessage>)
        await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))

        expect(retry).toHaveBeenCalledOnce()
    })
})

describe('PasswordInput', () => {
    function Controlled() {
        const [value, setValue] = useState('')
        return <PasswordInput id="pw" value={value} onChange={setValue} />
    }

    it('hides what is typed until asked to show it', async () => {
        render(<Controlled />)
        const field = screen.getByPlaceholderText('••••••••')
        await userEvent.type(field, 'Secret-1')

        expect(field).toHaveAttribute('type', 'password')
        await userEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }))
        expect(field).toHaveAttribute('type', 'text')
        expect(field).toHaveValue('Secret-1')
        await userEvent.click(screen.getByRole('button', { name: 'Masquer le mot de passe' }))
        expect(field).toHaveAttribute('type', 'password')
    })

    it('keeps the toggle out of the tab order', () => {
        render(<Controlled />)

        expect(screen.getByRole('button', { name: 'Afficher le mot de passe' })).toHaveAttribute('tabindex', '-1')
    })
})

describe('passwordRules', () => {
    const met = (password: string, email = 'alice@mura.test', username = 'alice') =>
        passwordRules(password, email, username).filter((r) => r.met).map((r) => r.label)

    it('meets every rule with a strong password', () => {
        expect(met('Secret-123')).toHaveLength(6)
    })

    it('does not open on a red cross for an empty form', () => {
        expect(met('', '', '')).toEqual([])
    })

    it('refuses the username or the email as a password, whatever the case', () => {
        expect(met('ALICE')).not.toContain("Différent de ton email et de ton nom d'utilisateur")
        expect(met('Alice@Mura.test')).not.toContain("Différent de ton email et de ton nom d'utilisateur")
    })

    it("accepts accented letters and any symbol, and caps at bcrypt's 72", () => {
        expect(met('Éléphant-9')).toHaveLength(6)
        expect(met('Aa1!' + 'x'.repeat(69))).not.toContain('Au moins 8 caractères')
    })

    it('lists every rule with its state', () => {
        render(<PasswordStrength rules={passwordRules('abc', '', '')} />)

        expect(screen.getAllByRole('listitem')).toHaveLength(6)
        expect(screen.getByText('Une minuscule')).toHaveClass('text-emerald-600')
        expect(screen.getByText('Une majuscule')).toHaveClass('text-slate-400')
    })
})

describe('ThemeToggle', () => {
    it('offers the other theme and switches to it', async () => {
        document.documentElement.dataset.theme = 'dark'
        render(<ThemeToggle />)

        await userEvent.click(screen.getByRole('button', { name: 'Passer en thème clair' }))

        expect(document.documentElement.dataset.theme).toBe('light')
        expect(screen.getByRole('button', { name: 'Passer en thème sombre' })).toBeInTheDocument()
    })
})

describe('Logo', () => {
    it('holds a version for each theme, the dark one hidden by default', () => {
        render(<Logo className="w-8 h-8" />)
        const [onLight, onDark] = screen.getAllByAltText('Mura')

        expect(onLight).toHaveClass('w-8', 'h-8', 'dark:hidden')
        expect(onDark).toHaveClass('hidden', 'dark:block')
        expect(onLight.getAttribute('src')).not.toEqual(onDark.getAttribute('src'))
    })

    it('can be decorative when its name is written beside it', () => {
        render(<Logo alt="" />)

        expect(screen.queryByAltText('Mura')).toBeNull()
    })
})

describe('LegalLinks', () => {
    it('leads to both legal pages', () => {
        render(<MemoryRouter future={ROUTER_FUTURE}><LegalLinks /></MemoryRouter>)

        expect(screen.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute('href', '/mentions-legales')
        expect(screen.getByRole('link', { name: 'Confidentialité' })).toHaveAttribute('href', '/confidentialite')
    })
})

describe('UserAvatar', () => {
    it('shows the initial and says the account is suspended when it is', () => {
        const { rerender } = render(<UserAvatar user={user('bob')} />)
        expect(screen.getByLabelText('bob')).toHaveTextContent('B')

        rerender(<UserAvatar user={user('bob', { suspended: true })} />)
        expect(screen.getByLabelText('bob, compte suspendu')).toBeInTheDocument()
    })

    it('has a pill for places with room for the word', () => {
        render(<SuspendedPill />)

        expect(screen.getByText('Suspendu')).toBeInTheDocument()
    })
})
