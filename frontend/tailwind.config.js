import defaultTheme from 'tailwindcss/defaultTheme'

// Every colour is read from a CSS variable set in src/index.css, once for the
// light theme and once for the dark one. The values themselves -- and the
// charte they come from -- live there and in docs/charte-graphique.md.
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

const themed = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

const scale = (family) =>
    Object.fromEntries(SHADES.map((shade) => [shade, themed(`${family}-${shade}`)]))

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                // Vert d'eau, the charte's primary colour, at 500.
                brand: scale('brand'),
                // Bleu Océan, the charte's secondary colour, at 600.
                blue: scale('blue'),
                slate: scale('slate'),
                red: scale('red'),
                amber: scale('amber'),
                emerald: scale('emerald'),
                orange: scale('orange'),
                rose: scale('rose'),
                app: themed('app'),
                surface: {
                    DEFAULT: themed('surface'),
                    muted: themed('surface-muted'),
                },
                border: {
                    DEFAULT: themed('border'),
                    strong: themed('border-strong'),
                },
                // Fixed, not themed: the text set on a Vert d'eau fill. That
                // green is too light for white text (1.79:1) in either theme;
                // the charte's own dark background reads at 10.14:1.
                ink: '#11161b',
            },
            fontFamily: {
                sans: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
            },
        },
    },
    plugins: [],
}
