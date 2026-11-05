import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

export const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true }

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
