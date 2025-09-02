import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'

const useUserAPI = (token) => {
  const [isLogged, setIsLogged] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [fname, setFname] = useState('')
  const [email, setEmail] = useState('')
  const [userID, setUserID] = useState('')
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchUser = useCallback(async (signal) => {
    if (!token) return
    try {
      setLoading(true); setError(null)
      // IMPORTANT: your middleware expects raw token, not "Bearer ..."
      const res = await axios.get('/api/user/infor', {
        headers: { Authorization: token },
        signal,
      })
      const data = res.data ?? {}
      setUserData(data)
      setUserID(data._id ?? '')
      setFname((data.fname ?? '').split(' ')[0])
      setEmail(data.email ?? '')
      setIsLogged(true)
      setIsAdmin(data.role === 1)
    } catch (err) {
      if (err.name !== 'CanceledError') {
        console.error('User fetch failed:', err)
        setError(err.response?.data ?? 'Failed to load user')
        setIsLogged(false)
        setIsAdmin(false)
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setIsLogged(false); setIsAdmin(false)
      setUserData(null); setUserID(''); setFname(''); setEmail('')
      setLoading(false); setError(null)
      return
    }
    const ctrl = new AbortController()
    fetchUser(ctrl.signal)
    return () => ctrl.abort()
  }, [token, fetchUser])

  return { isLogged: [isLogged, setIsLogged], isAdmin: [isAdmin, setIsAdmin], fname: [fname, setFname], email: [email, setEmail], userID: [userID, setUserID], userData: [userData, setUserData], loading: [loading, setLoading], error: [error, setError], refresh: fetchUser }
}

export default useUserAPI
