import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import App from '../App'
import AccountPage from './AccountPage'
import LoginPage from './LoginPage'
import ProjectPage from './ProjectPage'
import { account, apiError, project, task } from '../test/fixtures'
import { renderAt } from '../test/render'

vi.mock('../services/api')

// Answers by address rather than by call order: the top bar and the bell ask
// for their own things whenever a page mounts. Anything not listed comes
// back empty.
function emptyServer(answers: Record<string, unknown> = {}) {
    vi.mocked(api.get).mockImplementation(async (url: string) => {
        if (url in answers) return { data: answers[url] }
        if (url === '/auth/me') return { data: useAuthStore.getState().user }
        return { data: [] }
    })
}

beforeEach(() => {
    useAuthStore.setState({ token: null, user: null })
})

describe('LoginPage', () => {
    it('signs in and goes to the projects', async () => {
        const alice = account('alice')
        vi.mocked(api.post).mockResolvedValueOnce({ data: { token: 'jwt', user: alice } })
        const { user } = renderAt(<LoginPage />, { route: '/login', path: '/login' })

        await user.type(screen.getByPlaceholderText('toi@exemple.com'), 'alice@mura.test')
        await user.type(screen.getByPlaceholderText('••••••••'), 'Secret-1')
        await user.click(screen.getByRole('button', { name: 'Se connecter' }))

        expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'alice@mura.test', password: 'Secret-1' })
        await waitFor(() => expect(screen.getAllByTestId('current-path')[0]).toHaveTextContent('/projets'))
        expect(useAuthStore.getState()).toMatchObject({ token: 'jwt', user: alice })
    })

    it("shows the server's answer and stays on the page", async () => {
        vi.mocked(api.post).mockRejectedValueOnce(apiError(403, 'Ce compte a été suspendu. Contacte un administrateur.'))
        const { user } = renderAt(<LoginPage />, { route: '/login', path: '/login' })

        await user.type(screen.getByPlaceholderText('toi@exemple.com'), 'bob@mura.test')
        await user.type(screen.getByPlaceholderText('••••••••'), 'x')
        await user.click(screen.getByRole('button', { name: 'Se connecter' }))

        expect(await screen.findByText('Ce compte a été suspendu. Contacte un administrateur.')).toBeInTheDocument()
        expect(useAuthStore.getState().token).toBeNull()
    })

    it('links to signup, the forgotten password and the legal pages', () => {
        renderAt(<LoginPage />, { route: '/login', path: '/login' })

        expect(screen.getByRole('link', { name: 'Créer un compte' })).toHaveAttribute('href', '/register')
        expect(screen.getByRole('link', { name: 'Mot de passe oublié ?' })).toHaveAttribute('href', '/mot-de-passe-oublie')
        expect(screen.getByRole('link', { name: 'Mentions légales' })).toBeInTheDocument()
    })
})

