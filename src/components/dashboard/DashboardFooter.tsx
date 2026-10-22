export default function DashboardFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 font-mono text-[0.59rem] tracking-[0.02em] text-dash-muted">
      <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-dash-signalDeep" aria-hidden="true" />
          Galga 0–5 kg
        </span>
        <span aria-hidden="true">·</span>
        <span>Tope 30%</span>
        <span aria-hidden="true">·</span>
        <span>Datos de demostración</span>
      </p>
      <p className="inline-flex items-center gap-2">
        <span>ReciclaPoint 2026</span>
        <span aria-hidden="true">·</span>
        <a
          href="#registrar"
          className="font-sans text-[0.65rem] font-semibold text-dash-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signalDeep"
        >
          Ver flujo completo
        </a>
      </p>
    </footer>
  )
}
