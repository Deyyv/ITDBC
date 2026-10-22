import BalanceView from './components/BalanceView.jsx'
import LegacyPage from './components/LegacyPage.jsx'
import PublicView from './components/PublicView.jsx'
import RegisterView from './components/RegisterView.jsx'
import StoresView from './components/StoresView.jsx'
import { useHash } from './hooks/useHash.js'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const [route] = useHash()

  if (route.type === 'share') {
    return <PublicView token={route.token} />
  }

  if (route.type === 'registrar') {
    return (
      <LegacyPage>
        <RegisterView />
      </LegacyPage>
    )
  }

  if (route.type === 'saldo') {
    return (
      <LegacyPage>
        <BalanceView />
      </LegacyPage>
    )
  }

  if (route.type === 'tienda') {
    return (
      <LegacyPage>
        <StoresView />
      </LegacyPage>
    )
  }

  return <DashboardPage />
}
