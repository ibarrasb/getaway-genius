import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { DataProvider } from './GlobalState'
import MainPages from './components/mainpages/Pages'
import Header from './components/headers/Header'
import Footer from './components/footer/Footer'

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="page-container">
          <Header />
          <div className="content-wrap">
            <MainPages />
          </div>
          <Footer />
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;
