/** A person as they appear inside a project, a carnet or a group. */
export interface User {
  /** Their account id. */
  id: string
  /**
   * Their address. Null for a team member seen by someone who only holds an
   * invitation: the server withholds addresses until they join.
   */
  email: string | null
  /** Their name. */
  username: string
  /** Their picture, if they have one. */
  avatarUrl?: string
  /**
   * Whether their account is suspended. Everyone who works with someone
   * needs to know they can no longer be reached. Their application role
   * stays private; this does not.
   */
  suspended?: boolean
}

/** A card label. Left over from the first scaffold; nothing uses it. */
export interface Label {
  /** Its id. */
  id: string
  /** Its name. */
  name?: string
  /** Its colour. */
  color: string
}

/** A card. Left over from the first scaffold; nothing uses it. */
export interface Card {
  /** Its id. */
  id: string
  /** Its title. */
  title: string
  /** Its description. */
  description?: string
  /** Its place in its list. */
  position: number
  /** When it is due. */
  dueDate?: string
  /** Who is on it. */
  members: User[]
  /** Its labels. */
  labels: Label[]
}

/** A list of cards. Left over from the first scaffold; always empty. */
export interface List {
  /** Its id. */
  id: string
  /** Its name. */
  name: string
  /** Its place in the project. */
  position: number
  /** Its cards. */
  cards: Card[]
}

/**
 * What someone may do inside one project: the owner runs it, admins run the
 * team with them, members work on the tasks.
 */
export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER'

/**
 * Where an invitation stands. EXPIRED means it went unanswered past its
 * window.
 */
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'

/**
 * How much of a project the reader may see: a member works on it, someone
 * only invited can read its description and decide.
 */
export type ProjectAccess = 'MEMBER' | 'INVITED'

/**
 * What a line in the bell is about.
 *
 * - `ADDED_TO_PROJECT`: put on a project's team from one of your groups,
 *   with no invitation to answer -- which is why you are told.
 * - `MEMBER_SUSPENDED`, `MEMBER_RESTORED`, `MEMBER_DELETED`: about an
 *   account rather than a project membership: somebody you work with was
 *   suspended, let back in, or removed for good. Sent to the owner of each
 *   project and each group they belong to, so the subject is a project for
 *   some and a group for others.
 * - `CONTACT_REQUESTED`, `CONTACT_ACCEPTED`: about a person rather than a
 *   project or a group: somebody wants you in their carnet, or said yes to
 *   you.
 * - The `GROUP_*` and `*_GROUP` types: about a group -- who runs it, who is
 *   in it, and who was set aside in it. Being on hold is not account
 *   suspension: the member stays, and their account is untouched.
 */
export type NotificationType =
  | 'REMOVED_FROM_PROJECT'
  | 'MEMBER_LEFT_PROJECT'
  | 'ADDED_TO_PROJECT'
  | 'MEMBER_SUSPENDED'
  | 'MEMBER_RESTORED'
  | 'MEMBER_DELETED'
  | 'CONTACT_REQUESTED'
  | 'CONTACT_ACCEPTED'
  | 'GROUP_ENTRUSTED'
  | 'GROUP_MANAGER_CHANGED'
  | 'GROUP_DELETED'
  | 'ADDED_TO_GROUP'
  | 'REMOVED_FROM_GROUP'
  | 'MEMBER_LEFT_GROUP'
  | 'HELD_IN_GROUP'
  | 'RESTORED_IN_GROUP'

/**
 * A line in the bell. Named around the DOM's own Notification. Unlike an
 * invitation there is nothing to answer: clearing one deletes it.
 */
export interface AppNotification {
  /** Its id. */
  id: string
  /** What it is about. */
  type: NotificationType
  /** The project to open; null when it is no longer the reader's to open. */
  projectId: string | null
  /**
   * The project's name when it was written. At most one of projectName and
   * groupName is set; neither, for news about a person.
   */
  projectName: string | null
  /** The group to open; null once there is no group left to open. */
  groupId: string | null
  /** The group's name when it was written. */
  groupName: string | null
  /** Who caused it, or who it is about. */
  actorName: string
  /** The note that came with it, if any. */
  message: string | null
  /** Whether the reader has read it. */
  read: boolean
  /** When it was written, as an ISO date-time. */
  createdAt: string
}

