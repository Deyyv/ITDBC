import DashboardFooter from '../components/dashboard/DashboardFooter'
import DashboardTopBar from '../components/dashboard/DashboardTopBar'
import ImpactSection from '../components/dashboard/ImpactSection'
import SpecSection from '../components/dashboard/SpecSection'
import StationSection from '../components/dashboard/StationSection'
import TelemetrySection from '../components/dashboard/TelemetrySection'
import { useBasketTwin } from '../hooks/useBasketTwin'

/**
 * One scrolling page. The simulation lives here so the station and the telemetry share a single
 * instance; the static sections are memoised and skip the 10 Hz re-render.
 */
export default function DashboardPage() {
  const twin = useBasketTwin()

  return (
    <div className="dash-page">
      <a href="#estacion" className="dash-skip">
        Saltar al contenido
      </a>
      <DashboardTopBar rssiDbm={twin.telemetry.rssiDbm} />
      <main aria-label="Panel de la cesta inteligente">
        <StationSection twin={twin} />
        <TelemetrySection telemetry={twin.telemetry} log={twin.log} lcd={twin.lcd} />
        <ImpactSection />
        <SpecSection />
      </main>
      <DashboardFooter />
    </div>
  )
}
