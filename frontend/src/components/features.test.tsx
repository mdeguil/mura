import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import api from '../services/api'
import CarnetCombobox from './CarnetCombobox'
import DeleteOwnAccountDialog from './DeleteOwnAccountDialog'
import GroupAddPanel from './GroupAddPanel'
import GroupPicker from './GroupPicker'
import { apiError, group, groupMember, member, user } from '../test/fixtures'
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
        // bob and carol: alice is left out by the caller, dave is suspended, eve set aside.
        expect(designCard).toHaveTextContent('👥 2')
        expect(screen.getByText('2 personnes rejoindront le projet.')).toBeInTheDocument()
        // Reported from an effect, once the first group has been chosen.
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
        // Count only: nobody is listed by name.
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

        // "ro": robert first (his name starts with it), then carol.
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
