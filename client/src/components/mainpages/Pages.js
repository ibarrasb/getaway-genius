import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Import Navigate
import Login from './auth/Login';
import Register from './auth/Register';
import MyTrips from './home/MyTrips.js';
import PreviousTrips from './home/PreviousTrips.js'
import Add from './add/Add.js';
import Search from './search/Search'
import Profile from './profile/Profile.js'
import DetailedTrip from './tripDetails/DetailedTrip.js'
import DetailedWishlist from './detailedWishlist/DetailedWishlist.js'
import NotFound from './utils/not_found/NotFound';
import FavoriteTrips from './home/ExploreTrips.js'
import About from './auth/About.js'
import Discover from './discover/Discover.js'
import Landing from './landing/Landing.js'
import ViewAll from './home/ViewAll.js';


function Pages() {
   
    return (
        <Routes>
            {/* Redirect to Home if the user is logged in */}
            <Route path='/' element={<Landing/>} />

            <Route path='/discover' element={<Discover/>} />
            <Route path='/about' element={<About/>} />
            <Route path="/my-trip" element={<MyTrips />} />
            <Route path="/previous-trips" element={<PreviousTrips/>} />
            <Route path='/add' element={<Add/>} />
            <Route path='/trips/:id' element={<DetailedTrip/>}/>
            <Route path='/profile/:id' element={<Profile/>}/>
            <Route path='/wishlist-detail/:id' element={<DetailedWishlist/>}/>
            <Route path='/search' element={<Search/>} />
            <Route path='/view-all' element={<ViewAll/>} />
            <Route path='/explore' element={<FavoriteTrips/>} />
            <Route path='/login' element={<Login/>} />
            <Route path="/register" element={<Register />} />
            <Route path='*' element={<NotFound/>} />
        </Routes>
    );
}

export default Pages;