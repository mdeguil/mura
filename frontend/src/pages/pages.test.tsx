import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import App from '../App'
import AccountPage from './AccountPage'
import GroupPage from './GroupPage'
import LoginPage from './LoginPage'
import ProjectPage from './ProjectPage'
import { account, apiError, group, groupMember, project, task } from '../test/fixtures'
import { renderAt } from '../test/render'

vi.mock('../services/api')

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

describe('GroupPage', () => {
    const alice = account('alice')
    const bob = account('bob')
    const carol = account('carol')

    function openGroup(owned: boolean) {
        const design = group('Design', owned ? alice : bob, [groupMember(alice), groupMember(bob)], owned)
        useAuthStore.setState({ token: 'jwt', user: alice })
        emptyServer({ [`/groups/${design.id}`]: design })
        return { ...renderAt(<GroupPage />, { route: `/groupe/${design.id}`, path: '/groupe/:id' }), design }
    }

    it('lets the gérant add someone, who then shows in the list', async () => {
        const { user, design } = openGroup(true)
        vi.mocked(api.post).mockResolvedValueOnce({
            data: { ...design, members: [...design.members, groupMember(carol)] },
        })

        await user.click(await screen.findByRole('button', { name: 'Ajouter une personne' }))
        await user.type(screen.getByRole('combobox', { name: 'Qui veux-tu ajouter ?' }), 'carol@mura.test')
        await user.click(screen.getByRole('button', { name: 'Ajouter' }))

        expect(api.post).toHaveBeenCalledWith(`/groups/${design.id}/members`, { email: 'carol@mura.test' })
        expect(await screen.findByText('carol')).toBeInTheDocument()
        expect(screen.queryByRole('combobox', { name: 'Qui veux-tu ajouter ?' })).toBeNull()
    })

    it('sets a member aside with what the server answers', async () => {
        const { user, design } = openGroup(true)
        vi.mocked(api.put).mockResolvedValueOnce({
            data: { ...design, members: [groupMember(alice), groupMember(bob, { onHold: true })] },
        })

        await user.click(await screen.findByRole('button', { name: 'Mettre en retrait' }))

        expect(api.put).toHaveBeenCalledWith(`/groups/${design.id}/members/${bob.id}/hold`, { onHold: true })
        expect(await screen.findByRole('button', { name: 'Réintégrer' })).toBeInTheDocument()
    })

    it('renames in place, and keeps the field open when refused', async () => {
        const { user } = openGroup(true)
        vi.mocked(api.put).mockRejectedValueOnce(apiError(409, 'Ce nom est déjà pris.'))

        await user.click(await screen.findByRole('button', { name: 'Renommer' }))
        const field = screen.getByRole('textbox', { name: 'Nom du groupe' })
        await user.clear(field)
        await user.type(field, 'Graphisme')
        await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('Ce nom est déjà pris.')
        expect(screen.getByRole('textbox', { name: 'Nom du groupe' })).toHaveValue('Graphisme')
    })

    it('lets a member leave, after asking, and goes back to the carnet', async () => {
        const { user, design } = openGroup(false)
        vi.mocked(api.delete).mockResolvedValueOnce({ data: undefined })

        expect(await screen.findByText('Géré par bob · 2 personnes')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Mettre en retrait' })).toBeNull()
        await user.click(screen.getByRole('button', { name: 'Quitter le groupe' }))
        await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Quitter le groupe' }))

        expect(api.delete).toHaveBeenCalledWith(`/groups/${design.id}/members/${alice.id}`)
        await waitFor(() => expect(screen.getAllByTestId('current-path')[0]).toHaveTextContent('/carnet'))
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
