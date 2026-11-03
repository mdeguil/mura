import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiErrorField, apiErrorMessage } from './apiError'
import { projectGlassBackground, projectGradient, projectGradientStops } from './color'
import { initialPlanningMonth } from './planning'
import { PROJECT_STATUS_LABELS, projectTypeLabel } from './projectMeta'
import { NEXT_TASK_STATUS, TASK_STATUS_ICONS, TASK_STATUS_LABELS } from './taskMeta'
import { taskPayload } from './taskPayload'
import { apiError, networkError, task, user } from '../test/fixtures'

describe('apiErrorMessage', () => {
    it("uses the server's own sentence", () => {
        expect(apiErrorMessage(apiError(409, 'Cet email est déjà utilisé.'), 'Repli')).toBe('Cet email est déjà utilisé.')
    })

    it('falls back when the server said nothing usable', () => {
        expect(apiErrorMessage(apiError(500), 'Repli')).toBe('Repli')
        expect(apiErrorMessage(new Error('pas axios'), 'Repli')).toBe('Repli')
    })

    it('says the server is unreachable when no answer came back', () => {
        expect(apiErrorMessage(networkError(), 'Repli')).toBe('Serveur injoignable. Vérifie ta connexion et réessaie.')
    })
})

describe('apiErrorField', () => {
    it('names the field the server pointed at, or nothing', () => {
        expect(apiErrorField(apiError(409, 'Pris.', 'email'))).toBe('email')
        expect(apiErrorField(apiError(409, 'Pris.'))).toBeNull()
        expect(apiErrorField(new Error('x'))).toBeNull()
    })
})

describe('project colours', () => {
    it('derives a lighter and a darker stop from one colour', () => {
        const [light, dark] = projectGradientStops('#808080')
        expect(light > '#808080').toBe(true)
        expect(dark < '#808080').toBe(true)
        expect(projectGradient('#808080')).toBe(`linear-gradient(135deg, ${light}, ${dark})`)
    })

    it('keeps pure white and black within range', () => {
        expect(projectGradientStops('#ffffff')[0]).toBe('#ffffff')
        expect(projectGradientStops('#000000')[1]).toBe('#000000')
    })

    it('lays a highlight over the gradient for the glass look', () => {
        expect(projectGlassBackground('#14b8a6')).toMatch(/^linear-gradient\(135deg, rgba\(255,255,255,0\.55\)/)
    })
})

describe('initialPlanningMonth', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('opens on this month when something is planned in it', () => {
        vi.useFakeTimers({ now: new Date('2026-03-15T12:00:00') })

        expect(initialPlanningMonth([task('A', { startDate: '2026-02-20', endDate: '2026-03-02' })])).toEqual(
            new Date('2026-03-01T00:00:00')
        )
    })

    it('opens on the earliest task when this month is empty', () => {
        vi.useFakeTimers({ now: new Date('2026-03-15T12:00:00') })

        expect(
            initialPlanningMonth([
                task('A', { startDate: '2026-07-10', endDate: '2026-07-20' }),
                task('B', { startDate: '2026-05-04', endDate: '2026-05-08' }),
            ])
        ).toEqual(new Date('2026-05-01T00:00:00'))
    })

    it('opens on this month when there is nothing at all', () => {
        vi.useFakeTimers({ now: new Date('2026-03-15T12:00:00') })

        expect(initialPlanningMonth([])).toEqual(new Date('2026-03-01T00:00:00'))
    })
})

describe('taskPayload', () => {
    const alice = user('alice')
    const base = task('Maquettes', { description: 'Accueil', assignee: alice, status: 'EN_COURS' })

    it('resends every field so nothing is dropped by a partial change', () => {
        expect(taskPayload(base)).toEqual({
            name: 'Maquettes',
            description: 'Accueil',
            status: 'EN_COURS',
            startDate: '2026-03-01',
            endDate: '2026-03-10',
            assigneeId: alice.id,
        })
    })

    it('keeps the assignee through a status change and clears it only when asked', () => {
        expect(taskPayload(base, { status: 'TERMINE' }).assigneeId).toBe(alice.id)
        expect(taskPayload(base, { assigneeId: null }).assigneeId).toBeNull()
        expect(taskPayload(task('Sans responsable')).assigneeId).toBeNull()
    })
})

describe('labels and statuses', () => {
    it('shows a type with its emoji', () => {
        expect(projectTypeLabel({ emoji: '🌐', label: 'Web' })).toBe('🌐 Web')
    })

    it('has a label for every status', () => {
        expect(Object.values(PROJECT_STATUS_LABELS)).toEqual(['À venir', 'En cours', 'Achevé'])
        expect(Object.keys(TASK_STATUS_LABELS)).toEqual(Object.keys(TASK_STATUS_ICONS))
    })

    it('only ever moves a task forward, and Terminé is final', () => {
        expect(NEXT_TASK_STATUS.A_FAIRE).toBe('EN_COURS')
        expect(NEXT_TASK_STATUS.EN_COURS).toBe('TERMINE')
        expect(NEXT_TASK_STATUS.TERMINE).toBeUndefined()
    })
})
