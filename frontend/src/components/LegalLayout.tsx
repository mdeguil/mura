import React from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import LegalLinks from './LegalLinks'
import { LEGAL_INFO, legalInfoDeclared } from '../legal/legalInfo'

/**
 * The frame of a legal page. Open to everyone, signed in or not: someone
 * deciding whether to create an account has to be able to read these
 * first. An instance that has not declared who runs it says so at the top.
 *
 * @param props the page's title and text
 */
export default function LegalLayout({
    title,
    children,
}: {
    /** The page's heading. */
    title: string
    /** The page's sections. */
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-app px-4 py-10">
            <div className="max-w-2xl mx-auto">
                <Link to="/projets" className="inline-flex items-center gap-2.5 mb-8">
                    <Logo className="w-9 h-9" alt="" />
                    <span className="text-lg font-semibold text-slate-800">Mura</span>
                </Link>

                <article className="bg-surface border border-border rounded-2xl p-8">
                    <h1 className="text-2xl font-semibold text-slate-800 mb-1">{title}</h1>
                    <p className="text-xs text-slate-500 mb-6">Mise à jour le {LEGAL_INFO.lastUpdated}</p>

                    {!legalInfoDeclared() && (
                        <p
                            role="note"
                            className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6"
                        >
                            Cette instance de Mura n'a pas déclaré qui l'administre. Si elle sert à d'autres
                            personnes que celle qui l'a installée, son administrateur doit renseigner ces
                            informations dans sa configuration (variables <code>VITE_LEGAL_*</code>).
                        </p>
                    )}

                    <div className="text-sm text-slate-600 leading-relaxed space-y-4">{children}</div>
                </article>

                <LegalLinks className="mt-6" />
            </div>
        </div>
    )
}

/**
 * One titled section of a legal page.
 *
 * @param props the section's title and text
 */
export function LegalSection({
    title,
    children,
}: {
    /** The section's heading. */
    title: string
    /** What it says. */
    children: React.ReactNode
}) {
    return (
        <section className="space-y-2 pt-2">
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            {children}
        </section>
    )
}
