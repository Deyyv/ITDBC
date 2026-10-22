import { Recycle } from 'lucide-react'
import { NAV_LINKS } from './Header.jsx'

export default function Footer() {
  return (
    <footer className="bg-sombra text-blanco">
      <div className="wrap grid gap-8 py-12 sm:grid-cols-[1.2fr_1fr] sm:items-start">
        <div className="flex items-start gap-3 max-w-md">
          <span className="flex w-10 h-10 items-center justify-center rounded-full bg-fibra text-sombra flex-none">
            <Recycle size={22} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <p className="text-blanco/65 text-[0.95rem]">
            ReciclaPoint premia el reciclaje escolar: cada entrega suma puntos y se convierte en
            cupones de descuento en tiendas aliadas del barrio.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-7 gap-y-2" aria-label="Pie de página">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-blanco/85 text-[0.93rem] hover:text-fibra">
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="wrap border-t border-blanco/10 py-5 text-[0.85rem] text-blanco/50">
        © 2026 ReciclaPoint · Reciclar, descontar y construir comunidad
      </div>
    </footer>
  )
}