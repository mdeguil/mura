import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

// React Router 7's behaviour, opted into early so its warnings about it stay
// out of the test output.
export const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true }

// Where the app ended up after a navigation, shown on the page so a test can
// read it like anything else.
function CurrentPath() {
    const location = useLocation()
    return <div data-testid="current-path">{location.pathname}</div>
}

/**
 * Renders a screen inside a router at `route`, with a user to drive it.
 * `path` is the route pattern when the screen reads params (/project/:id).
 */
export function renderAt(ui: ReactElement, { route = '/', path = '*' }: { route?: string; path?: string } = {}) {
    return {
        user: userEvent.setup(),
        ...render(
            <MemoryRouter initialEntries={[route]} future={ROUTER_FUTURE}>
                <Routes>
                    <Route path={path} element={ui} />
                    <Route path="*" element={<CurrentPath />} />
                </Routes>
                <CurrentPath />
            </MemoryRouter>
        ),
    }
}
