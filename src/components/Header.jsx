import { useState } from 'react'
import { Recycle, Menu, X } from 'lucide-react'

export const NAV_LINKS = [
  { href: '#/', label: 'Panel' },
  { href: '#registrar', label: 'Registrar' },
  { href: '#saldo', label: 'Mi saldo' },
  { href: '#tiendas', label: 'Tiendas' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-sombra text-blanco shadow-[0_1px_0_rgba(247,250,244,0.08)]">
      <div className="wrap flex items-center justify-between gap-4" style={{ minHeight: 'var(--header-h)' }}>
        <a href="#/" className="flex items-center gap-2.5" aria-label="ReciclaPoint, panel principal">
          <span className="flex w-10 h-10 items-center justify-center rounded-full bg-fibra text-sombra">
            <Recycle size={22} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <span className="font-disp text-[1.3rem] font-semibold tracking-tight">ReciclaPoint</span>
        </a>

        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Principal">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-full text-blanco/80 font-medium text-[0.95rem] transition-colors hover:text-fibra hover:bg-blanco/[0.06]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-fibra/40 bg-fibra/10 text-fibra text-xs font-semibold px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-cascara animate-pulse-dot" />
            Estación activa
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl hover:bg-blanco/[0.08] transition-colors"
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-blanco/10 bg-sombra px-4 py-3 flex flex-col gap-1" aria-label="Menú móvil">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-xl text-blanco/85 font-medium hover:bg-blanco/[0.07] hover:text-fibra"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}