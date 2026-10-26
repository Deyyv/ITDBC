import Footer from './Footer.jsx'
import Header from './Header.jsx'
import Toast from './Toast.jsx'

/** Shell of the registration, balance and shop routes: same header and footer as the dashboard. */
export default function LegacyPage({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-dash-cement text-dash-ink">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toast />
    </div>
  )
}
