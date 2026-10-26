import { useState } from 'react'
import { Search } from 'lucide-react'
import { useStore } from '../store.jsx'
import PointsCore from './points/PointsCore.jsx'
import HistoryList from './points/HistoryList.jsx'

function BalanceEmpty() {
  return (
    <div className="text-center py-10" data-testid="balance-state-empty">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <span className="absolute inset-0 rounded-full border border-hoja/20 animate-breath" />
        <span className="absolute inset-0 flex items-center justify-center">
          <Search size={28} strokeWidth={1.8} className="text-hoja" aria-hidden="true" />
        </span>
      </div>
      <p className="text-suave">Ingresa tu correo para ver tu saldo</p>
    </div>
  )
}

function BalanceNotFound() {
  return (
    <div className="text-center py-10" data-testid="balance-state-notfound">
      <p className="text-tinta text-lg">No se encontró ninguna cuenta con ese correo.</p>
      <p className="text-suave text-sm mt-1">
        Registra tu primer reciclaje en la sección <a href="#registrar" className="rounded underline underline-offset-2 text-follaje font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-signalInk focus-visible:ring-offset-2">Registrar</a>.
      </p>
    </div>
  )
}

export default function BalanceView() {
  const { state, lookupBalance } = useStore()
  const [email, setEmail] = useState('')

  const onSearch = () => lookupBalance(email)
  const onKeyDown = (e) => {
    if (e.key === 'Enter') lookupBalance(email)
  }

  return (
    <section id="saldo" className="bg-blanco py-16 sm:py-24" data-testid="section-balance">
      <div className="wrap">
        <h2 className="section-title">Mi saldo de puntos</h2>

        <div className="card max-w-3xl">
          <p className="text-suave text-sm mb-6">
            Ingresa tu correo electrónico para ver tus puntos y el historial de entregas.
          </p>

          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              id="lookup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="tu@correo.com"
              aria-label="Correo electrónico"
              className="field flex-1"
            />
            <button id="lookup-btn" type="button" onClick={onSearch} className="btn btn--follaje sm:px-8">
              Buscar
            </button>
          </div>

          <div className="mt-6 border-t border-follaje/10 pt-6" aria-live="polite" data-testid="balance-result">
            {state.balance === null && <BalanceEmpty />}
            {state.balance && !state.balance.found && <BalanceNotFound />}
            {state.balance && state.balance.found && (
              <PointsCore points={state.balance.points} email={state.balance.email} />
            )}
          </div>
        </div>

        {state.balance && state.balance.found && (
          <div className="max-w-3xl">
            <HistoryList history={state.balance.history} />
          </div>
        )}
      </div>
    </section>
  )
}