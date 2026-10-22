import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildSimulatorCoupon, type SimulatorCoupon } from '../lib/coupon'
import { calculateDiscount, clampWeight } from '../lib/discount'
import type { SimulatorPhase } from '../types/dashboard'

const SETTLE_MS = 700

export function useWeighingSimulator(initialWeight = 0) {
  const [weightKg, setWeightKg] = useState(() => clampWeight(initialWeight))
  const [stableWeightKg, setStableWeightKg] = useState(() => clampWeight(initialWeight))
  const [phase, setPhase] = useState<SimulatorPhase>(() =>
    clampWeight(initialWeight) > 0 ? 'weighing' : 'idle',
  )
  const [coupon, setCoupon] = useState<SimulatorCoupon | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    clearTimer()
    setCoupon(null)

    if (weightKg <= 0) {
      setStableWeightKg(0)
      setPhase('idle')
      return
    }

    setPhase('weighing')
    timerRef.current = setTimeout(() => {
      setStableWeightKg(weightKg)
      setPhase('calculated')
      timerRef.current = null
    }, SETTLE_MS)

    return clearTimer
  }, [clearTimer, weightKg])

  useEffect(() => clearTimer, [clearTimer])

  const setWeight = useCallback((nextWeight: number) => {
    setWeightKg(clampWeight(nextWeight))
  }, [])

  const simulateReading = useCallback(() => {
    const reading = 0.7 + Math.random() * 4.1
    setWeightKg(Math.round(reading * 100) / 100)
  }, [])

  const reset = useCallback(() => {
    setWeightKg(0)
  }, [])

  const discount = useMemo(
    () => calculateDiscount(phase === 'weighing' ? weightKg : stableWeightKg),
    [phase, stableWeightKg, weightKg],
  )

  const canGenerate = phase === 'calculated' && discount.pct > 0

  const generateCoupon = useCallback(() => {
    if (phase !== 'calculated') return null
    const result = calculateDiscount(stableWeightKg)
    if (result.pct <= 0) return null

    const nextCoupon = buildSimulatorCoupon(result.weightKg, result.pct)
    setCoupon(nextCoupon)
    setPhase('qr')
    return nextCoupon
  }, [phase, stableWeightKg])

  return {
    weightKg,
    stableWeightKg,
    phase,
    coupon,
    discount,
    canGenerate,
    setWeight,
    simulateReading,
    generateCoupon,
    reset,
  }
}
