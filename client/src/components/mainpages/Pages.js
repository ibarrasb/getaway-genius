import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './auth/Login';
import Register from './auth/Register';
import Home from './home/Home.js';
import NotFound from './utils/not_found/NotFound';
import { GlobalState } from '../../GlobalState'; // Make sure the import path is correct


function Pages() {
    const { UserAPI } = useContext(GlobalState);
    const { isLogged } = UserAPI;

    return (
       
        <Routes>
     
            <Route path='/' element={isLogged ? <Home/> : <Login/>} />
            <Route path="/register" element={isLogged ? <NotFound /> : <Register />} />

            <Route path='*' element={<NotFound/>} />
        </Routes>
       
    );
}

export default Pages;
