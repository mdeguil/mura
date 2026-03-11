# Mura V1

## Schéma de donnée

### Entités

| Entité | Attributs |
|--------|-----------|
| **Utilisateur** | nom: String; email: String; mdp: String |
| **Equipe** | nom: String; #idListeUtilisateur: int |
| **ListeUtilisateur** | #idListeUtilisateur: int; #idEquipe: int |
| **Importance** | status: String |
| **Tâche** | nom: String; #idImportance: int; duree: int; note: String |
| **Projet** | nom: String; description: String; #idListeTache: int; #idEquipe: int |
| **ListeTache** | #idTache: int; #idProjet: int |

---

### Relations

- **Utilisateur** `n` ——— `n` **Equipe** *(via ListeUtilisateur)*
- **Equipe** `1` ——— `n` **Projet**
- **Projet** `n` ——— `n` **Tâche** *(via ListeTache)*
- **Tâche** `n` ——— `1` **Importance**

---

### Détail des entités

#### Utilisateur
- nom : String
- email : String
- mdp : String

#### Equipe
- nom : String
- \#idListeUtilisateur : int

#### ListeUtilisateur *(table de jonction)*
- \#idListeUtilisateur : int
- \#idEquipe : int

#### Importance
- status : String

#### Tâche
- nom : String
- \#idImportance : int
- duree : int
- note : String

#### Projet
- nom : String
- description : String
- \#idListeTache : int
- \#idEquipe : int

#### ListeTache *(table de jonction)*
- \#idTache : int
- \#idProjet : int