/** An invitation to join a project, from either side. */
export interface Invitation {
  /** Its id. */
  id: string
  /** The project. */
  projectId: string
  /** The project's name. */
  projectName: string
  /** The project's colour, as `#rrggbb`. */
  projectColor: string
  /** Who was invited. */
  invitedUser: User
  /** Who invited them. */
  invitedBy: User
  /** Where it stands. */
  status: InvitationStatus
  /** Whether the invitee has seen it in the bell. */
  read: boolean
  /**
   * Cleared from the bell. The invitation is still pending: it keeps
   * showing in the projects list until it is answered.
   */
  dismissed: boolean
  /** When it was sent. */
  createdAt: string
  /**
   * When it stops being answerable. Past it the server marks it EXPIRED the
   * next time anyone reads it.
   */
  expiresAt: string
}

/**
 * A user plus the role they hold on one project, flattened so a member row
 * renders from a single object.
 */
export interface Member extends User {
  /** Their role on this project. */
  role: ProjectRole
}

/**
 * A project type. A row an administrator owns, not a constant: the label
 * and the emoji come from the server, because that is where they can be
 * changed.
 */
export interface ProjectType {
  /** Its id. */
  id: string
  /** Its name. */
  label: string
  /** Its emoji. */
  emoji: string
  /** Where it comes in the list. */
  position: number
  /** The one that cannot be deleted; the others fall back to it. */
  fallback: boolean
  /** How many projects hold it. Only the administration listing has it. */
  projectCount?: number
}

/** Where a project's work stands, set by whoever runs the team. */
export type ProjectStatus = 'A_VENIR' | 'EN_COURS' | 'ACHEVE'

/** A project as the reader may see it. */
export interface Project {
  /** Its id. */
  id: string
  /** Its name. */
  name: string
  /** Its description. */
  description?: string
  /** Its colour, as `#rrggbb`. */
  color: string
  /** What it is filed under. */
  type: ProjectType
  /** When it starts, as `YYYY-MM-DD`. */
  startDate?: string
  /** Where its work stands. */
  status: ProjectStatus
  /** When it reached Achevé. Null at any other status. */
  completedAt: string | null
  /** Whether it is in its owner's bin. */
  archived: boolean
  /** Who owns it. */
  owner: User
  /**
   * INVITED means the caller only holds an invitation: the project answers
   * with its description and nothing the team is working on.
   */
  access: ProjectAccess
  /** Its team, owner first. */
  members: Member[]
  /** Always empty: left over from the first scaffold. */
  lists: List[]
}

/**
 * Where a task stands. It only moves forward, one stage at a time; TERMINE
 * is final.
 */
export type TaskStatus = 'A_FAIRE' | 'EN_COURS' | 'TERMINE'

/** A step of a task. */
export interface Subtask {
  /** Its id. */
  id: string
  /** Its name. */
  name: string
  /** Whether it is ticked off. */
  done: boolean
}

/** One step in a task's history. */
export interface StatusChange {
  /** Its id. */
  id: string
  /** The status it left; null for the task's creation. */
  fromStatus: TaskStatus | null
  /** The status it reached. */
  toStatus: TaskStatus
  /** When. */
  changedAt: string
}

/** A task of a project. */
export interface Task {
  /** Its id. */
  id: string
  /** Its name. */
  name: string
  /** Its description. */
  description?: string
  /** Where it stands. */
  status: TaskStatus
  /** Its first day, as `YYYY-MM-DD`. */
  startDate: string
  /** Its last day, as `YYYY-MM-DD`. */
  endDate: string
  /** Whether it is archived. */
  archived: boolean
  /** Who is in charge, if anyone. */
  assignee: User | null
  /** Its subtasks, oldest first. */
  subtasks: Subtask[]
  /** Its status changes, oldest first, the creation included. */
  statusHistory: StatusChange[]
}

