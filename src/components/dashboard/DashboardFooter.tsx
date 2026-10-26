import { memo } from 'react'
import { DASH_SECTIONS } from '../../data/dashboard'
import { MAX_DISCOUNT_PCT, SCALE_MAX_KG } from '../../lib/discount'
import BrandMark from './BrandMark'

const OTHER_LINKS = [
  { href: '#registrar', label: 'Registrar una entrega' },
  { href: '#saldo', label: 'Mi saldo de puntos' },
  { href: '#tiendas', label: 'Tiendas aliadas' },
] as const

/** Visible keyboard focus on the forest footer. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime focus-visible:ring-offset-2 focus-visible:ring-offset-dash-forest'

const linkClass = `rounded text-sm text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline ${focusRing}`

function DashboardFooter() {
  return (
    <footer className="on-dark mt-6 bg-dash-forest text-white">
      <div className="dash-container py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-[40ch]">
            <a href="#/" className={`inline-flex items-center gap-2.5 rounded-xl ${focusRing}`}
              aria-label="ReciclaPoint, inicio">
              <BrandMark size={36} />
              <span className="font-disp text-xl font-semibold tracking-tight">ReciclaPoint</span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Cesta inteligente que pesa el plástico reciclado y lo convierte en cupones de descuento
              para las tiendas aliadas del barrio.
            </p>
          </div>

          <nav aria-label="En esta página">
            <h2 className="font-sans text-sm font-bold text-white">En esta página</h2>
            <ul className="mt-3 space-y-2.5">
              {DASH_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={linkClass}>
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Flujo completo">
            <h2 className="font-sans text-sm font-bold text-white">Flujo completo</h2>
            <ul className="mt-3 space-y-2.5">
              {OTHER_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/15 pt-6 text-xs text-white/65">
          <p>© 2026 ReciclaPoint · Reciclar, descontar y construir comunidad</p>
          <p>
            Galga 0–{SCALE_MAX_KG} kg · Descuento máximo {MAX_DISCOUNT_PCT} % · Datos de demostración
          </p>
        </div>
      </div>
    </footer>
  )
}

export default memo(DashboardFooter)
