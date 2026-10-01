export interface User {
  id: string
  email: string
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
  members: User[]
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
  subtasks: Subtask[]
  statusHistory: StatusChange[]
}

export interface AuthResponse {
  token: string
  user: User
}
