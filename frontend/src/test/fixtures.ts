import type {
    Account,
    Group,
    Invitation,
    GroupMember,
    Member,
    Project,
    ProjectType,
    Task,
    User,
} from '../types'

let next = 0
const id = (prefix: string) => `${prefix}-${++next}`

export function user(username: string, extra: Partial<User> = {}): User {
    return { id: id('user'), username, email: `${username}@mura.test`, ...extra }
}

export function account(username: string, extra: Partial<Account> = {}): Account {
    return {
        id: id('account'),
        username,
        email: `${username}@mura.test`,
        accountRole: 'USER',
        suspended: false,
        emailVerified: true,
        suspendedAt: null,
        createdAt: '2026-01-15T10:00:00Z',
        ...extra,
    }
}

export function member(person: User, role: Member['role'] = 'MEMBER'): Member {
    return { ...person, role }
}

export function groupMember(person: User, extra: Partial<GroupMember> = {}): GroupMember {
    return { ...person, onHold: false, joinedAt: '2026-01-20T10:00:00Z', ...extra }
}

export function group(name: string, owner: User, members: GroupMember[], owned = true): Group {
    return { id: id('group'), name, owner, owned, createdAt: '2026-01-10T10:00:00Z', members }
}

export const webType: ProjectType = { id: 'type-web', label: 'Web', emoji: '🌐', position: 1, fallback: false }

export function project(name: string, owner: User, members: Member[] = [member(owner, 'OWNER')]): Project {
    return {
        id: id('project'),
        name,
        color: '#14b8a6',
        type: webType,
        status: 'A_VENIR',
        completedAt: null,
        archived: false,
        owner,
        access: 'MEMBER',
        members,
        lists: [],
    }
}

export function task(name: string, extra: Partial<Task> = {}): Task {
    return {
        id: id('task'),
        name,
        status: 'A_FAIRE',
        startDate: '2026-03-01',
        endDate: '2026-03-10',
        archived: false,
        assignee: null,
        subtasks: [],
        statusHistory: [],
        ...extra,
    }
}

export function invitation(invitedUser: User, invitedBy: User, extra: Partial<Invitation> = {}): Invitation {
    return {
        id: id('invitation'),
        projectId: 'project-x',
        projectName: 'Refonte',
        projectColor: '#14b8a6',
        invitedUser,
        invitedBy,
        status: 'PENDING',
        read: false,
        dismissed: false,
        createdAt: '2026-01-20T10:00:00Z',
        expiresAt: '2099-01-01T00:00:00Z',
        ...extra,
    }
}

// What axios rejects with when the server answers an error: apiErrorMessage
// recognises it by isAxiosError and reads the message the server wrote.
export function apiError(status: number, message?: string, field?: string) {
    return Object.assign(new Error(message ?? `HTTP ${status}`), {
        isAxiosError: true,
        response: { status, data: message ? { message, field } : undefined },
    })
}

// The same, for a request that never reached the server.
export function networkError() {
    return Object.assign(new Error('Network Error'), { isAxiosError: true, response: undefined })
}
