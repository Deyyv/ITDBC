import { QRCodeCanvas } from 'qrcode.react'
import { Recycle } from 'lucide-react'
import { STORES } from '../data/stores.js'

const FACTS = [
  { value: '3', label: 'tiendas aliadas' },
  { value: '5–25 %', label: 'de descuento por peso' },
  { value: '7 días', label: 'de validez del cupón' },
]

const SAMPLE_PAYLOAD = [
  'RECICLAPOINT — CUPÓN DE DESCUENTO',
  'Tienda aliada: EcoMarket',
  'Descuento: 10%',
  'Material reciclado: 2.50 kg',
  'Código: RP-ECM-DEM0',
  'Válido hasta: 2026-10-01',
].join('\n')

export default function Hero() {
  return (
    <section
      id="inicio"
      className="bg-follaje text-blanco"
      style={{ backgroundImage: 'radial-gradient(1100px 500px at 85% -10%, rgba(230, 217, 184, 0.14), transparent 60%)' }}
    >
      <div className="wrap grid gap-12 items-center py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="kicker">Cada kilo reciclado vale</p>
          <h1 className="text-[clamp(2.5rem,6vw,4.1rem)] font-disp font-medium leading-[1.04] tracking-tight mb-5 max-w-[18ch]">
            Recicla, suma puntos y descuenta en tu tienda del barrio
          </h1>
          <p className="text-lg text-blanco/80 max-w-[46ch] mb-8">
            ReciclaPoint es la estación escolar que convierte el material reciclado en puntos y en
            cupones QR de descuento en tiendas aliadas de la comunidad.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <a className="btn btn--pea" href="#registrar">
              Registrar una entrega
            </a>
            <a className="btn btn--ghost" href="#tiendas">
              Ver tiendas aliadas
            </a>
          </div>
          <dl className="flex flex-wrap gap-7 pt-6" style={{ borderTop: '1px solid rgba(230, 217, 184, 0.25)' }}>
            {FACTS.map((f) => (
              <div key={f.value}>
                <dt className="font-disp font-semibold text-[1.4rem] text-fibra leading-none">{f.value}</dt>
                <dd className="text-[0.88rem] text-blanco/70 mt-1">{f.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative w-[290px] rounded-[24px] bg-card text-tinta p-5 shadow-oro animate-drift" aria-hidden="true">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 font-disp font-semibold text-sombra">
                <Recycle size={18} className="text-hoja" />
                ReciclaPoint
              </span>
              <span className="rounded-full bg-cascara text-sombra text-xs font-bold px-2.5 py-1">-10 %</span>
            </div>
            <div className="rounded-xl bg-white border-2 border-dashed border-fibra p-4 flex justify-center">
              <QRCodeCanvas value={SAMPLE_PAYLOAD} size={168} fgColor="#152B1E" bgColor="#FFFFFF" level="M" />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-semibold text-sombra">{STORES[0].name}</span>
              <span className="text-suave text-xs">Escanea y descuenta</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}