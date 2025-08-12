import { Routes, Route } from 'react-router-dom'
import Login from './auth/Login'
import Register from './auth/Register'
// import About from './auth/About'
import Home from './home/Home'
// import PreviousTrips from './home/PreviousTrips'
import FavoriteTrips from './favorites/FavoriteTrips'
// import Add from './add/Add'
// import Search from './search/Search'
// import Profile from './profile/Profile'
// import DetailedTrip from './tripDetails/DetailedTrip'
// import DetailedWishlist from './detailedWishlist/'
// import Discover from './discover/Discover'
import Landing from './landing/Landing'
// import NotFound from './utils/not_found/NotFound'

const MainPages = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
     <Route path="/explore" element={<FavoriteTrips />} />
      {/* <Route path="/discover" element={<Discover />} />
      <Route path="/about" element={<About />} />
          
      <Route path="/previous-trips" element={<PreviousTrips />} />
      <Route path="/add" element={<Add />} />
      <Route path="/trips/:id" element={<DetailedTrip />} />
      <Route path="/profile/:id" element={<Profile />} />
      <Route path="/wishlist-detail/:id" element={<DetailedWishlist />} />
      <Route path="/search" element={<Search />} />
   
  
   
      <Route path="*" element={<NotFound />} /> */}
    </Routes>
  )
}

export default MainPages
