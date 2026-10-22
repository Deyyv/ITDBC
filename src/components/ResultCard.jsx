import { QRCodeCanvas } from 'qrcode.react'
import { Sparkles, X } from 'lucide-react'
import { DB } from '../services/db.js'

function shareUrlFor(email) {
  const user = DB.getUser(email)
  if (!user || !user.shareToken) return null
  const base = import.meta.env.VITE_APP_URL || window.location.origin
  return `${base}/#share/${encodeURIComponent(user.shareToken)}`
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center rounded-xl px-4 py-3 bg-lavada/70 border border-follaje/10">
      <span className="text-suave text-sm">{label}</span>
      <span className="font-semibold text-tinta text-sm">{value}</span>
    </div>
  )
}

export default function ResultCard({ registration, onClose }) {
  const { email, weightLabel, sessionPoints, totalPoints } = registration

  const shareUrl = shareUrlFor(email)
  const qrValue = shareUrl || [
    'ReciclajeApp - Comprobante',
    `Correo: ${email}`,
    `Peso: ${weightLabel}`,
    `Puntos sesion: +${sessionPoints}`,
    `Puntos totales: ${totalPoints}`,
  ].join('\n')

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-disp text-xl font-medium text-tinta">Registro exitoso</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-suave hover:text-tinta p-2 rounded-lg hover:bg-lavada transition-colors"
          aria-label="Ocultar resultado"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <DetailRow label="Correo" value={email} />
          <DetailRow label="Peso registrado" value={weightLabel} />
          <div className="inline-flex items-center gap-2 rounded-full bg-fibra/40 border border-fibra px-4 py-2 text-cascara text-[0.82rem] font-semibold">
            <Sparkles size={15} className="shrink-0" aria-hidden="true" />
            Puntos de esta entrega: <strong>+{sessionPoints}</strong>
          </div>
          <div className="flex justify-between items-center rounded-xl px-4 py-3 border border-follaje/15 bg-follaje/[0.04]">
            <span className="text-tinta text-sm font-semibold">Puntos totales</span>
            <span className="font-disp font-semibold text-[1.6rem] text-follaje">{totalPoints}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="relative p-1.5 rounded-2xl bg-white border border-follaje/15 shadow-suave w-fit">
            <div className="p-4 bg-white rounded-xl">
              <QRCodeCanvas
                value={qrValue}
                size={200}
                fgColor="#152B1E"
                bgColor="#FFFFFF"
                level="M"
              />
            </div>
          </div>
          <p className="text-suave text-xs mt-3 text-center">
            {shareUrl ? 'Escanea para ver tus puntos en vivo' : 'Escanea para ver tu comprobante'}
          </p>
        </div>
      </div>

      {email && (
        <p className="text-suave text-xs mt-5 text-center">
          Ahora genera tu <strong className="text-follaje">cupón QR de descuento</strong> en la sección
          <strong className="text-follaje"> Tiendas aliadas</strong> según el peso que reciclaste.
        </p>
      )}
    </div>
  )
}