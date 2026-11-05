import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import api from '../services/api'
import CarnetCombobox from './CarnetCombobox'
import DeleteOwnAccountDialog from './DeleteOwnAccountDialog'
import GroupAddPanel from './GroupAddPanel'
import GroupPicker from './GroupPicker'
import MemberList from './MemberList'
import { apiError, group, groupMember, invitation, member, user } from '../test/fixtures'
import type { AccountDeletionPreview, Group, KnownUser } from '../types'

vi.mock('../services/api')

const alice = user('alice')
const bob = user('bob')
const carol = user('carol')
const dave = user('dave', { suspended: true })
const eve = user('eve')

function design(): Group {
    return group('Design', alice, [
        groupMember(alice),
        groupMember(bob),
        groupMember(carol),
        groupMember(dave),
        groupMember(eve, { onHold: true }),
    ])
}

describe('GroupPicker', () => {
    beforeEach(() => {
        vi.mocked(api.get).mockResolvedValue({ data: [design(), group('Dev', bob, [groupMember(bob)], false)] })
    })

    it('starts on the first group and counts who will really come', async () => {
        const onChange = vi.fn()
        render(<GroupPicker leftOut={(p) => (p.id === alice.id ? 'Déjà dans le projet' : null)} onChange={onChange} />)

        const designCard = await screen.findByRole('radio', { name: /Design/ })
        expect(designCard).toHaveAttribute('aria-checked', 'true')
        expect(designCard).toHaveTextContent('👥 2')
        expect(screen.getByText('2 personnes rejoindront le projet.')).toBeInTheDocument()
        await waitFor(() =>
            expect(onChange).toHaveBeenLastCalledWith({ groupId: expect.any(String), groupName: 'Design', joiningCount: 2 })
        )
    })

    it('says why each person left out is left out', async () => {
        render(<GroupPicker leftOut={(p) => (p.id === alice.id ? 'Déjà dans le projet' : null)} onChange={vi.fn()} />)

        expect(await screen.findByText('Déjà dans le projet')).toBeInTheDocument()
        expect(screen.getByText('En retrait')).toBeInTheDocument()
        expect(screen.getByText('Suspendu')).toBeInTheDocument()
    })

    it('where a group is optional, starts on none and lets go of one picked twice', async () => {
        const onChange = vi.fn()
        render(<GroupPicker leftOut={() => null} allowNone countOnly onChange={onChange} />)

        const designCard = await screen.findByRole('radio', { name: /Design/ })
        expect(designCard).toHaveAttribute('aria-checked', 'false')
        expect(onChange).toHaveBeenLastCalledWith(null)

        await userEvent.click(designCard)
        expect(designCard).toHaveAttribute('aria-checked', 'true')
        expect(screen.queryByText('bob')).toBeNull()

        await userEvent.click(designCard)
        expect(designCard).toHaveAttribute('aria-checked', 'false')
        expect(onChange).toHaveBeenLastCalledWith(null)
    })

    it('has a link to take the group back off', async () => {
        render(<GroupPicker leftOut={() => null} allowNone onChange={vi.fn()} />)

        await userEvent.click(await screen.findByRole('radio', { name: /Design/ }))
        await userEvent.click(screen.getByRole('button', { name: 'Retirer le groupe' }))

        expect(screen.getByRole('radio', { name: /Design/ })).toHaveAttribute('aria-checked', 'false')
    })

    it('explains what to do when the reader is in no group', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: [] })
        render(<GroupPicker leftOut={() => null} onChange={vi.fn()} />)

        expect(await screen.findByText(/aucun groupe pour l'instant/)).toBeInTheDocument()
    })

    it('shows the error when the groups cannot be loaded', async () => {
        vi.mocked(api.get).mockRejectedValueOnce(apiError(500, 'Panne.'))
        render(<GroupPicker leftOut={() => null} onChange={vi.fn()} />)

        expect(await screen.findByText('Panne.')).toBeInTheDocument()
    })
})

