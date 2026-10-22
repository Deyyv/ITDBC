import { ArrowLeft } from 'lucide-react'
import BrandMark from './dashboard/BrandMark'
import Footer from './Footer.jsx'
import Toast from './Toast.jsx'

export default function LegacyPage({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-lavada text-tinta">
      <div className="border-b border-follaje/10 bg-blanco">
        <div className="wrap flex items-center justify-between gap-3 py-3">
          <a href="#/" className="inline-flex items-center gap-2.5" aria-label="ReciclaPoint, volver al panel">
            <BrandMark size={34} />
            <span className="font-disp text-[1.1rem] font-semibold tracking-tight text-tinta">ReciclaPoint</span>
          </a>
          <a href="#/" className="btn btn--pea text-sm" style={{ padding: '0.55rem 0.95rem' }}>
            <ArrowLeft size={15} aria-hidden="true" />
            Volver al panel
          </a>
        </div>
      </div>

      <main className="flex-1">{children}</main>
      <Footer />
      <Toast />
    </div>
  )
}
