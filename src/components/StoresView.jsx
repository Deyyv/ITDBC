import { useEffect, useState } from 'react'
import { Store, Scale, Inbox, QrCode, Percent } from 'lucide-react'
import { STORES } from '../data/stores.js'
import { DISCOUNT_TIERS, getDiscountForMg, MIN_WEIGHT_LABEL } from '../services/discounts.js'
import { DB } from '../services/db.js'
import { useStore } from '../store.jsx'
import CouponCard from './CouponCard.jsx'

function ScaleTable() {
  return (
    <div className="card">
      <h3 className="font-disp font-medium text-tinta mb-4 inline-flex items-center gap-2">
        <Percent size={18} className="text-cascara" aria-hidden="true" />
        Descuento según peso reciclado
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DISCOUNT_TIERS.map((t) => (
          <div key={t.pct} className="rounded-2xl border border-follaje/10 bg-lavada/70 px-3 py-4 text-center">
            <div className="font-disp font-semibold text-[1.6rem] text-cascara leading-none">{t.pct}%</div>
            <div className="text-xs text-suave mt-1">{t.label}</div>
          </div>
        ))}
      </div>
      <p className="text-suave text-xs mt-4">
        El porcentaje se calcula con el peso de tu última entrega registrada. Mínimo {MIN_WEIGHT_LABEL} para participar.
      </p>
    </div>
  )
}

function NoUserState() {
  return (
    <div className="card text-center py-10">
      <span className="icon-circle mx-auto">
        <Store size={26} aria-hidden="true" />
      </span>
      <p className="text-tinta text-lg font-semibold mt-4">Aún no hay una cuenta seleccionada</p>
      <p className="text-suave text-sm mt-1 mb-6">
        Para generar tu cupón QR necesitas una entrega registrada con tu correo.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a href="#registrar" className="btn btn--follaje">Registrar una entrega</a>
        <a href="#saldo" className="btn btn--pea">Consultar mi saldo</a>
      </div>
    </div>
  )
}

function NoDeliveryState() {
  return (
    <div className="card text-center py-8 border-cascara/40">
      <p className="text-tinta font-semibold">
        Tu cuenta está lista, pero aún no tienes una entrega registrada.
      </p>
      <p className="text-suave text-sm mt-1 mb-5">
        Registra material reciclado para desbloquear tu descuento.
      </p>
      <a href="#registrar" className="btn btn--follaje">Registrar reciclaje</a>
    </div>
  )
}

function NoWeightState({ weightLabel }) {
  return (
    <div className="card text-center py-8 border-cascara/40">
      <p className="text-tinta font-semibold">
        Tu última entrega es de <strong>{weightLabel}</strong>, aún no llega a {MIN_WEIGHT_LABEL}.
      </p>
      <p className="text-suave text-sm mt-1 mb-5">Registra más material reciclado para desbloquear tu descuento.</p>
      <a href="#registrar" className="btn btn--follaje">Registrar más reciclaje</a>
    </div>
  )
}

function UserBanner({ user }) {
  if (!user || !user.lastDelivery) return null
  const discount = getDiscountForMg(user.lastDelivery.mg)
  return (
    <div className="card flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="icon-circle">
          <Scale size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="text-suave text-xs">Última entrega de <strong className="text-tinta">{user.email}</strong></p>
          <p className="font-semibold text-tinta">{user.lastDelivery.label}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-suave text-xs">Tu descuento disponible</p>
        <p className="font-disp font-semibold text-[2.6rem] text-follaje leading-none">{discount.pct}%</p>
      </div>
    </div>
  )
}

function CouponHistory({ coupons }) {
  if (!coupons || coupons.length === 0) return null
  return (
    <div className="card mt-6">
      <h3 className="font-disp font-medium text-tinta mb-3 inline-flex items-center gap-2">
        <Inbox size={18} className="text-cascara" aria-hidden="true" />
        Mis cupones generados
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {coupons.map((c) => (
          <div key={c.code} className="flex flex-wrap items-center justify-between gap-2 bg-lavada/70 border border-follaje/10 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-cascara font-disp font-semibold">{c.pct}%</span>
              <span className="font-semibold text-tinta">{c.storeName}</span>
              <span className="text-suave text-xs">{c.weightLabel}</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs text-suave">{c.code}</span>
              <span className="text-suave text-xs ml-2">vence {c.expiryLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StoresView() {
  const { state, generateCoupon, clearCoupon } = useStore()
  const [selectedStore, setSelectedStore] = useState(null)
  const [coupons, setCoupons] = useState([])

  const currentEmail = state.currentEmail
  const user = currentEmail ? DB.getUser(currentEmail) : null
  const lastDelivery = user ? user.lastDelivery : null
  const availableDiscount = lastDelivery ? getDiscountForMg(lastDelivery.mg) : null

  useEffect(() => {
    setCoupons(user && user.coupons ? user.coupons : [])
  }, [currentEmail, state.lastCoupon]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (store) => {
    setSelectedStore(store)
    generateCoupon(store.id)
  }

  return (
    <section id="tiendas" className="bg-lavada py-16 sm:py-24" data-testid="section-shop">
      <div className="wrap">
        <p className="kicker kiss">Tiendas aliadas</p>
        <h2 className="section-title">Genera tu cupón de descuento</h2>
        <p className="text-suave max-w-[52ch] mb-8">
          Elige una tienda aliada y genera tu QR de descuento a partir del peso que reciclaste.
        </p>

        {!currentEmail && <div className="mb-6"><NoUserState /></div>}
        {currentEmail && lastDelivery && availableDiscount && availableDiscount.pct > 0 && (
          <div className="mb-6"><UserBanner user={user} /></div>
        )}
        {currentEmail && !lastDelivery && <div className="mb-6"><NoDeliveryState /></div>}
        {currentEmail && lastDelivery && availableDiscount && availableDiscount.pct === 0 && (
          <div className="mb-6"><NoWeightState weightLabel={lastDelivery.label} /></div>
        )}

        <div className="mb-6"><ScaleTable /></div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STORES.map((store, idx) => {
            const Icon = store.Icon
            const active = selectedStore && selectedStore.id === store.id
            return (
              <article
                key={store.id}
                className={`card flex flex-col overflow-hidden p-0 transition-colors ${
                  active ? 'border-cascara' : 'hover:border-hoja/50'
                }`}
                data-testid={`store-${store.id}`}
              >
                <div className={`producto-visual ${store.bgSoft}`}>
                  <span className="flex w-20 h-20 items-center justify-center rounded-full bg-white shadow-suave">
                    <Icon size={36} strokeWidth={1.7} style={{ color: store.fg }} aria-hidden="true" />
                  </span>
                </div>
                <div className="p-6 flex flex-col gap-2 flex-1">
                  <p className="producto-tag">Tienda aliada 0{idx + 1}</p>
                  <h3 className="font-disp font-medium text-[1.55rem] tracking-tight text-tinta">{store.name}</h3>
                  <p className="text-suave text-sm font-semibold">{store.tagline}</p>
                  <p className="text-suave text-[0.95rem] flex-1">{store.desc}</p>
                  <button type="button" onClick={() => handleSelect(store)} className="btn btn--follaje full mt-4">
                    <QrCode size={16} aria-hidden="true" />
                    Generar cupón
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {state.lastCoupon && (
          <div className="mt-6 max-w-3xl">
            <CouponCard coupon={state.lastCoupon} onClose={clearCoupon} />
          </div>
        )}

        <CouponHistory coupons={coupons} />
      </div>
    </section>
  )
}