describe('AccountPage', () => {
    const alice = account('alice')

    beforeEach(() => {
        useAuthStore.setState({ token: 'jwt', user: alice })
        emptyServer()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("shows what Mura holds on the account", () => {
        renderAt(<AccountPage />)

        expect(screen.getByRole('heading', { name: 'Mon compte' })).toBeInTheDocument()
        expect(screen.getByText('alice@mura.test')).toBeInTheDocument()
        expect(screen.getByText('15 janvier 2026')).toBeInTheDocument()
    })

    it('hands the data over as a file to keep', async () => {
        const createObjectURL = vi.fn(() => 'blob:mes-donnees')
        vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() })
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
        const file = new Blob(['{}'])
        emptyServer({ '/auth/me/export': file })
        const { user } = renderAt(<AccountPage />)

        await user.click(screen.getByRole('button', { name: 'Télécharger mes données' }))

        expect(api.get).toHaveBeenCalledWith('/auth/me/export', { responseType: 'blob' })
        await waitFor(() => expect(click).toHaveBeenCalledOnce())
        expect(createObjectURL).toHaveBeenCalledWith(file)
        click.mockRestore()
    })

    it('says so when the data cannot be prepared', async () => {
        const { user } = renderAt(<AccountPage />)
        await waitFor(() => expect(api.get).toHaveBeenCalled())
        vi.mocked(api.get).mockRejectedValueOnce(apiError(500))

        await user.click(screen.getByRole('button', { name: 'Télécharger mes données' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de préparer tes données.')
    })

    it('signs out and leaves once the account is deleted', async () => {
        emptyServer({
            '/auth/me/deletion-preview': {
                username: 'alice', projectsTransferred: [], projectsDeleted: [], groupsDeleted: [], tasksUnassigned: 0,
            },
        })
        vi.mocked(api.delete).mockResolvedValueOnce({ data: undefined })
        const { user } = renderAt(<AccountPage />)

        await user.click(screen.getByRole('button', { name: 'Supprimer mon compte…' }))
        await user.type(await screen.findByLabelText('Ton mot de passe, pour confirmer'), 'Secret-1')
        await user.click(screen.getByRole('button', { name: 'Supprimer définitivement mon compte' }))

        await waitFor(() => expect(useAuthStore.getState().token).toBeNull())
        expect(screen.getAllByTestId('current-path')[0]).toHaveTextContent('/login')
    })
})

describe('ProjectPage', () => {
    const alice = account('alice')

    // Alice's own project, opened on `tab`; `more` adds answers for the
    // project's other addresses, given its id.
    function openProject(more: (projectId: string) => Record<string, unknown> = () => ({}), tab = '') {
        const refonte = project('Refonte', alice)
        useAuthStore.setState({ token: 'jwt', user: alice })
        emptyServer({ [`/projects/${refonte.id}`]: refonte, ...more(refonte.id) })
        const rendered = renderAt(<ProjectPage />, { route: `/project/${refonte.id}${tab}`, path: '/project/:id' })
        return { ...rendered, refonte }
    }

    it('changes the status with the type the server expects', async () => {
        vi.mocked(api.put).mockImplementationOnce(async (_url, body) => ({
            data: { ...project('Refonte', alice), ...(body as object) },
        }))
        const { user, refonte } = openProject()

        await user.click(await screen.findByRole('button', { name: /À venir/ }))
        await user.click(screen.getByRole('option', { name: /En cours/ }))

        expect(api.put).toHaveBeenCalledWith(
            `/projects/${refonte.id}`,
            expect.objectContaining({ typeId: refonte.type.id, status: 'EN_COURS' })
        )
        expect(vi.mocked(api.put).mock.calls[0][1]).not.toHaveProperty('type')
    })

    it('says on the page when a change is refused, with no browser alert', async () => {
        const alert = vi.spyOn(window, 'alert')
        vi.mocked(api.put).mockRejectedValueOnce(apiError(400, 'Le type de projet est requis.'))
        const { user } = openProject()

        await user.click(await screen.findByRole('button', { name: /À venir/ }))
        await user.click(screen.getByRole('option', { name: /Achevé/ }))

        expect(await screen.findByRole('alert')).toHaveTextContent('Le type de projet est requis.')
        expect(alert).not.toHaveBeenCalled()
    })

    it('asks in a dialog before deleting an archived task for good', async () => {
        const confirm = vi.spyOn(window, 'confirm')
        vi.mocked(api.delete).mockResolvedValueOnce({ data: undefined })
        const { user, refonte } = openProject(
            (projectId) => ({ [`/projects/${projectId}/tasks/archived`]: [task('Vieille maquette', { archived: true })] }),
            '?tab=tasks'
        )

        await user.click(await screen.findByRole('button', { name: /Supprimer$/ }))
        const dialog = screen.getByRole('dialog', { name: 'Supprimer définitivement « Vieille maquette » ?' })
        expect(api.delete).not.toHaveBeenCalled()

        await user.click(within(dialog).getByRole('button', { name: 'Supprimer définitivement' }))

        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
        expect(api.delete).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^/projects/${refonte.id}/tasks/`)))
        expect(confirm).not.toHaveBeenCalled()
    })

    it("tells a member the tasks did not load instead of showing none", async () => {
        const refonte = project('Refonte', alice)
        useAuthStore.setState({ token: 'jwt', user: alice })
        vi.mocked(api.get).mockImplementation(async (url: string) => {
            if (url === `/projects/${refonte.id}`) return { data: refonte }
            if (url === `/projects/${refonte.id}/tasks`) throw apiError(500)
            return { data: [] }
        })
        renderAt(<ProjectPage />, { route: `/project/${refonte.id}`, path: '/project/:id' })

        expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger les tâches.')
        expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
    })
})

describe('legal pages', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
        vi.resetModules()
    })

    it('say plainly when the instance has not declared who runs it', async () => {
        const { default: LegalNoticePage } = await import('./LegalNoticePage')
        renderAt(<LegalNoticePage />)

        expect(screen.getByRole('note')).toHaveTextContent("n'a pas déclaré qui l'administre")
        expect(screen.getByText(/ne s'est pas déclarée/)).toBeInTheDocument()
        expect(screen.queryByText(/À compléter/)).toBeNull()
    })

    it("show what the instance declared, and only that", async () => {
        vi.stubEnv('VITE_LEGAL_PUBLISHER_NAME', 'Association Exemple')
        vi.stubEnv('VITE_LEGAL_CONTACT_EMAIL', 'contact@exemple.test')
        vi.stubEnv('VITE_LEGAL_HOST_NAME', 'Hébergeur Exemple')
        vi.resetModules()
        const { default: LegalNoticePage } = await import('./LegalNoticePage')
        renderAt(<LegalNoticePage />)

        expect(screen.queryByRole('note')).toBeNull()
        expect(screen.getByText('Association Exemple')).toBeInTheDocument()
        expect(screen.getByText('contact@exemple.test')).toBeInTheDocument()
        expect(screen.queryByText(/Directeur ou directrice/)).toBeNull()
    })

    it('the privacy policy falls back to the contact address for data questions', async () => {
        vi.stubEnv('VITE_LEGAL_CONTACT_EMAIL', 'contact@exemple.test')
        vi.resetModules()
        const { default: PrivacyPage } = await import('./PrivacyPage')
        renderAt(<PrivacyPage />)

        expect(screen.getAllByText('contact@exemple.test').length).toBeGreaterThan(0)
        expect(screen.getByRole('link', { name: 'Mon compte' })).toHaveAttribute('href', '/compte')
    })
})

describe('route guards', () => {
    function openApp(path: string) {
        window.history.pushState({}, '', path)
        return render(<App />)
    }

    beforeEach(() => {
        emptyServer()
    })

    it('send someone signed out to the login page', async () => {
        openApp('/projets')

        expect(await screen.findByRole('heading', { name: /Bon retour/ })).toBeInTheDocument()
    })

    it('show only the code screen to an unverified account', async () => {
        useAuthStore.setState({ token: 'jwt', user: account('alice', { emailVerified: false }) })
        openApp('/projets')

        expect(await screen.findByRole('heading', { name: /Confirme ton adresse/ })).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Mes projets' })).toBeNull()
    })

    it('keep the administration from an ordinary account', async () => {
        useAuthStore.setState({ token: 'jwt', user: account('alice') })
        openApp('/administration')

        expect(await screen.findByRole('heading', { name: 'Mes projets' })).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Administration' })).toBeNull()
    })

    it('open the administration to an administrator', async () => {
        useAuthStore.setState({ token: 'jwt', user: account('admin', { accountRole: 'ADMIN' }) })
        openApp('/administration')

        expect(await screen.findByRole('heading', { name: 'Administration' })).toBeInTheDocument()
    })

    it('put the legal links at the foot of every signed-in page', async () => {
        useAuthStore.setState({ token: 'jwt', user: account('alice') })
        openApp('/projets')

        await screen.findByRole('heading', { name: 'Mes projets' })
        expect(screen.getAllByRole('link', { name: 'Confidentialité' }).length).toBeGreaterThan(0)
    })
})
