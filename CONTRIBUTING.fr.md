# Contribuer à Mura

[English](CONTRIBUTING.md) | **Français**

Merci de l'intérêt que tu portes à Mura ! 🎉

## Comment contribuer

### Signaler un bug

Utilise le [modèle de rapport de bug](.github/ISSUE_TEMPLATE/bug_report.yml) pour ouvrir un ticket.

### Proposer une fonctionnalité

Utilise le [modèle de demande de fonctionnalité](.github/ISSUE_TEMPLATE/feature_request.yml) pour proposer de nouvelles idées.

### Soumettre une Pull Request

1. Fais un fork du dépôt
2. Crée une branche depuis `main` : `git checkout -b feat/ma-fonctionnalite`
3. Fais tes modifications en suivant les conventions ci-dessous
4. Écris ou mets à jour les tests
5. Committe avec les [Conventional Commits](https://www.conventionalcommits.org/) : `feat:`, `fix:`, `docs:`, `chore:`…
6. Pousse et ouvre une Pull Request vers `main`

## Nom des branches

| Type | Modèle | Exemple |
|------|---------|---------|
| Fonctionnalité | `feat/` | `feat/card-due-date` |
| Correction de bug | `fix/` | `fix/board-drag-drop` |
| Documentation | `docs/` | `docs/api-setup` |
| Tâche annexe | `chore/` | `chore/update-deps` |

## Style de code

- **Backend** : suis les conventions Java usuelles, utilise Lombok quand c'est pertinent
- **Frontend** : ESLint + Prettier (lance `npm run lint` avant de committer)

## Mise en place pour développer

Voir [docs/setup.fr.md](docs/setup.fr.md) pour les instructions détaillées.

## Licence des contributions

Mura n'est pas open source : sa [LICENSE](LICENSE) (en français) interdit de modifier le code, avec une exception — tu peux modifier une copie dans le seul but de proposer ce changement ici, par une pull request. Cette copie ne peut ni servir en production ni être partagée ailleurs.

En ouvrant une pull request, tu acceptes que l'auteur puisse intégrer, modifier et distribuer ta contribution sous la licence de Mura ou une autre, et tu accordes les droits nécessaires pour cela (article 4 de la licence). L'auteur reste libre de refuser toute contribution.

## Code de conduite

Sois respectueux. Nous suivons le [Contributor Covenant](https://www.contributor-covenant.org/).
