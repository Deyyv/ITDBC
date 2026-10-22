const ITEMS = [
  {
    id: 'mision',
    num: '01',
    title: 'Nuestra misión',
    text: 'Impulsar la cultura del reciclaje en la comunidad educativa, transformando los residuos en beneficios reales y sostenibles para estudiantes, familias y comercios aliados.',
  },
  {
    id: 'vision',
    num: '02',
    title: 'Nuestra visión',
    text: 'Ser en 2030 el programa de reciclaje escolar de referencia en la región, articulando una red de tiendas aliadas comprometidas con la economía circular y el cuidado del planeta.',
  },
]

export default function MissionVision() {
  return (
    <section id="nosotros" className="bg-fibra py-16 sm:py-24">
      <div className="wrap">
        <p className="kicker kiss">Por qué existe ReciclaPoint</p>
        <h2 className="section-title">Misión y visión</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {ITEMS.map(({ id, num, title, text }) => (
            <article key={id} className="card sv">
              <span className="sv-num" aria-hidden="true">{num}</span>
              <h3 className="font-disp font-medium text-[1.4rem] tracking-tight text-follaje mb-1.5 pr-10">{title}</h3>
              <p className="text-suave">{text}</p>
            </article>
          ))}
        </div>
        <p className="mt-5 font-disp italic text-[1.1rem] text-sombra">
          Trabajamos guiados por el reciclaje, la transparencia y la comunidad.
        </p>
      </div>
    </section>
  )
}