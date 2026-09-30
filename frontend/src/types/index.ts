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

export interface Task {
  id: string
  name: string
  description?: string
  status: TaskStatus
  startDate: string
  endDate: string
}

export interface AuthResponse {
  token: string
  user: User
}
