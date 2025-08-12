import { createContext, useEffect, useState } from 'react'
import axios from 'axios'
import UserAPI from '../api/UserAPI'

export const GlobalState = createContext(null)

export const DataProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const firstLogin = localStorage.getItem('firstLogin')
    if (firstLogin) {
      axios
        .get('/api/user/refresh_token')
        .then((res) => setToken(res.data.accesstoken))
        .catch((err) => {
          console.error('Token refresh failed:', err)
          if (err.response) {
            console.error('Response:', err.response.data)
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const state = {
    token: [token, setToken],
    loading,
    userAPI: UserAPI(token),
  }

  return (
    <GlobalState.Provider value={state}>
      {children}
    </GlobalState.Provider>
  )
}
