import { vi } from 'vitest'

// Stands in for services/api in tests that call vi.mock('../services/api'):
// every verb is a spy that a test tells what to answer.
const api = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
}

export default api
