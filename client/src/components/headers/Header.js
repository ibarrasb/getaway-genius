import React, {useContext} from 'react';
import {GlobalState} from '../../GlobalState'
import {Link} from 'react-router-dom'
import axios from 'axios';
import './header.css'

function Header() {
    const state = useContext(GlobalState)
    const [isLogged] = state.UserAPI.isLogged

    const logoutUser = async () => {
        await axios.get('/api/user/logout')
        localStorage.clear()
        window.location.href = "/"
    }

    const loggedRouter = () => {
        return(
            <div className="container">
            <div className="dv1">Gameshare</div>
            <div className="dv2"><Link to="/" onClick={logoutUser}>Logout</Link></div>
            </div>
        )
    }

    return (
    <div>
             
            {
                isLogged ? loggedRouter() : ''
            } 

       
    </div>
    );
}

export default Header;