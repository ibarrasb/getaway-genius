// src/context/GlobalState.jsx
import axios from 'axios'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import useUserAPI from '../api/UserAPI'

export const GlobalState = createContext(null)

export const DataProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshToken = useCallback(async () => {  
    try {  
      console.log('🔄 Refresh token starting...')  
      setError(null)  
      const res = await axios.get('/api/user/refresh_token', { withCredentials: true })  
      const t = res.data?.accesstoken ?? null  
      console.log('✅ Refresh token success:', !!t)  
      setToken(t)  
    } catch (err) {  
      console.error('❌ Refresh token failed:', err)  
      setError(err.response?.data ?? 'Failed to refresh token')  
      setToken(null)  
    } finally {  
      setLoading(false)  
    }  
  }, [])

  useEffect(() => {  
    console.log('🚀 GlobalState useEffect running')  
    refreshToken()  
}, [])

  const userAPI = useUserAPI(token)

  const value = useMemo(
    () => ({ token: [token, setToken], loading: [loading, setLoading], error: [error, setError], userAPI, refreshToken }),
    [token, loading, error, userAPI, refreshToken]
  )

  return <GlobalState.Provider value={value}>{children}</GlobalState.Provider>
}
