import { memo } from 'react'
import { ArrowUpRight, Store, Wallet } from 'lucide-react'
import { DASH_SECTIONS, DASH_SECTION_IDS } from '../../data/dashboard'
import { useActiveSection } from '../../hooks/useActiveSection'
import { formatDbm } from '../../lib/format'
import BrandMark from './BrandMark'

type DashboardTopBarProps = {
  /** Live Wi-Fi signal of the ESP32, shown in the status chip. */
  rssiDbm: number
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full rounded-full bg-dash-signalDeep opacity-60 motion-safe:animate-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-dash-signalDeep" />
    </span>
  )
}

function StatusChip({ rssiDbm, compact = false }: { rssiDbm: number; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-dash-line bg-white/70 px-3 py-1.5 text-xs font-semibold text-dash-muted">
      <LiveDot />
      <span>
        {compact ? 'En línea' : 'ESP32 en línea'}
        <span className="tabular-nums"> · {formatDbm(rssiDbm)}</span>
      </span>
    </span>
  )
}

function scrollToTop() {
  window.scrollTo(0, 0)
}

function DashboardTopBar({ rssiDbm }: DashboardTopBarProps) {
  const active = useActiveSection(DASH_SECTION_IDS)

  const sectionLinks = DASH_SECTIONS.map((section) => (
    <a
      key={section.id}
      href={`#${section.id}`}
      aria-current={active === section.id ? 'location' : undefined}
      className="site-link"
    >
      {section.label}
    </a>
  ))

  return (
    <header className="site-header">
      <div className="dash-container">
        <div className="flex min-h-14 items-center justify-between gap-3 lg:min-h-16">
          <a
            href="#/"
            onClick={scrollToTop}
            className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signalInk focus-visible:ring-offset-2 focus-visible:ring-offset-dash-cement"
            aria-label="ReciclaPoint, ir al inicio del panel"
          >
            <BrandMark size={36} className="shrink-0" />
            <span className="min-w-0">
              <span className="block truncate font-disp text-xl font-semibold leading-none tracking-tight text-dash-ink">
                ReciclaPoint
              </span>
              <span className="mt-1 hidden text-xs leading-none text-dash-muted xl:block">
                Cesta inteligente de reciclaje
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones del panel">
            {sectionLinks}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-dash-line bg-white/70 sm:hidden"
              title={`ESP32 en línea, ${formatDbm(rssiDbm)}`}
            >
              <LiveDot />
              <span className="sr-only">ESP32 en línea, {formatDbm(rssiDbm)}</span>
            </span>
            <div className="hidden sm:block lg:hidden">
              <StatusChip rssiDbm={rssiDbm} compact />
            </div>
            <div className="hidden xl:block">
              <StatusChip rssiDbm={rssiDbm} />
            </div>
            <a href="#saldo" className="site-link hidden lg:inline-flex">
              <Wallet size={15} strokeWidth={2} aria-hidden="true" />
              Mi saldo
            </a>
            <a href="#tiendas" className="site-link hidden lg:inline-flex">
              <Store size={15} strokeWidth={2} aria-hidden="true" />
              Tienda
            </a>
            <a href="#registrar" className="site-cta">
              <span className="hidden sm:inline">Registrar entrega</span>
              <span className="sm:hidden">Registrar</span>
              <ArrowUpRight size={15} strokeWidth={2.3} aria-hidden="true" />
            </a>
          </div>
        </div>

        <nav
          className="no-scrollbar -mx-4 flex items-center gap-1 overflow-x-auto px-4 pb-2 lg:hidden"
          aria-label="Secciones y accesos del panel"
        >
          {sectionLinks}
          <span className="mx-1 h-5 w-px shrink-0 bg-dash-line" aria-hidden="true" />
          <a href="#saldo" className="site-link">
            Mi saldo
          </a>
          <a href="#tiendas" className="site-link">
            Tienda
          </a>
        </nav>
      </div>
    </header>
  )
}

export default memo(DashboardTopBar)
