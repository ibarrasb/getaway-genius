import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './auth/Login';
import Register from './auth/Register';
import Home from './home/Home.js';
import Search from './search/Search'
import NotFound from './utils/not_found/NotFound';
import { GlobalState } from '../../GlobalState'; // Make sure the import path is correct


function Pages() {
    const { UserAPI } = useContext(GlobalState);
    const { isLogged } = UserAPI;

    return (
       
        <Routes>
            <Route path='/home' element={<Home/>} />
            <Route path='/search' element={<Search/>} />
            <Route path='/' element={<Login/>} />
            <Route path="/register" element={<Register />} />

            <Route path='*' element={<NotFound/>} />
        </Routes>
       
    );
}

export default Pages;