describe('GroupAddPanel', () => {
    const members = [member(alice, 'OWNER')]

    beforeEach(() => {
        vi.mocked(api.get).mockResolvedValue({ data: [design()] })
    })

    it('brings the group and reports who joined from the answer', async () => {
        const onAdded = vi.fn()
        const team = [member(alice, 'OWNER'), member(bob), member(carol)]
        vi.mocked(api.post).mockResolvedValueOnce({ data: team })
        render(<GroupAddPanel projectId="p1" members={members} onAdded={onAdded} onCancel={vi.fn()} />)

        await userEvent.click(await screen.findByRole('button', { name: 'Ajouter le groupe' }))

        expect(api.post).toHaveBeenCalledWith('/projects/p1/members/from-group', { groupId: expect.any(String) })
        await waitFor(() => expect(onAdded).toHaveBeenCalledWith(team, [bob.id, carol.id]))
    })

    it('cannot add a group that would bring nobody', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: [group('Solo', alice, [groupMember(alice)])] })
        render(<GroupAddPanel projectId="p1" members={members} onAdded={vi.fn()} onCancel={vi.fn()} />)

        expect(await screen.findByRole('button', { name: 'Ajouter le groupe' })).toBeDisabled()
    })

    it("shows the server's refusal and stays open", async () => {
        vi.mocked(api.post).mockRejectedValueOnce(apiError(409, 'Personne à ajouter.'))
        const onAdded = vi.fn()
        render(<GroupAddPanel projectId="p1" members={members} onAdded={onAdded} onCancel={vi.fn()} />)

        await userEvent.click(await screen.findByRole('button', { name: 'Ajouter le groupe' }))

        expect(await screen.findByText('Personne à ajouter.')).toBeInTheDocument()
        expect(onAdded).not.toHaveBeenCalled()
    })
})

describe('DeleteOwnAccountDialog', () => {
    const preview: AccountDeletionPreview = {
        username: 'alice',
        projectsTransferred: [{ projectName: 'Refonte', successorUsername: 'bob' }],
        projectsDeleted: ['Brouillon'],
        groupsDeleted: ['Design'],
        tasksUnassigned: 2,
    }

    it('shows what will happen and needs the password to go ahead', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: preview })
        render(<DeleteOwnAccountDialog onClose={vi.fn()} onDeleted={vi.fn()} />)

        expect(await screen.findByText('Refonte')).toBeInTheDocument()
        expect(screen.getByText(/revient à bob/)).toBeInTheDocument()
        expect(screen.getByText('Brouillon')).toBeInTheDocument()
        expect(screen.getByText(/2 tâches qui t’étaient attribuées/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Supprimer définitivement mon compte' })).toBeDisabled()
    })

    it('deletes with the password and says so', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: preview })
        vi.mocked(api.delete).mockResolvedValueOnce({ data: undefined })
        const onDeleted = vi.fn()
        render(<DeleteOwnAccountDialog onClose={vi.fn()} onDeleted={onDeleted} />)

        await userEvent.type(await screen.findByLabelText('Ton mot de passe, pour confirmer'), 'Secret-1')
        await userEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement mon compte' }))

        expect(api.delete).toHaveBeenCalledWith('/auth/me', { data: { password: 'Secret-1' } })
        await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce())
    })

    it('announces a wrong password and keeps the dialog open', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: preview })
        vi.mocked(api.delete).mockRejectedValueOnce(apiError(403, 'Mot de passe incorrect.', 'password'))
        const onDeleted = vi.fn()
        render(<DeleteOwnAccountDialog onClose={vi.fn()} onDeleted={onDeleted} />)

        await userEvent.type(await screen.findByLabelText('Ton mot de passe, pour confirmer'), 'faux')
        await userEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement mon compte' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('Mot de passe incorrect.')
        expect(onDeleted).not.toHaveBeenCalled()
    })

    it('can be cancelled', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: preview })
        const onClose = vi.fn()
        render(<DeleteOwnAccountDialog onClose={onClose} onDeleted={vi.fn()} />)

        await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))

        expect(onClose).toHaveBeenCalledOnce()
    })
})

