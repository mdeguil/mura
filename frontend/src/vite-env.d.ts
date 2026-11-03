/// <reference types="vite/client" />

// Read at build time. The VITE_LEGAL_* ones describe whoever runs this
// instance; see frontend/src/legal/legalInfo.ts.
interface ImportMetaEnv {
    readonly VITE_API_URL?: string
    readonly VITE_LEGAL_PUBLISHER_NAME?: string
    readonly VITE_LEGAL_PUBLISHER_ADDRESS?: string
    readonly VITE_LEGAL_CONTACT_EMAIL?: string
    readonly VITE_LEGAL_PUBLICATION_DIRECTOR?: string
    readonly VITE_LEGAL_HOST_NAME?: string
    readonly VITE_LEGAL_HOST_ADDRESS?: string
    readonly VITE_LEGAL_HOST_PHONE?: string
    readonly VITE_LEGAL_PRIVACY_CONTACT?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
