# Charte graphique de Mura

L'identité visuelle de Mura part de son logo : un thème sombre, et deux couleurs vives — le **vert d'eau** et le **bleu océan** — qui se répondent. Le sombre est le thème par défaut ; un thème clair reste disponible depuis la barre du haut.

## Couleurs de la charte

| Rôle | Nom | Hex | Où on la retrouve |
| :--- | :--- | :--- | :--- |
| Fond principal | Dark Background | `#11161B` | Fond des pages (`bg-app`) en sombre |
| Surface / cartes | Dark Surface | `#1A222D` | Cartes, barre du haut, fenêtres (`bg-surface`) en sombre |
| Couleur primaire | Vert d'eau | `#33D9B2` | Accent : onglet actif, liens, sélection, boutons (`brand-500`) |
| Couleur secondaire | Bleu Océan | `#2B80C5` | Début du dégradé de marque, statut « En cours » (`blue-600`) |
| Texte principal | Blanc cassé | `#F4F7FA` | Texte courant en sombre (`text-slate-800`) |

### Le dégradé de marque

Le bleu océan qui passe au vert d'eau, de gauche à droite, pris une nuance plus profonde : `linear-gradient(90deg, #1F6FB0, #13866B)`.

C'est la signature de Mura : boutons d'action principaux (« Créer le projet », « Se connecter »), avatars, pastilles d'état vide. Il est identique dans les deux thèmes.

Il porte toujours du texte blanc, d'où ces nuances : avec les couleurs vives de la charte (`#2B80C5` → `#33D9B2`), le blanc tombe à 1,79:1 côté vert d'eau. Celles-ci gardent les mêmes teintes et tiennent au moins 4,52:1 sur toute la largeur (WCAG AA).

- `bg-brand-gradient` — horizontal, pour les boutons.
- `bg-brand-gradient-diagonal` — à 135°, pour les avatars et les pastilles carrées.

### Le thème clair

Le thème clair garde les deux couleurs de la charte (vert d'eau, bleu océan, dégradé) sur des fonds clairs :

| Rôle | Hex |
| :--- | :--- |
| Fond principal | `#F1F5F9` |
| Surface / cartes | `#FFFFFF` |
| Texte principal | `#1E293B` |

## Typographie

**Inter**, en version variable, servie avec l'application (paquet `@fontsource-variable/inter`) plutôt que chargée depuis un service de polices. Toute l'interface l'utilise via `font-sans`.

- Titres de page : `text-xl font-semibold` (`text-2xl` pour les listes principales, « Mes projets », « Carnet »)
- Titres de fenêtre et d'état vide : `text-base font-semibold`
- Titres de section dans une carte : `text-sm font-semibold`
- Texte courant : `text-sm`
- Détails, dates, compteurs : `text-xs`, en `text-slate-400` ou `text-slate-500`

## Comment c'est mis en place

Toutes les couleurs passent par des **variables CSS**, définies une fois pour le clair et une fois pour le sombre dans `frontend/src/index.css`. `frontend/tailwind.config.js` fait pointer chaque classe Tailwind dessus. Un écran écrit une seule fois s'affiche donc correctement dans les deux thèmes.

- **Les gris sont inversés en sombre.** `text-slate-800` désigne « le texte principal » : quasi noir en clair, blanc cassé `#F4F7FA` en sombre. `text-slate-400` reste « le texte discret » dans les deux.
- **Les teintes pâles deviennent des lavis en sombre.** `bg-red-50`, `bg-emerald-50`, `bg-brand-50`… sont des fonds légèrement teintés : pastel en clair, couleur fondue dans la surface sombre en sombre. Les textes foncés qui vont avec (`text-red-700`, `text-brand-700`…) deviennent clairs en sombre.
- **Le thème est choisi avant le premier affichage**, dans `frontend/index.html`, d'après le choix enregistré sur l'appareil (`localStorage`, clé `mura-theme`). Sans choix enregistré, c'est le sombre. Le bouton soleil / lune de la barre du haut change de thème (`hooks/useTheme.ts`, `components/ThemeToggle.tsx`).

## Règles d'usage

1. **Pas de couleur en dur.** On utilise les classes (`bg-surface`, `text-slate-600`, `border-border`, `bg-brand-500`…). Une valeur hex fixe ne suit pas le thème. Seules exceptions : la couleur propre à chaque projet, choisie par l'utilisateur, et le dégradé de marque.
2. **Fonds et bordures neutres :** `bg-app` pour la page, `bg-surface` pour une carte, `bg-surface-muted` pour un champ ou une zone en retrait dans une carte, `border-border` pour un séparateur, `border-border-strong` pour le contour d'un champ.
3. **Voile derrière une fenêtre :** `bg-black/50`, jamais un gris (`bg-slate-900/40` deviendrait clair en sombre).
4. **Ombres :** `shadow-black/…`, pour la même raison.
5. **Pastille foncée avec texte clair** (filtre sélectionné) : `bg-slate-800 text-surface` plutôt que `text-white`. En sombre, la pastille s'inverse proprement en pastille claire à texte foncé.
6. **Texte blanc** (`text-white`) seulement sur un fond de couleur foncé : dégradé de marque, rouge d'une action destructive, avatar.
7. **Le vert d'eau sert d'accent, pas de fond de page.** Onglet actif, élément sélectionné, lien, bouton principal. Pour un texte vert d'eau lisible sur fond clair, `text-brand-700`.
8. **Jamais de texte blanc sur le vert d'eau** (`bg-brand-500`) : 1,79:1, illisible. Le texte d'un bouton vert d'eau est `text-ink` (`#11161B`, le fond sombre de la charte), à 10,14:1 dans les deux thèmes.
9. **Couleurs d'état :**
   - À faire : gris (`slate`)
   - En cours : bleu océan (`blue`)
   - Terminé / succès : vert (`emerald`)
   - Attention : ambre (`amber`)
   - Danger, suppression, compte suspendu : rouge (`red`)
   - « En retrait » d'un groupe : ambre, jamais rouge — ce n'est pas une suspension.

## Fichiers concernés

| Fichier | Contenu |
| :--- | :--- |
| `frontend/src/index.css` | Les variables de couleur (clair et sombre), le dégradé, les styles de base |
| `frontend/tailwind.config.js` | Les classes Tailwind reliées aux variables, la police Inter |
| `frontend/index.html` | Le choix du thème avant le premier affichage |
| `frontend/src/hooks/useTheme.ts` | Lire et changer le thème |
| `frontend/src/components/ThemeToggle.tsx` | Le bouton soleil / lune |
