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

export interface Board {
  id: string
  name: string
  description?: string
  color: string
  owner: User
  members: User[]
  lists: List[]
}

export interface AuthResponse {
  token: string
  user: User
}
