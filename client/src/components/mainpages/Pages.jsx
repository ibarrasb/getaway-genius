import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Import Navigate
import Login from './auth/Login.jsx';
import Register from './auth/Register.jsx';
import Home from './home/Home.jsx';
import PreviousTrips from './home/PreviousTrips.jsx'
import Add from './add/Add.jsx';
import Search from './search/Search.jsx'
import Profile from './profile/Profile.jsx'
import DetailedTrip from './tripDetails/DetailedTrip.jsx'
import DetailedWishlist from './detailedWishlist/DetailedWishlist.jsx'
import NotFound from './utils/not_found/NotFound.jsx';
import FavoriteTrips from './home/FavoriteTrips.jsx'
import About from './auth/About.jsx'
import Discover from './discover/Discover.jsx'
import Landing from './landing/Landing.jsx'


function Pages() {
   
    return (
        <Routes>
            {/* Redirect to Home if the user is logged in */}
            <Route path='/' element={<Landing/>} />

            <Route path='/discover' element={<Discover/>} />
            <Route path='/about' element={<About/>} />
            <Route path="/home" element={<Home />} />
            <Route path="/previous-trips" element={<PreviousTrips/>} />
            <Route path='/add' element={<Add/>} />
            <Route path='/trips/:id' element={<DetailedTrip/>}/>
            <Route path='/profile/:id' element={<Profile/>}/>
            <Route path='/wishlist-detail/:id' element={<DetailedWishlist/>}/>
            <Route path='/search' element={<Search/>} />
            <Route path='/favorites' element={<FavoriteTrips/>} />
            <Route path='/login' element={<Login/>} />
            <Route path="/register" element={<Register />} />
            <Route path='*' element={<NotFound/>} />
        </Routes>
    );
}

export default Pages;