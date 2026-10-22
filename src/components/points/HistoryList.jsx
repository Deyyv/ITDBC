import { Points } from '../../services/points.js'

export default function HistoryList({ history }) {
  if (!history || history.length === 0) return null
  return (
    <div className="card mt-5">
      <h4 className="font-disp font-medium text-tinta/80 mb-3">Historial de entregas</h4>
      <div className="space-y-2 max-h-64 overflow-y-auto" data-testid="balance-history">
        {history.map((h, i) => (
          <div key={i} className="flex items-center justify-between bg-lavada/70 border border-follaje/10 rounded-xl px-4 py-3">
            <div>
              <span className="font-semibold text-tinta">{Points.formatWeight(h.weight_mg)}</span>
              <span className="text-suave text-xs ml-2">{new Date(h.date).toLocaleDateString('es-CO')}</span>
            </div>
            <span className="text-hoja font-bold">+{h.points_earned} pts</span>
          </div>
        ))}
      </div>
    </div>
  )
}