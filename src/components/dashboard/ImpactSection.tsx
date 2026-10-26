import { memo } from 'react'
import ImpactModule from './ImpactModule'
import SectionHeading from './SectionHeading'
import TrendChart from './TrendChart'

/** Impact of the basket and the weekly trend, side by side on wide screens. */
function ImpactSection() {
  return (
    <section id="impacto" className="dash-section" aria-labelledby="impact-section-title">
      <div className="dash-container">
        <SectionHeading id="impact-section-title" title="Impacto">
          Lo que la estación aporta al barrio y a la comunidad educativa. Son cifras de demostración.
        </SectionHeading>

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <ImpactModule />
          <TrendChart />
        </div>
      </div>
    </section>
  )
}

export default memo(ImpactSection)
