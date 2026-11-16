# Mura design guide

**English** | [Français](design-guide.fr.md)

Mura's visual identity starts from its logo: a dark theme, and two bright colours — **sea green** and **ocean blue** — that answer each other. Dark is the default theme; a light theme stays available from the top bar.

## The guide's colours

| Role | Name | Hex | Where you find it |
| :--- | :--- | :--- | :--- |
| Main background | Dark Background | `#11161B` | Page background (`bg-app`) in dark |
| Surface / cards | Dark Surface | `#1A222D` | Cards, top bar, windows (`bg-surface`) in dark |
| Primary colour | Sea green | `#33D9B2` | Accent: active tab, links, selection, buttons (`brand-500`) |
| Secondary colour | Ocean Blue | `#2B80C5` | Start of the brand gradient, "In progress" status (`blue-600`) |
| Main text | Off-white | `#F4F7FA` | Body text in dark (`text-slate-800`) |

### The brand gradient

Ocean blue turning into sea green, from left to right, taken one shade deeper: `linear-gradient(90deg, #1F6FB0, #13866B)`.

It is Mura's signature: main action buttons ("Create the project", "Sign in"), avatars, empty-state badges. It is identical in both themes.

It always carries white text, hence these shades: with the bright colours of the guide (`#2B80C5` → `#33D9B2`), white drops to 1.79:1 on the sea-green side. These keep the same hues and hold at least 4.52:1 across the whole width (WCAG AA).

- `bg-brand-gradient` — horizontal, for buttons.
- `bg-brand-gradient-diagonal` — at 135°, for avatars and square badges.

### The light theme

The light theme keeps the guide's two colours (sea green, ocean blue, gradient) on light backgrounds:

| Role | Hex |
| :--- | :--- |
| Main background | `#F1F5F9` |
| Surface / cards | `#FFFFFF` |
| Main text | `#1E293B` |

## Typography

**Inter**, in its variable version, served with the application (the `@fontsource-variable/inter` package) rather than loaded from a font service. The whole interface uses it through `font-sans`.

- Page titles: `text-xl font-semibold` (`text-2xl` for the main lists, "My projects", "Contacts")
- Window and empty-state titles: `text-base font-semibold`
- Section titles inside a card: `text-sm font-semibold`
- Body text: `text-sm`
- Details, dates, counters: `text-xs`, in `text-slate-400` or `text-slate-500`

## How it is set up

Every colour goes through **CSS variables**, defined once for light and once for dark in `frontend/src/index.css`. `frontend/tailwind.config.js` points each Tailwind class at them. A screen written once therefore displays correctly in both themes.

- **Greys are inverted in dark.** `text-slate-800` means "the main text": almost black in light, off-white `#F4F7FA` in dark. `text-slate-400` stays "the quiet text" in both.
- **Pale tints become washes in dark.** `bg-red-50`, `bg-emerald-50`, `bg-brand-50`… are slightly tinted backgrounds: pastel in light, a colour melted into the dark surface in dark. The dark texts that go with them (`text-red-700`, `text-brand-700`…) become light in dark.
- **The theme is chosen before the first paint**, in `frontend/index.html`, from the choice saved on the device (`localStorage`, key `mura-theme`). With no saved choice, it is dark. The sun / moon button in the top bar switches theme (`hooks/useTheme.ts`, `components/ThemeToggle.tsx`).

## Rules of use

1. **No hard-coded colour.** Use the classes (`bg-surface`, `text-slate-600`, `border-border`, `bg-brand-500`…). A fixed hex value does not follow the theme. The only exceptions: each project's own colour, chosen by the user, and the brand gradient.
2. **Neutral backgrounds and borders:** `bg-app` for the page, `bg-surface` for a card, `bg-surface-muted` for a field or a recessed area inside a card, `border-border` for a separator, `border-border-strong` for a field's outline.
3. **Veil behind a window:** `bg-black/50`, never a grey (`bg-slate-900/40` would turn light in dark).
4. **Shadows:** `shadow-black/…`, for the same reason.
5. **Dark pill with light text** (selected filter): `bg-slate-800 text-surface` rather than `text-white`. In dark, the pill neatly inverts into a light pill with dark text.
6. **White text** (`text-white`) only on a dark coloured background: brand gradient, the red of a destructive action, avatar.
7. **Sea green is an accent, not a page background.** Active tab, selected item, link, main button. For sea-green text that is readable on a light background, `text-brand-700`.
8. **Never white text on sea green** (`bg-brand-500`): 1.79:1, unreadable. The text of a sea-green button is `text-ink` (`#11161B`, the guide's dark background), at 10.14:1 in both themes.
9. **State colours:**
   - To do: grey (`slate`)
   - In progress: ocean blue (`blue`)
   - Done / success: green (`emerald`)
   - Warning: amber (`amber`)
   - Danger, deletion, suspended account: red (`red`)
   - A group "on hold": amber, never red — it is not a suspension.

## Files involved

| File | Contents |
| :--- | :--- |
| `frontend/src/index.css` | The colour variables (light and dark), the gradient, the base styles |
| `frontend/tailwind.config.js` | The Tailwind classes tied to the variables, the Inter font |
| `frontend/index.html` | The choice of theme before the first paint |
| `frontend/src/hooks/useTheme.ts` | Reading and changing the theme |
| `frontend/src/components/ThemeToggle.tsx` | The sun / moon button |
