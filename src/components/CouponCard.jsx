import { QRCodeCanvas } from 'qrcode.react'
import { Tag, X, CalendarDays } from 'lucide-react'

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center rounded-xl px-4 py-3 bg-lavada/70 border border-follaje/10">
      <span className="text-suave text-sm">{label}</span>
      <span className="font-semibold text-tinta text-sm">{value}</span>
    </div>
  )
}

export default function CouponCard({ coupon, onClose }) {
  const { storeName, pct, weightLabel, code, issuedLabel, expiryLabel, payload } = coupon

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-disp text-xl font-medium text-tinta inline-flex items-center gap-2">
          <Tag size={20} className="text-cascara" aria-hidden="true" />
          Cupón de descuento
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-suave hover:text-tinta p-2 rounded-lg hover:bg-lavada transition-colors"
          aria-label="Ocultar cupón"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <DetailRow label="Tienda aliada" value={storeName} />
          <DetailRow label="Descuento" value={`${pct}%`} />
          <DetailRow label="Material reciclado" value={weightLabel} />
          <DetailRow label="Código" value={code} />
          <DetailRow label="Emitido" value={issuedLabel} />
          <div className="flex justify-between items-center rounded-xl px-4 py-3 border border-cascara/40 bg-fibra/40">
            <span className="text-tinta text-sm font-semibold inline-flex items-center gap-1.5">
              <CalendarDays size={15} className="text-cascara" aria-hidden="true" />
              Válido hasta
            </span>
            <span className="font-disp font-semibold text-lg text-cascara">{expiryLabel}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="relative p-1.5 rounded-2xl bg-white border border-follaje/15 shadow-suave w-fit">
            <div className="p-4 bg-white rounded-xl">
              <QRCodeCanvas
                value={payload}
                size={200}
                fgColor="#152B1E"
                bgColor="#FFFFFF"
                level="M"
              />
            </div>
          </div>
          <p className="text-suave text-xs mt-3 text-center">
            Presenta este QR y el código en {storeName} para aplicar tu {pct}% de descuento.
          </p>
        </div>
      </div>
    </div>
  )
}