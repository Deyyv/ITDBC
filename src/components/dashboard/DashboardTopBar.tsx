import { ArrowUpRight, Store } from 'lucide-react'
import BrandMark from './BrandMark'

export default function DashboardTopBar() {
  return (
    <>
    <header className="dash-topbar">
      <a
        href="#/"
        className="group flex min-w-0 items-center gap-3 rounded-2xl pr-2 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-dash-signalDeep focus-visible:ring-offset-4 focus-visible:ring-offset-dash-cement"
        aria-label="ReciclaPoint, ir al panel principal"
      >
        <BrandMark size={42} className="shrink-0 transition-transform duration-300 group-hover:-rotate-3" />
        <span className="min-w-0">
          <span className="block truncate font-disp text-[1.28rem] font-semibold leading-none tracking-[-0.025em] text-dash-ink sm:text-[1.42rem]">
            ReciclaPoint
          </span>
          <span className="mt-1 hidden font-mono text-[0.63rem] tracking-[0.04em] text-dash-muted sm:block">
            Cesta inteligente · galga 5 kg
          </span>
        </span>
      </a>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <span className="hidden items-center gap-2 rounded-full border border-dash-line bg-white/60 px-3 py-1.5 font-mono text-[0.62rem] text-dash-muted lg:inline-flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-dash-signalDeep opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-dash-signalDeep" />
          </span>
          Estación activa
        </span>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Accesos de la estación">
          <a
            href="#saldo"
            className="rounded-full px-3 py-2 text-[0.82rem] font-semibold text-dash-muted transition-colors hover:bg-white/70 hover:text-dash-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signalDeep"
          >
            Mi saldo
          </a>
          <a
            href="#tiendas"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[0.82rem] font-semibold text-dash-muted transition-colors hover:bg-white/70 hover:text-dash-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signalDeep"
          >
            <Store size={14} strokeWidth={2} aria-hidden="true" />
            Tienda
          </a>
        </nav>

        <a
          href="#registrar"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-dash-ink px-3 py-2 text-[0.78rem] font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-dash-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signalDeep focus-visible:ring-offset-2 focus-visible:ring-offset-dash-cement active:translate-y-0 sm:px-4 sm:text-[0.82rem]"
        >
          <span className="hidden sm:inline">Registrar entrega</span>
          <span className="sm:hidden">Registrar</span>
          <ArrowUpRight size={15} strokeWidth={2.3} aria-hidden="true" />
        </a>
      </div>
    </header>

    <nav className="-mt-1 flex items-center gap-1.5 md:hidden" aria-label="Accesos rápidos">
      <a
        href="#saldo"
        className="inline-flex min-h-9 items-center rounded-full border border-dash-line bg-white/65 px-3 py-1.5 text-[0.7rem] font-semibold text-dash-muted transition-colors hover:bg-white hover:text-dash-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signalDeep"
      >
        Mi saldo
      </a>
      <a
        href="#tiendas"
        className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dash-line bg-white/65 px-3 py-1.5 text-[0.7rem] font-semibold text-dash-muted transition-colors hover:bg-white hover:text-dash-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signalDeep"
      >
        <Store size={13} strokeWidth={2} aria-hidden="true" />
        Tienda
      </a>
      <span className="ml-auto font-mono text-[0.54rem] tracking-[0.02em] text-dash-muted/75">
        Galga 5 kg
      </span>
    </nav>
    </>
  )
}
