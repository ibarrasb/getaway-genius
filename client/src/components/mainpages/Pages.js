import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Import Navigate
import Login from './auth/Login';
import Register from './auth/Register';
import Home from './home/Home.js';
import Add from './add/Add.js';
import Search from './search/Search'
import DetailedTrip from './tripDetails/DetailedTrip.js'
import NotFound from './utils/not_found/NotFound';
import { GlobalState } from '../../GlobalState'; // Make sure the import path is correct

function Pages() {
    const { UserAPI } = useContext(GlobalState);
    const { isLogged } = UserAPI;

    return (
        <Routes>
            {/* Redirect to Home if the user is logged in */}
            
            <Route path='/' element={<Login/>} />
            <Route path="/home" element={<Home />} />
            <Route path='/add' element={<Add/>} />
            <Route path='/trips/:id' element={<DetailedTrip/>}/>
            <Route path='/search' element={<Search/>} />
            <Route path="/register" element={<Register />} />
            <Route path='*' element={<NotFound/>} />
        </Routes>
    );
}

export default Pages;