function blend(hex: string, amount: number, towards: 'white' | 'black'): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = (num >> 16) & 0xff
    const g = (num >> 8) & 0xff
    const b = num & 0xff
    const target = towards === 'white' ? 255 : 0

    const mix = (channel: number) => Math.round(channel + (target - channel) * amount)

    return `#${[mix(r), mix(g), mix(b)]
        .map((c) => c.toString(16).padStart(2, '0'))
        .join('')}`
}

const lighten = (hex: string, amount: number) => blend(hex, amount, 'white')
const darken = (hex: string, amount: number) => blend(hex, amount, 'black')

/**
 * A clearly visible light-to-dark gradient in the project's own hue.
 *
 * @param hex the project's colour, as `#rrggbb`
 * @param angle the gradient's direction, in degrees
 * @returns a CSS `linear-gradient()`
 */
export function projectGradient(hex: string, angle = 135): string {
    return `linear-gradient(${angle}deg, ${lighten(hex, 0.3)}, ${darken(hex, 0.25)})`
}

/**
 * The two stop colours used by projectGradient, for callers (e.g. SVG
 * `<linearGradient>`) that need them separately rather than as a CSS
 * string.
 *
 * @param hex the project's colour, as `#rrggbb`
 * @returns the lighter and the darker stop, as `#rrggbb`
 */
export function projectGradientStops(hex: string): [string, string] {
    return [lighten(hex, 0.3), darken(hex, 0.25)]
}

/**
 * The gradient above topped with a diagonal glossy highlight, for a
 * "glazed glass" look (used on the project card accent bar and the colour
 * swatches).
 *
 * @param hex the project's colour, as `#rrggbb`
 * @param angle the gradient's direction, in degrees
 * @returns a CSS `background` value of two layered gradients
 */
export function projectGlassBackground(hex: string, angle = 135): string {
    return [
        'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%)',
        projectGradient(hex, angle),
    ].join(', ')
}

/** The colours a project can be given, the first being the default. */
export const PROJECT_COLORS = ['#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#22c55e']