describe('MemberList', () => {
    const team = () => [member(alice, 'OWNER'), member(bob), member(carol, 'ADMIN')]

    function renderList(
        extra: Partial<React.ComponentProps<typeof MemberList>> = {},
        handlers = { onInvited: vi.fn(), onMembersChanged: vi.fn(), onInvitationCancelled: vi.fn() }
    ) {
        vi.mocked(api.get).mockResolvedValue({ data: [] })
        render(
            <MemberList
                projectId="p1"
                members={team()}
                invitations={[]}
                canManage
                isOwner
                currentUserId={alice.id}
                onRemoved={vi.fn()}
                {...handlers}
                {...extra}
            />
        )
        return handlers
    }

    it('invites the address typed and closes the form', async () => {
        const sent = invitation(dave, alice)
        vi.mocked(api.post).mockResolvedValueOnce({ data: sent })
        const { onInvited } = renderList()

        await userEvent.click(screen.getByRole('button', { name: 'Inviter une personne ou ajouter un groupe' }))
        await userEvent.type(screen.getByRole('combobox', { name: 'Qui veux-tu inviter ?' }), 'dave@mura.test')
        await userEvent.click(screen.getByRole('button', { name: 'Inviter' }))

        expect(api.post).toHaveBeenCalledWith('/projects/p1/invitations', { email: 'dave@mura.test' })
        await waitFor(() => expect(onInvited).toHaveBeenCalledWith(sent))
        expect(screen.queryByRole('combobox', { name: 'Qui veux-tu inviter ?' })).toBeNull()
    })

    it("keeps the form open and says why when the server refuses", async () => {
        vi.mocked(api.post).mockRejectedValueOnce(apiError(404, "Aucun compte Mura n'utilise l'email x@y.z."))
        renderList()

        await userEvent.click(screen.getByRole('button', { name: 'Inviter une personne ou ajouter un groupe' }))
        await userEvent.type(screen.getByRole('combobox', { name: 'Qui veux-tu inviter ?' }), 'x@y.z')
        await userEvent.click(screen.getByRole('button', { name: 'Inviter' }))

        expect(await screen.findByRole('alert')).toHaveTextContent("Aucun compte Mura n'utilise l'email x@y.z.")
        expect(screen.getByRole('combobox', { name: 'Qui veux-tu inviter ?' })).toHaveValue('x@y.z')
    })

    it('lets only the owner change a role', async () => {
        vi.mocked(api.patch).mockResolvedValueOnce({ data: member(bob, 'ADMIN') })
        const { onMembersChanged } = renderList()

        await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rôle de bob' }), 'ADMIN')

        expect(api.patch).toHaveBeenCalledWith(`/projects/p1/members/${bob.id}/role`, { role: 'ADMIN' })
        await waitFor(() =>
            expect(onMembersChanged).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ role: 'ADMIN' })]))
        )
    })

    it('shows roles as text to an admin, who cannot hand the project over', () => {
        renderList({ isOwner: false, currentUserId: carol.id })

        expect(screen.queryByRole('combobox', { name: /Rôle de/ })).toBeNull()
        expect(screen.queryByRole('heading', { name: 'Céder le projet' })).toBeNull()
        expect(screen.getByRole('button', { name: 'Quitter le projet' })).toBeInTheDocument()
    })

    it('asks before handing the project over', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({ data: team() })
        renderList()

        await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Nouveau propriétaire' }), bob.id)
        await userEvent.click(screen.getByRole('button', { name: 'Céder' }))
        expect(api.post).not.toHaveBeenCalled()

        await userEvent.click(screen.getByRole('button', { name: 'Céder le projet' }))

        expect(api.post).toHaveBeenCalledWith(`/projects/p1/members/${bob.id}/transfer-ownership`)
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })

    it('lists who has yet to answer, and offers to ask again those who did not come', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({ data: invitation(eve, alice) })
        renderList({
            invitations: [invitation(dave, alice), invitation(eve, alice, { status: 'DECLINED' })],
        })

        expect(screen.getByText('En attente de réponse (1)')).toBeInTheDocument()
        expect(screen.getByText('A refusé')).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: 'Réinviter' }))

        expect(api.post).toHaveBeenCalledWith('/projects/p1/invitations', { email: eve.email })
    })
})

describe('CarnetCombobox', () => {
    const known = (person: ReturnType<typeof user>, extra: Partial<KnownUser> = {}): KnownUser => ({
        id: person.id,
        username: person.username,
        email: person.email,
        sharedProjects: [],
        saved: true,
        favourite: false,
        suspended: false,
        pending: false,
        ...extra,
    })

    function Field({ onPick = vi.fn(), excludeIds = [] as string[] }) {
        const [value, setValue] = useState('')
        return <CarnetCombobox value={value} onChange={setValue} onPick={onPick} excludeIds={excludeIds} />
    }

    beforeEach(() => {
        vi.mocked(api.get).mockResolvedValue({
            data: [
                known(bob),
                known(carol),
                known(user('robert')),
                known(user('zoé'), { pending: true }),
                known(user('invité'), { email: null }),
            ],
        })
    })

    it('suggests names as they are typed, the ones starting with it first', async () => {
        render(<Field />)
        const field = screen.getByRole('combobox')

        await userEvent.type(field, 'b')
        await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2))
        expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
            expect.stringContaining('bob'),
            expect.stringContaining('robert'),
        ])
    })

    it('leaves out pending requests, hidden addresses and excluded people', async () => {
        render(<Field excludeIds={[carol.id]} />)

        await userEvent.click(screen.getByRole('combobox'))

        await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2))
        expect(screen.queryByText('zoé')).toBeNull()
        expect(screen.queryByText('invité')).toBeNull()
        expect(screen.queryByText('carol')).toBeNull()
    })

    it('picks the highlighted person with the keyboard', async () => {
        const onPick = vi.fn()
        render(<Field onPick={onPick} />)
        const field = screen.getByRole('combobox')

        await userEvent.type(field, 'ro')
        await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2))
        await userEvent.keyboard('{ArrowDown}{Enter}')

        expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ username: 'carol' }))
    })

    it('closes the list with Escape before anything else', async () => {
        render(<Field />)

        await userEvent.type(screen.getByRole('combobox'), 'bo')
        await screen.findByRole('listbox')
        await userEvent.keyboard('{Escape}')

        expect(screen.queryByRole('listbox')).toBeNull()
    })
})
