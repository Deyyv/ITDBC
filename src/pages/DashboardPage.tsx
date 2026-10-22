import BasketSimulator from '../components/dashboard/BasketSimulator'
import DashboardFooter from '../components/dashboard/DashboardFooter'
import DashboardTopBar from '../components/dashboard/DashboardTopBar'
import ImpactModule from '../components/dashboard/ImpactModule'
import TrendChart from '../components/dashboard/TrendChart'

export default function DashboardPage() {
  return (
    <div className="dash-page dash-scroll-x">
      <div className="dash-shell">
        <DashboardTopBar />
        <main className="dash-grid" aria-label="Panel de la cesta inteligente">
          <BasketSimulator />
          <ImpactModule />
          <TrendChart />
        </main>
        <DashboardFooter />
      </div>
    </div>
  )
}
