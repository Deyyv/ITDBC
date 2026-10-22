import { useState } from 'react'
import { Scale, Zap } from 'lucide-react'
import { useStore } from '../store.jsx'
import ResultCard from './ResultCard.jsx'

export default function RegisterView() {
  const { state, registerRecycle, clearRegistration } = useStore()
  const [email, setEmail] = useState('')
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState('g')

  const closeResult = clearRegistration

  const onSubmit = (e) => {
    e.preventDefault()
    registerRecycle({ email, weight, unit })
  }

  const showResult = state.registration !== null
  const isDisabled = !email.trim() || !weight || parseFloat(weight) <= 0 || !unit

  return (
    <section id="registrar" className="bg-lavada py-16 sm:py-24" data-testid="section-register">
      <div className="wrap">
        <p className="kicker kiss">Empieza aquí</p>
        <h2 className="section-title">Registrar una entrega</h2>

        <div className="card max-w-3xl">
          <p className="text-suave text-sm mb-6">
            Correo y peso del material reciclado para sumar puntos y desbloquear tu descuento.
          </p>

          <form id="recycle-form" onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-suave mb-1.5">
                Correo electrónico
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="field"
              />
            </div>

            <div className="flex gap-3 flex-col sm:flex-row">
              <div className="flex-1">
                <label htmlFor="reg-weight" className="block text-sm font-semibold text-suave mb-1.5">
                  Peso
                </label>
                <input
                  id="reg-weight"
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  className="field"
                />
              </div>
              <div className="sm:w-44">
                <label htmlFor="reg-unit" className="block text-sm font-semibold text-suave mb-1.5">
                  Unidad
                </label>
                <select
                  id="reg-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="field appearance-none"
                >
                  <option value="g">Gramos (g)</option>
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="mg">Miligramos (mg)</option>
                </select>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-fibra/40 border border-fibra px-4 py-2 text-cascara text-[0.82rem] font-semibold">
              <Scale size={15} className="shrink-0" aria-hidden="true" />
              Cada 500 mg = 1 punto. Convertimos cualquier unidad a miligramos.
            </div>

            <button type="submit" disabled={isDisabled} className="btn btn--follaje full text-lg inline-flex items-center justify-center gap-2">
              <Zap size={19} fill="currentColor" aria-hidden="true" />
              Registrar y emitir comprobante
            </button>
          </form>
        </div>

        {showResult && (
          <div className="mt-6 max-w-3xl">
            <ResultCard registration={state.registration} onClose={closeResult} />
          </div>
        )}
      </div>
    </section>
  )
}