import { useContext } from "react"  
import { Navigate, Outlet } from "react-router-dom"  
import { GlobalState } from "@/context/GlobalState.jsx"  
  
const PrivateRoute = () => {  
  const state = useContext(GlobalState)  
  const api = state?.userAPI ?? state?.UserAPI  
  const [isLogged] = api?.isLogged ?? [false]  
  const [token] = state?.token ?? [null]  
  const [globalLoading] = state?.loading ?? [false] // Use GlobalState loading  
    
  const isInitializing = !token && !isLogged && globalLoading  
    
  if (isInitializing) {  
    return <div className="flex min-h-screen items-center justify-center px-4">  
      <div className="gg-glass rounded-2xl border border-white/70 px-6 py-4 text-center">  
        <div className="mx-auto mb-2 h-7 w-7 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-700">Preparing your getaway workspace...</p>
      </div>  
    </div>  
  }  
    
  const isAuthed = Boolean(token) || isLogged  
  return isAuthed ? <Outlet /> : <Navigate to="/not-logged-in" replace />  
}  
  
export default PrivateRoute
