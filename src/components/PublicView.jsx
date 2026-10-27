import { RefreshCw, SearchX, WifiOff } from 'lucide-react'
import { useSharedLookup } from '../hooks/useSharedLookup'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import PointsCore from './points/PointsCore.jsx'
import HistoryList from './points/HistoryList.jsx'

function PublicHeader({ token }) {
  const short = token.startsWith('t-') ? token.slice(2, 8) : token.slice(0, 6)
  return (
    <div className="card max-w-3xl mx-auto mb-6 text-center">
      <h2 className="font-disp text-2xl font-medium text-tinta">Verificación de puntos: comprobante recibido por QR</h2>
      <p className="text-suave text-sm mt-1 font-mono">#{short}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="text-center py-12" role="status" data-testid="public-loading">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <span className="absolute inset-0 rounded-full border border-hoja/20 animate-breath" />
        <RefreshCw className="animate-spin text-hoja absolute inset-0 m-auto" size={28} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <p className="text-suave">Consultando tus puntos…</p>
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="text-center py-12" role="status" data-testid="public-not-found">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <span className="absolute inset-0 rounded-full border border-hoja/20 animate-breath" />
        <SearchX size={30} strokeWidth={1.6} className="text-hoja absolute inset-0 m-auto" aria-hidden="true" />
      </div>
      <p className="text-tinta text-lg">Comprobante no encontrado</p>
      <p className="text-suave text-sm mt-1">Este QR no es válido o ya no existe.</p>
    </div>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div className="text-center py-12" role="alert" data-testid="public-error">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <span className="absolute inset-0 rounded-full border border-hoja/20 animate-breath" />
        <WifiOff size={28} strokeWidth={1.6} className="text-hoja absolute inset-0 m-auto" aria-hidden="true" />
      </div>
      <p className="text-tinta text-lg">No se pudo consultar</p>
      <p className="text-suave text-sm mt-1 mb-5">Revisa tu conexión y vuelve a intentarlo.</p>
      <button type="button" onClick={onRetry} className="btn btn--follaje">
        Reintentar
      </button>
    </div>
  )
}

export default function PublicView({ token }) {
  const { status, data, retry } = useSharedLookup(token)

  return (
    <div className="min-h-screen flex flex-col bg-lavada text-tinta">
      <Header />
      <main className="wrap py-10 flex-1" data-testid="public-view">
        <PublicHeader token={token} />

        <div className="card max-w-3xl mx-auto mb-6 py-10">
          {status === 'loading' && <LoadingState />}
          {status === 'notfound' && <NotFoundState />}
          {status === 'error' && <ErrorState onRetry={retry} />}
          {status === 'ok' && data && (
            <>
              <PointsCore points={data.points} email={data.email} />
              <div className="mt-6 text-center">
                <a href="/" className="btn btn--follaje" data-testid="public-open-app">
                  Abrir ReciclaPoint
                </a>
              </div>
            </>
          )}
        </div>

        {status === 'ok' && data && (
          <div className="max-w-3xl mx-auto">
            <HistoryList history={data.history} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}