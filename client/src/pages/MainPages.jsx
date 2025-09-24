import { Routes, Route } from "react-router-dom"
import { useContext } from "react"
import Login from "./auth/Login"
import Register from "./auth/Register"
import MyTrips from "./mytrips/MyTrips"
import About from "./about/About"
import ExplorePage from "./explore/ExplorePage"
import Search from "./search/Search"
import Landing from "./landing/Landing"
import PrivateRoute from "@/components/routing/PrivateRoute"
import NotLoggedIn from "./utils/NotLoggedIn"
import NotFound from "./utils/not_found/NotFound"
import Profile from "./profile/Profile"
import TripOverview from "./trips/TripOverview"
import TripInstanceDetail from "./trips/TripInstanceDetail"
import { GlobalState } from "@/context/GlobalState.jsx"

const MainPages = () => {
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [isLogged] = api?.isLogged ?? [false]
  const [token] = state?.token ?? [null]
  const isAuthed = Boolean(token) || isLogged

  return (
// unchanged structure
<Routes>
  {/* public */}
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/not-logged-in" element={<NotLoggedIn />} />
  <Route path="/about" element={<About/>} />

  {/* protected */}
  <Route element={<PrivateRoute />}>
    <Route path="/mytrips" element={<MyTrips />} />
    <Route path="/explore" element={<ExplorePage />} />
    <Route path="/profile/:id" element={<Profile/>} />
    <Route path="/search" element={<Search/>} />
    <Route path="/trips/:tripId" element={<TripOverview />} />
    <Route path="/trips/:tripId/instances/:instanceId" element={<TripInstanceDetail />} />
    {/* e.g. <Route path="/discover" element={<Discover />} /> */}
    {/* add other protected routes here */}
  </Route>

  {/* fallback */}
  <Route path="*" element={isAuthed ? <NotFound /> : <NotLoggedIn />} />
</Routes>

  )
}

export default MainPages

