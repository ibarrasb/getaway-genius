import React, { useContext } from 'react';
import { GlobalState } from '../../GlobalState';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './header.css';

function Header() {
  const state = useContext(GlobalState);
  const [isLogged, setIsLogged] = state.UserAPI.isLogged;
  const [name] = state.UserAPI.name;

  const location = useLocation();

  const logoutUser = async () => {
    setIsLogged(false);
    await axios.get('/api/user/logout');
    localStorage.clear();
    window.location.href = '/';
  };

  const loggedRouter = () => {
    return (
      <div className="container">
      <div className="dv1">
      <span className="getaway">Getaway</span> <span className="genius">Genius</span>
  </div>
  
        <div className="welcome">Hi, {name}</div>
        <div className="dv2">
        <Link to="/search" className="create-button">+</Link>
          <Link to="/" className="log-out"onClick={logoutUser}>
            Logout
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div>
    <div>
    {!(location.pathname.startsWith('/search') || location.pathname.startsWith('/trips')) && isLogged ? loggedRouter() : ''}
  </div>
  
    </div>
  );
}

export default Header;
