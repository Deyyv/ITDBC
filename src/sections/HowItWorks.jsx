const STEPS = [
  {
    num: 1,
    title: 'Registra tu entrega',
    text: 'Escribe tu correo y el peso del material reciclado en la estación.',
  },
  {
    num: 2,
    title: 'Suma tus puntos',
    text: 'Cada entrega acumula puntos en tu saldo y queda en tu historial.',
  },
  {
    num: 3,
    title: 'Genera tu cupón',
    text: 'Elige tu tienda aliada y obtén un porcentaje según el peso reciclado.',
  },
  {
    num: 4,
    title: 'Canjea con el QR',
    text: 'Presenta el código en la tienda y descuenta en tu compra. Válido 7 días.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-blanco py-16 sm:py-24">
      <div className="wrap">
        <p className="kicker kiss">De tu bolsa a la tienda</p>
        <h2 className="section-title">Cómo funciona</h2>
        <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.num} className="paso">
              <span className="paso-num" aria-hidden="true">{s.num}</span>
              <h3 className="font-disp font-medium text-[1.25rem] tracking-tight mb-1">{s.title}</h3>
              <p className="text-suave text-[0.97rem] max-w-[34ch]">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}