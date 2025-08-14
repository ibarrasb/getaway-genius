import { useContext } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { GlobalState } from "@/context/GlobalState.jsx"

const PrivateRoute = () => {
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [isLogged] = api?.isLogged ?? [false]
  const [token] = state?.token ?? [null]

  const isAuthed = Boolean(token) || isLogged

  return isAuthed ? <Outlet /> : <Navigate to="/not-logged-in" replace />
}

export default PrivateRoute
