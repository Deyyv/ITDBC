import BrandMark from './dashboard/BrandMark'
import { NAV_LINKS } from './Header.jsx'

export default function Footer() {
  return (
    <footer className="on-dark bg-dash-forest text-white">
      <div className="dash-container grid gap-8 py-10 sm:grid-cols-[1.4fr_1fr] sm:items-start">
        <div className="max-w-md">
          <a
            href="#/"
            className="inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime focus-visible:ring-offset-2 focus-visible:ring-offset-dash-forest"
            aria-label="ReciclaPoint, inicio"
          >
            <BrandMark size={36} />
            <span className="font-disp text-xl font-semibold tracking-tight">ReciclaPoint</span>
          </a>
          <p className="mt-4 text-sm leading-relaxed text-white/75">
            ReciclaPoint premia el reciclaje escolar: cada entrega suma puntos y se convierte en
            cupones de descuento en tiendas aliadas del barrio.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2.5" aria-label="Pie de página">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded text-sm text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-lime focus-visible:ring-offset-2 focus-visible:ring-offset-dash-forest"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="dash-container border-t border-white/15 py-5 text-xs text-white/65">
        © 2026 ReciclaPoint · Reciclar, descontar y construir comunidad
      </div>
    </footer>
  )
}
