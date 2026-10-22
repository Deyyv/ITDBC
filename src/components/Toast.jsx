import { useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { useStore } from '../store.jsx'

export default function Toast() {
  const { state, dismissToast } = useStore()
  const toast = state.toast

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(dismissToast, 3200)
    return () => clearTimeout(timer)
  }, [toast, dismissToast])

  if (!toast) return null

  const success = toast.type === 'success'
  const Icon = success ? Check : X

  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-toast-in inline-flex items-center gap-3 rounded-full px-5 py-3 font-semibold text-sm shadow-fuerte max-w-[90vw] ${
        success ? 'bg-follaje text-blanco' : 'bg-alerta text-blanco'
      }`}
      style={{ position: 'fixed', left: '50%', bottom: '1.4rem', transform: 'translate(-50%, 0)', zIndex: 90 }}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-none ${
          success ? 'bg-blanco/20' : 'bg-blanco/20'
        }`}
        aria-hidden="true"
      >
        <Icon size={14} strokeWidth={3} />
      </span>
      <span>{toast.message}</span>
    </div>
  )
}