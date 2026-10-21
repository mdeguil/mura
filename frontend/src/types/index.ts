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

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export type ProjectAccess = 'MEMBER' | 'INVITED'

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

export interface AuthResponse {
  token: string
  user: User
}
