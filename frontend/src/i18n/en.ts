import type { Messages } from './fr'
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

/** Every text of the interface in English, gathered from `messages/`. */
const en: Messages = {
    ...common.en,
    ...shell.en,
    ...auth.en,
    ...people.en,
    ...projects.en,
    ...tasks.en,
    ...account.en,
    ...admin.en,
    ...directory.en,
    ...groups.en,
    ...legal.en,
    ...notifications.en,
    ...projectPage.en,
    ...team.en,
}

export default en
