# Mura V1

**English** | [Français](../fr/mura_v1_schema.md)

## Data schema

### Entities

| Entity | Attributes |
|--------|-----------|
| **User** | name: String; email: String; password: String |
| **Team** | name: String; #userListId: int |
| **UserList** | #userListId: int; #teamId: int |
| **Importance** | status: String |
| **Task** | name: String; #importanceId: int; duration: int; note: String |
| **Project** | name: String; description: String; #taskListId: int; #teamId: int |
| **TaskList** | #taskId: int; #projectId: int |

---

### Relations

- **User** `n` ——— `n` **Team** *(via UserList)*
- **Team** `1` ——— `n` **Project**
- **Project** `n` ——— `n` **Task** *(via TaskList)*
- **Task** `n` ——— `1` **Importance**

---

### Entity details

#### User
- name: String
- email: String
- password: String

#### Team
- name: String
- \#userListId: int

#### UserList *(junction table)*
- \#userListId: int
- \#teamId: int

#### Importance
- status: String

#### Task
- name: String
- \#importanceId: int
- duration: int
- note: String

#### Project
- name: String
- description: String
- \#taskListId: int
- \#teamId: int

#### TaskList *(junction table)*
- \#taskId: int
- \#projectId: int
