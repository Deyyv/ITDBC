import { useState } from 'react'
import { DISCOUNT_PER_KG, MAX_DISCOUNT_PCT, SCALE_MAX_KG } from '../lib/discount'

const ITEMS = [
  {
    id: 'faq1',
    q: '¿Cómo sé qué descuento me corresponde?',
    a: `Depende del peso de tu última entrega: ${DISCOUNT_PER_KG} % por cada kilo reciclado, hasta ${MAX_DISCOUNT_PCT} % con ${SCALE_MAX_KG} kg.`,
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