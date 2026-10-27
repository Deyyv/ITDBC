import { MAX_DISCOUNT_PCT } from '../lib/discount'

const NUMBERS = [
  { value: '3', label: 'tiendas aliadas del barrio' },
  { value: `${MAX_DISCOUNT_PCT} %`, label: 'de descuento máximo según el peso reciclado' },
  { value: '7 días', label: 'de validez para cada cupón QR' },
]

export default function Impacto() {
  return (
    <section
      id="impacto"
      className="bg-follaje text-blanco py-16 sm:py-24"
      style={{ backgroundImage: 'radial-gradient(900px 420px at 12% 110%, rgba(230, 217, 184, 0.12), transparent 60%)' }}
    >
      <div className="wrap">
        <h2 className="section-title text-blanco" style={{ marginBlockEnd: '2.4rem' }}>
          Números que reciclan por ti
        </h2>
        <ul className="grid gap-10 sm:grid-cols-3">
          {NUMBERS.map((n) => (
            <li key={n.value} className="pt-5 border-t border-fibra/30">
              <strong className="block font-disp font-semibold text-[clamp(2.2rem,5vw,3.2rem)] leading-none text-fibra mb-2">
                {n.value}
              </strong>
              <span className="text-blanco/75 text-[0.95rem]">{n.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}