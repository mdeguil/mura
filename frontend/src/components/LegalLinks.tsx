import { Link } from 'react-router-dom'

// The legal pages, reachable from every screen: under the sign-in and
// signup cards, and at the foot of every page once signed in. The law asks
// for them to be easy to find, not tucked into a menu.
export default function LegalLinks({ className = '' }: { className?: string }) {
    return (
        <nav aria-label="Informations légales" className={`flex items-center justify-center gap-3 text-xs text-slate-500 ${className}`}>
            <Link to="/mentions-legales" className="underline underline-offset-2 hover:text-slate-700">
                Mentions légales
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/confidentialite" className="underline underline-offset-2 hover:text-slate-700">
                Confidentialité
            </Link>
        </nav>
    )
}
