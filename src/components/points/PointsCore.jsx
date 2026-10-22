import { useCountUp } from '../../hooks/useCountUp.js'

export default function PointsCore({ points, email }) {
  const animated = useCountUp(points)
  return (
    <div className="flex flex-col items-center">
      <p className="text-suave text-sm mb-1">Puntos acumulados de</p>
      <p className="font-semibold text-tinta/80 text-sm mb-5" data-testid="points-email">{email}</p>

      <div className="relative w-56 h-56" data-testid="balance-state-found">
        <span className="absolute inset-0 rounded-full border border-hoja/15 animate-breath" />
        <span className="absolute inset-4 rounded-full border border-hoja/20 animate-breath [animation-delay:0.3s]" />
        <span className="absolute inset-8 rounded-full border border-hoja/30 animate-breath [animation-delay:0.6s]" />
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(71,114,79,0.14), transparent 62%)', filter: 'blur(10px)' }}
        />

        <div className="relative h-full flex flex-col items-center justify-center">
          <span className="font-disp font-semibold text-[3.6rem] text-follaje leading-none" data-testid="balance-points-total">
            {animated}
          </span>
          <span className="text-suave text-xs mt-1">puntos disponibles</span>
        </div>
      </div>
    </div>
  )
}