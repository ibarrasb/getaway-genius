import { useCallback, useContext } from 'react'
import axios from 'axios'
import { GlobalState } from '@/context/GlobalState.jsx'

export const useDataRefresh = () => {
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [email] = api?.email ?? [""]
  const [token] = state?.token ?? [null]

  const refetchTrips = useCallback(async () => {
    try {
      const headers = token ? { Authorization: token } : undefined
      const response = await axios.get('/api/trips/getaway-trip', { headers })
      return response.data
    } catch (error) {
      console.error('Error refetching trips:', error)
      throw error
    }
  }, [token])

  const refetchWishlists = useCallback(async () => {
    try {
      const headers = token ? { Authorization: token } : undefined
      const response = await axios.get('/api/wishlist/getlists', {
        params: { email },
        headers
      })
      return response.data
    } catch (error) {
      console.error('Error refetching wishlists:', error)
      throw error
    }
  }, [email, token])

  const refetchFavorites = useCallback(async () => {
    try {
      const headers = token ? { Authorization: token } : undefined
      const response = await axios.get('/api/trips/favorites', { headers })
      return response.data
    } catch (error) {
      console.error('Error refetching favorites:', error)
      throw error
    }
  }, [token])

  const refetchAll = useCallback(async () => {
    try {
      const [trips, wishlists, favorites] = await Promise.all([
        refetchTrips(),
        refetchWishlists(),
        refetchFavorites()
      ])
      return { trips, wishlists, favorites }
    } catch (error) {
      console.error('Error refetching all data:', error)
      throw error
    }
  }, [refetchTrips, refetchWishlists, refetchFavorites])

  return {
    refetchTrips,
    refetchWishlists,
    refetchFavorites,
    refetchAll
  }
}
