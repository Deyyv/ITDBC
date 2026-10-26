import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import { DB } from './services/db.js'
import { Points } from './services/points.js'
import { uploadUser } from './services/api.js'
import { MIN_DISCOUNT_LABEL, discountForMilligrams } from './lib/discount'
import { buildCoupon } from './services/coupons.js'
import { STORES } from './data/stores.js'

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const StoreContext = createContext(null)

const initialState = {
  currentEmail: '',
  registration: null,
  balance: null,
  lastCoupon: null,
  toast: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'REGISTERED':
      return { ...state, currentEmail: action.email, registration: action.registration }
    case 'LOOKED_UP':
      return { ...state, currentEmail: action.email, balance: action.balance }
    case 'COUPON_SET':
      return { ...state, lastCoupon: action.coupon, currentEmail: action.email }
    case 'CLEAR_COUPON':
      return { ...state, lastCoupon: null }
    case 'TOAST':
      return { ...state, toast: action.toast }
    case 'CLEAR_REGISTRATION':
      return { ...state, registration: null }
    case 'DISMISS_TOAST':
      return { ...state, toast: null }
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const registerRecycle = useCallback(({ email, weight, unit }) => {
    const clean = email.toLowerCase().trim()
    if (!email || !isValidEmail(email)) {
      dispatch({ type: 'TOAST', toast: { message: 'Ingresa un correo electrónico válido', type: 'error' } })
      return
    }
    if (!weight || parseFloat(weight) <= 0) {
      dispatch({ type: 'TOAST', toast: { message: 'Ingresa un peso válido mayor a 0', type: 'error' } })
      return
    }

    const mg = Points.toMilligrams(weight, unit)
    const sessionPoints = Points.calculate(weight, unit)

    if (sessionPoints === 0) {
      dispatch({ type: 'TOAST', toast: { message: 'El peso es muy bajo. Mínimo 500 mg para obtener 1 punto', type: 'error' } })
      return
    }

    DB.getOrCreateUser(clean)
    DB.addPoints(clean, mg, weight, unit, sessionPoints)
    const updated = DB.getUser(clean)
    uploadUser(updated)

    dispatch({
      type: 'REGISTERED',
      email: clean,
      registration: {
        email: clean,
        weightLabel: Points.formatWeight(mg),
        sessionPoints,
        totalPoints: updated.points,
      },
    })
    dispatch({ type: 'TOAST', toast: { message: `+${sessionPoints} puntos registrados para ${clean}`, type: 'success' } })
  }, [])

  const lookupBalance = useCallback((rawEmail) => {
    const clean = rawEmail.toLowerCase().trim()
    if (!clean) {
      dispatch({ type: 'LOOKED_UP', email: '', balance: null })
      return
    }
    if (!isValidEmail(clean)) {
      dispatch({ type: 'TOAST', toast: { message: 'Ingresa un correo válido para buscar', type: 'error' } })
      return
    }

    const user = DB.getUser(clean)
    dispatch({
      type: 'LOOKED_UP',
      email: clean,
      balance: user ? { found: true, ...user } : { found: false },
    })
  }, [])

  const generateCoupon = useCallback((storeId) => {
    const { currentEmail } = state
    if (!currentEmail) {
      dispatch({ type: 'TOAST', toast: { message: 'Primero busca tu correo en "Mi Saldo" o registra un reciclaje', type: 'error' } })
      return { ok: false, reason: 'no-user' }
    }

    const user = DB.getUser(currentEmail)
    if (!user) {
      dispatch({ type: 'TOAST', toast: { message: 'Usuario no encontrado', type: 'error' } })
      return { ok: false, reason: 'no-account' }
    }

    if (!user.lastDelivery || !user.lastDelivery.mg) {
      dispatch({ type: 'TOAST', toast: { message: 'Primero registra una entrega de reciclaje', type: 'error' } })
      return { ok: false, reason: 'no-weight' }
    }

    const store = STORES.find((s) => s.id === storeId)
    if (!store) return { ok: false, reason: 'bad-store' }

    const discount = discountForMilligrams(user.lastDelivery.mg)
    if (!discount.pct) {
      dispatch({ type: 'TOAST', toast: { message: `El peso mínimo para un descuento es ${MIN_DISCOUNT_LABEL}`, type: 'error' } })
      return { ok: false, reason: 'low-weight' }
    }

    const coupon = buildCoupon({
      store,
      email: currentEmail,
      weightMg: user.lastDelivery.mg,
      weightLabel: user.lastDelivery.label || Points.formatWeight(user.lastDelivery.mg),
      pct: discount.pct,
    })

    DB.addCoupon(currentEmail, coupon)
    const updated = DB.getUser(currentEmail)
    uploadUser(updated)

    dispatch({ type: 'COUPON_SET', email: currentEmail, coupon })
    dispatch({ type: 'TOAST', toast: { message: `Cupón de ${discount.pct}% generado en ${store.name}`, type: 'success' } })
    return { ok: true, coupon }
  }, [state.currentEmail])

  const showToast = useCallback((message, type = 'success') => {
    dispatch({ type: 'TOAST', toast: { message, type } })
  }, [])

  const dismissToast = useCallback(() => {
    dispatch({ type: 'DISMISS_TOAST' })
  }, [])

  const clearRegistration = useCallback(() => {
    dispatch({ type: 'CLEAR_REGISTRATION' })
  }, [])

  const clearCoupon = useCallback(() => {
    dispatch({ type: 'CLEAR_COUPON' })
  }, [])

  const value = useMemo(
    () => ({ state, registerRecycle, lookupBalance, generateCoupon, showToast, dismissToast, clearRegistration, clearCoupon }),
    [state, registerRecycle, lookupBalance, generateCoupon, showToast, dismissToast, clearRegistration, clearCoupon],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}