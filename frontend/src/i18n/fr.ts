import * as account from './messages/account'
import * as admin from './messages/admin'
import * as auth from './messages/auth'
import * as common from './messages/common'
import * as directory from './messages/directory'
import * as groups from './messages/groups'
import * as legal from './messages/legal'
import * as notifications from './messages/notifications'
import * as people from './messages/people'
import * as projectPage from './messages/projectPage'
import * as projects from './messages/projects'
import * as shell from './messages/shell'
import * as tasks from './messages/tasks'
import * as team from './messages/team'

/**
 * Every text of the interface in French, the reference language. The texts
 * live by area in `messages/`, each file holding the French and the English
 * side by side; TypeScript checks that the English gives every French key.
 */
const fr = {
    ...common.fr,
    ...shell.fr,
    ...auth.fr,
    ...people.fr,
    ...projects.fr,
    ...tasks.fr,
    ...account.fr,
    ...admin.fr,
    ...directory.fr,
    ...groups.fr,
    ...legal.fr,
    ...notifications.fr,
    ...projectPage.fr,
    ...team.fr,
}

/** The shape every language has to fill in, key for key. */
export type Messages = typeof fr

export default fr
