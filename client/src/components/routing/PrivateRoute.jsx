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
    return <div className="flex items-center justify-center min-h-screen">  
      <div>Loading...</div>  
    </div>  
  }  
    
  const isAuthed = Boolean(token) || isLogged  
  return isAuthed ? <Outlet /> : <Navigate to="/not-logged-in" replace />  
}  
  
export default PrivateRoute