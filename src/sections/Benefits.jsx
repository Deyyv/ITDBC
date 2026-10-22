import { Scale, Sparkles, QrCode, Recycle } from 'lucide-react'

const ITEMS = [
  {
    Icon: Scale,
    title: 'Peso exacto',
    text: 'Registra tu material en gramos, kilogramos o miligramos en un solo paso.',
  },
  {
    Icon: Sparkles,
    title: 'Puntos por entrega',
    text: 'Cada 500 mg se convierte en 1 punto que se acumula en tu saldo.',
  },
  {
    Icon: QrCode,
    title: 'Cupón QR',
    text: 'Elige tu tienda aliada y genera un descuento según el peso que reciclaste.',
  },
  {
    Icon: Recycle,
    title: 'Economía circular',
    text: 'Premia tu reciclaje y apoya los comercios comprometidos del barrio.',
  },
]

export default function Benefits() {
  return (
    <section id="beneficios" className="bg-lavada py-16 sm:py-24">
      <div className="wrap">
        <p className="kicker kiss">Por qué ReciclaPoint</p>
        <h2 className="section-title">Reciclar aquí vale doble</h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ Icon, title, text }) => (
            <li key={title} className="card">
              <span className="icon-circle">
                <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h3 className="font-disp font-medium text-[1.3rem] tracking-tight mt-4 mb-1.5">{title}</h3>
              <p className="text-suave text-[0.97rem]">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}