import { BrowserRouter as Router } from 'react-router-dom'
import { DataProvider } from './context/GlobalState'
import Header from './layout/Header'
import Footer from './layout/Footer'
import MainPages from './pages/MainPages'

const App = () => {
  return (
    <DataProvider>
      <Router>
        <div className="min-h-screen flex flex-col justify-between bg-background text-foreground">
          <Header />
          <main className="flex-1">
            <MainPages />
          </main>
          <Footer />
        </div>
      </Router>
    </DataProvider>
  )
}

export default App
