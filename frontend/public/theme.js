/**
 * Sets the theme before anything paints, so the page never flashes the
 * other one: dark unless this device chose light. Storage can be
 * unavailable (private windows, blocked site data), and dark is the answer
 * then. It lives in its own file rather than inline in index.html so the
 * Content-Security-Policy that nginx sends can refuse every inline script.
 */
try {
    document.documentElement.dataset.theme =
        localStorage.getItem('mura-theme') === 'light' ? 'light' : 'dark'
} catch (e) {
    document.documentElement.dataset.theme = 'dark'
}
