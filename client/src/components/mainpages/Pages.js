import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Import Navigate
import Login from './auth/Login';
import Register from './auth/Register';
import Home from './home/Home.js';
import PreviousTrips from './home/PreviousTrips.js'
import Add from './add/Add.js';
import Search from './search/Search'
import DetailedTrip from './tripDetails/DetailedTrip.js'
import NotFound from './utils/not_found/NotFound';

function Pages() {
   
    return (
        <Routes>
            {/* Redirect to Home if the user is logged in */}
            
            <Route path='/' element={<Login/>} />
            <Route path="/home" element={<Home />} />
            <Route path="/previous-trips" element={<PreviousTrips/>} />
            <Route path='/add' element={<Add/>} />
            <Route path='/trips/:id' element={<DetailedTrip/>}/>
            <Route path='/search' element={<Search/>} />
            <Route path="/register" element={<Register />} />
            <Route path='*' element={<NotFound/>} />
        </Routes>
    );
}

export default Pages;