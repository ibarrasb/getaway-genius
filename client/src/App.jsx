import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { DataProvider } from './context/GlobalState'
import { GlobalState } from './context/GlobalState.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'
import { ToastContainer } from './components/ui/Toast.jsx'
import Header from './layout/Header'
import MobileTabBar from './layout/MobileTabBar'
import Footer from './layout/Footer'
import MainPages from './pages/MainPages'
import ScrollToTop from './components/routing/ScrollToTop'

const AppContent = () => {
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [isLogged] = api?.isLogged ?? [false]
  const [token] = state?.token ?? [null]
  const location = useLocation()
  const publicRoutes = ["/", "/login", "/register", "/not-logged-in", "/about"]
  const hasMobileTabs = Boolean(token) && isLogged && !publicRoutes.includes(location.pathname)

  return (
    <>
      <ScrollToTop />
      <div className="gg-shell gg-grid-overlay min-h-screen flex flex-col justify-between text-[var(--gg-ink)]">
        <Header />
        <main className={`flex-1 ${hasMobileTabs ? "pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:pb-0" : ""}`}>
          <MainPages />
        </main>
        <Footer />
        <MobileTabBar />
        <ToastContainer />
      </div>
    </>
  )
}

const App = () => {
  return (
    <DataProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Router>
            <AppContent />
          </Router>
        </ConfirmProvider>
      </ToastProvider>
    </DataProvider>
  )
}

export default App
