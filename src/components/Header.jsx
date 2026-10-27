import { ArrowLeft } from 'lucide-react'
import BrandMark from './dashboard/BrandMark'

export const NAV_LINKS = [
  { href: '#/', label: 'Panel' },
  { href: '#registrar', label: 'Registrar' },
  { href: '#saldo', label: 'Mi saldo' },
  { href: '#tiendas', label: 'Tiendas' },
]

function isCurrent(href) {
  const hash = window.location.hash
  if (href === '#tiendas') return hash === '#tiendas' || hash === '#tienda'
  return hash === href
}

/** Top bar of the legacy routes: same chrome as the dashboard, links to every section. */
export default function Header() {
  const links = NAV_LINKS.map((link) => (
    <a
      key={link.href}
      href={link.href}
      aria-current={isCurrent(link.href) ? 'page' : undefined}
      className="site-link"
    >
      {link.label}
    </a>
  ))

  return (
    <header className="site-header">
      <div className="dash-container">
        <div className="flex min-h-14 items-center justify-between gap-3 md:min-h-16">
          <a
            href="#/"
            className="inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signalInk focus-visible:ring-offset-2 focus-visible:ring-offset-dash-cement"
            aria-label="ReciclaPoint, volver al panel"
          >
            <BrandMark size={36} />
            <span className="font-disp text-xl font-semibold leading-none tracking-tight text-dash-ink">
              ReciclaPoint
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {links}
          </nav>

          <a href="#/" className="site-cta">
            <ArrowLeft size={15} strokeWidth={2.3} aria-hidden="true" />
            <span className="hidden sm:inline">Volver al panel</span>
            <span className="sm:hidden">Panel</span>
          </a>
        </div>

        <nav
          className="no-scrollbar -mx-4 flex items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden"
          aria-label="Secciones"
        >
          {links}
        </nav>
      </div>
    </header>
  )
}
