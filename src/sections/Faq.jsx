import { useState } from 'react'

const ITEMS = [
  {
    id: 'faq1',
    q: '¿Cómo sé qué descuento me corresponde?',
    a: 'Depende del peso de tu última entrega: 250 g–1 kg = 5 %, 1–3 kg = 10 %, 3–5 kg = 15 % y 5 kg o más = 25 %.',
  },
  {
    id: 'faq2',
    q: '¿Cuánto tiempo es válido mi cupón?',
    a: 'Cada cupón QR tiene validez de 7 días desde su emisión. Verás la fecha de vencimiento en el comprobante.',
  },
  {
    id: 'faq3',
    q: '¿Dónde puedo canjear mi descuento?',
    a: 'En cualquiera de las tiendas aliadas: EcoMarket, VerdeCafé y EcoSchool. Solo presenta el QR o el código del cupón.',
  },
  {
    id: 'faq4',
    q: '¿Qué materiales puedo registrar?',
    a: 'Papel, cartón, plástico y vidrio. En esta versión demo registras el peso de cualquier material reciclado y obtienes tu descuento.',
  },
]

export default function Faq() {
  const [openId, setOpenId] = useState(null)

  return (
    <section id="faq" className="bg-lavada py-16 sm:py-24">
      <div className="wrap">
        <p className="kicker kiss">Preguntas frecuentes</p>
        <h2 className="section-title">Todo lo que quieres saber</h2>
        <div className="acc-list">
          {ITEMS.map(({ id, q, a }) => {
            const open = openId === id
            return (
              <div key={id} className="acc">
                <h3>
                  <button
                    type="button"
                    className="acc-btn"
                    aria-expanded={open}
                    aria-controls={`${id}-panel`}
                    onClick={() => setOpenId(open ? null : id)}
                  >
                    {q}
                  </button>
                </h3>
                <div className="acc-panel" id={`${id}-panel`} role="region" hidden={!open}>
                  <p>{a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}