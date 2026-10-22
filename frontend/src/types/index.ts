export interface User {
  id: string
  // Null for a team member seen by someone who only holds an invitation:
  // the server withholds addresses until they join.
  email: string | null
  username: string
  avatarUrl?: string
}

export interface Label {
  id: string
  name?: string
  color: string
}

export interface Card {
  id: string
  title: string
  description?: string
  position: number
  dueDate?: string
  members: User[]
  labels: Label[]
}

export interface List {
  id: string
  name: string
  position: number
  cards: Card[]
}

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'

export type ProjectAccess = 'MEMBER' | 'INVITED'

export type NotificationType = 'REMOVED_FROM_PROJECT' | 'MEMBER_LEFT_PROJECT'

// Named around the DOM's own Notification. Unlike an invitation there is
// nothing to answer: clearing one deletes it.
export interface AppNotification {
  id: string
  type: NotificationType
  // Null when the project is no longer the reader's to open.
  projectId: string | null
  projectName: string
  actorName: string
  message: string | null
  read: boolean
  createdAt: string
}

export interface Invitation {
  id: string
  projectId: string
  projectName: string
  projectColor: string
  invitedUser: User
  invitedBy: User
  status: InvitationStatus
  read: boolean
  // Cleared from the bell. The invitation is still pending: it keeps
  // showing in the projects list until it is answered.
  dismissed: boolean
  createdAt: string
  // When it stops being answerable. Past it the server marks it EXPIRED
  // the next time anyone reads it.
  expiresAt: string
}

// A user plus the role they hold on one project, flattened so a member row
// renders from a single object.
export interface Member extends User {
  role: ProjectRole
}

export type ProjectType = 'WEB' | 'MOBILE' | 'MARKETING' | 'EVENEMENT' | 'AUTRE'

export type ProjectStatus = 'A_VENIR' | 'EN_COURS' | 'ACHEVE'

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  type: ProjectType
  startDate?: string
  status: ProjectStatus
  // When it reached Achevé. Null at any other status.
  completedAt: string | null
  archived: boolean
  owner: User
  // INVITED means the caller only holds an invitation: the project answers
  // with its description and nothing the team is working on.
  access: ProjectAccess
  members: Member[]
  lists: List[]
}

export type TaskStatus = 'A_FAIRE' | 'EN_COURS' | 'TERMINE'

export interface Subtask {
  id: string
  name: string
  done: boolean
}

export interface StatusChange {
  id: string
  fromStatus: TaskStatus | null
  toStatus: TaskStatus
  changedAt: string
}

export interface Task {
  id: string
  name: string
  description?: string
  status: TaskStatus
  startDate: string
  endDate: string
  archived: boolean
  assignee: User | null
  subtasks: Subtask[]
  statusHistory: StatusChange[]
}

// Someone you share a project with, or have exchanged an invitation with.
export interface KnownUser {
  id: string
  username: string
  email: string | null
  avatarUrl?: string
  sharedProjects: { id: string; name: string; color: string }[]
  // Put there on purpose rather than through a shared project.
  saved: boolean
  favourite: boolean
}

// A named set of people, kept once instead of rebuilt project by project.
// Grants no access on its own: it is a shortcut for inviting.
export interface Group {
  id: string
  name: string
  owner: User
  // True when the viewer owns it, and so may rename, delete and manage it.
  owned: boolean
  members: User[]
}

export interface AuthResponse {
  token: string
  user: User
}

// What an account may do to the application. Deliberately not ProjectRole:
// that one says what someone may do inside a single project, and an
// application administrator holds no rights on a project they are not a
// member of.
export type AccountRole = 'ADMIN' | 'USER'

// The signed-in account as the server sees it right now. Wider than User,
// which is how a person appears inside a project or a carnet and says
// nothing about their application role.
export interface Account {
  id: string
  email: string
  username: string
  avatarUrl?: string
  accountRole: AccountRole
  suspended: boolean
  suspendedAt: string | null
  createdAt: string
}