/** Someone in the carnet: shared a project with, or exchanged an invitation with. */
export interface KnownUser {
  /** Their account id. */
  id: string
  /** Their name. */
  username: string
  /** Their address, if the reader may see it. */
  email: string | null
  /** Their picture, if they have one. */
  avatarUrl?: string
  /** The active projects both share. */
  sharedProjects: { id: string; name: string; color: string }[]
  /** Put there on purpose rather than through a shared project. */
  saved: boolean
  /** Starred by the reader. */
  favourite: boolean
  /** Whether their account is suspended. */
  suspended: boolean
  /** Asked for, not yet answered. In neither carnet until they agree. */
  pending: boolean
}

/**
 * A named set of people, kept once instead of rebuilt project by project.
 * Grants no access on its own: it is a shortcut for bringing people onto a
 * project together.
 */
export interface Group {
  /** Its id. */
  id: string
  /** Its name. */
  name: string
  /** Its gérant. */
  owner: User
  /** True when the viewer owns it, and so may rename, delete and manage it. */
  owned: boolean
  /** When it was created. */
  createdAt: string
  /** Everyone in it, the gérant included. */
  members: GroupMember[]
}

/**
 * A person in a group, with what belongs to the membership rather than to
 * them.
 */
export interface GroupMember extends User {
  /**
   * The gérant setting someone aside -- on leave, between assignments.
   * Concerns this group alone; `suspended` comes from the account and means
   * they cannot sign in at all.
   */
  onHold: boolean
  /** When they were added to the group. */
  joinedAt: string
}

/** What signing in or registering answers with. */
export interface AuthResponse {
  /** The token to send with every request from now on. */
  token: string
  /** The account it signs in. */
  user: User
}

/**
 * What an account may do to the application. Deliberately not ProjectRole:
 * that one says what someone may do inside a single project, and an
 * application administrator holds no rights on a project they are not a
 * member of.
 */
export type AccountRole = 'ADMIN' | 'USER'

/**
 * The signed-in account as the server sees it right now. Wider than User,
 * which is how a person appears inside a project or a carnet and says
 * nothing about their application role.
 */
export interface Account {
  /** Its id. */
  id: string
  /** Its address. */
  email: string
  /** Its name. */
  username: string
  /** Its picture, if any. */
  avatarUrl?: string
  /** What it may do to the application. */
  accountRole: AccountRole
  /** Whether an administrator has suspended it. */
  suspended: boolean
  /**
   * False until the code mailed at registration comes back. The app shows
   * the code screen and nothing else while it is.
   */
  emailVerified: boolean
  /** When it was suspended, if it is. */
  suspendedAt: string | null
  /** When it was registered. */
  createdAt: string
  /** The language it reads Mura in; its mails are written in it. */
  language?: 'fr' | 'en'
}

/**
 * What deleting an account will actually do, worked out by the server
 * before anything happens.
 */
export interface AccountDeletionPreview {
  /** The account to delete. */
  username: string
  /** Projects that pass to another member, with who takes each one. */
  projectsTransferred: { projectName: string; successorUsername: string }[]
  /** Projects nobody else is on, which go with the account. */
  projectsDeleted: string[]
  /** Groups the account runs, which go with it. */
  groupsDeleted: string[]
  /** How many tasks lose their assignee. */
  tasksUnassigned: number
}

/**
 * A group as an administrator sees it: who runs it and who is in it. The
 * members are there to be read; changing them stays the gérant's business.
 */
export interface AdminGroup {
  /** Its id. */
  id: string
  /** Its name. */
  name: string
  /** Its gérant. */
  manager: User
  /** How many people are in it. */
  memberCount: number
  /** When it was created. */
  createdAt: string
  /** Everyone in it. */
  members: GroupMember[]
}
