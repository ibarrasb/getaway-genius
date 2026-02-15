import { BrowserRouter as Router } from 'react-router-dom'
import { DataProvider } from './context/GlobalState'
import { ToastProvider } from './context/ToastContext.jsx'
import { ToastContainer } from './components/ui/Toast.jsx'
import Header from './layout/Header'
import Footer from './layout/Footer'
import MainPages from './pages/MainPages'

const App = () => {
  return (
    <DataProvider>
      <ToastProvider>
        <Router>
          <div className="gg-shell gg-grid-overlay min-h-screen flex flex-col justify-between text-[var(--gg-ink)]">
            <Header />
            <main className="flex-1">
              <MainPages />
            </main>
            <Footer />
            <ToastContainer />
          </div>
        </Router>
      </ToastProvider>
    </DataProvider>
  )
}

export default App
