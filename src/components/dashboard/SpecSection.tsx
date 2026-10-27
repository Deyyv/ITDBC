import { memo } from 'react'
import { Info } from 'lucide-react'
import { HOW_IT_WORKS } from '../../data/dashboard'
import { electronicRows, partRows, SPEC_NOTE, type PartRow } from '../../lib/basket/spec'
import SectionHeading from './SectionHeading'

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 rounded-full border border-dash-line-strong"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  )
}

function PartName({ part }: { part: PartRow }) {
  return (
    <span className="font-semibold text-dash-ink">
      {part.name}
      {part.quantity > 1 && <span className="ml-1.5 font-mono text-xs text-dash-muted">×{part.quantity}</span>}
    </span>
  )
}

function PartsTable({ parts }: { parts: readonly PartRow[] }) {
  return (
    <div className="dash-panel overflow-hidden">
      <table className="hidden w-full border-collapse text-left text-sm md:table">
        <caption className="sr-only">Piezas impresas en 3D de la cesta</caption>
        <thead>
          <tr className="border-b border-dash-line bg-dash-cement text-xs text-dash-muted">
            <th scope="col" className="px-5 py-3 font-semibold">
              Pieza
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Función
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Dimensiones
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Material
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dash-line">
          {parts.map((part) => (
            <tr key={part.id} className="align-top">
              <th scope="row" className="px-5 py-4 text-left font-normal">
                <PartName part={part} />
              </th>
              <td className="max-w-[34ch] px-3 py-4 leading-snug text-dash-muted">{part.role}</td>
              <td className="whitespace-nowrap px-3 py-4 font-mono text-[0.8125rem] tabular-nums text-dash-ink">
                {part.dimensions}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-dash-ink">
                <span className="inline-flex items-center gap-2">
                  <Swatch color={part.swatch} />
                  {part.materialLabel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-dash-line md:hidden" aria-label="Piezas impresas en 3D de la cesta">
        {parts.map((part) => (
          <li key={part.id} className="px-4 py-4">
            <p className="flex flex-wrap items-center justify-between gap-2">
              <PartName part={part} />
              <span className="inline-flex items-center gap-2 text-sm text-dash-ink">
                <Swatch color={part.swatch} />
                {part.materialLabel}
              </span>
            </p>
            <p className="mt-1.5 text-sm leading-snug text-dash-muted">{part.role}</p>
            <p className="mt-2 font-mono text-[0.8125rem] tabular-nums text-dash-ink">{part.dimensions}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SpecSection() {
  const parts = partRows()
  const electronics = electronicRows()

  return (
    <section id="ficha" className="dash-section" aria-labelledby="spec-title">
      <div className="dash-container">
        <SectionHeading id="spec-title" title="Ficha técnica">
          Las piezas impresas en 3D, la electrónica que las controla y la secuencia completa de una entrega.
        </SectionHeading>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div>
            <h3 className="mb-3 font-sans text-base font-bold text-dash-ink">Piezas impresas</h3>
            <PartsTable parts={parts} />
          </div>

          <div>
            <h3 className="mb-3 font-sans text-base font-bold text-dash-ink">Electrónica</h3>
            <ul className="dash-panel divide-y divide-dash-line">
              {electronics.map((item) => (
                <li key={item.id} className="px-5 py-4">
                  <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="font-semibold text-dash-ink">{item.role}</span>
                    <span className="font-mono text-xs text-dash-signalInk">{item.model}</span>
                  </p>
                  <p className="mt-1 text-sm leading-snug text-dash-muted">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-4 flex max-w-[78ch] items-start gap-2 text-sm leading-snug text-dash-muted">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {SPEC_NOTE}
        </p>

        <div className="mt-14">
          <h3 className="font-disp text-[1.5rem] font-medium leading-tight tracking-[-0.02em] text-dash-ink">
            Cómo funciona
          </h3>
          <ol className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, index) => (
              <li key={step.title} className="flex gap-4 lg:flex-col lg:gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-dash-forest font-disp text-lg font-medium text-dash-signal"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-sans text-base font-bold text-dash-ink">
                    <span className="sr-only">Paso {index + 1}: </span>
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-dash-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/** Static content: memoised so the 10 Hz telemetry of the page never re-renders it. */
export default memo(SpecSection)
