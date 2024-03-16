import React, {useState, useContext, useEffect} from 'react'
import {Link} from 'react-router-dom'
import { GlobalState } from '../../../GlobalState'
import axios from 'axios'
import './login.css'

function Register() {
    const state = useContext(GlobalState)
    const [isLogged] = state.UserAPI.isLogged
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({
        name: '',
        email: '',
        password: ''// Initialize consoles as an empty array
    });

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setUser({ ...user, [name]: value });
    };

    const registerSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/user/register', { ...user });

            localStorage.setItem('firstLogin', true);
            window.location.href = '/home';
        } catch (err) {
            alert(err.response.data.msg);
        }
    }

    useEffect(() => {
        setLoading(false); // Set loading to false once isLogged is initialized
    }, [isLogged]);

    function checkIsLogged() {
        if (loading) {
            return <h1>Loading...</h1>; // Show loading indicator until isLogged is initialized
        }
        
        if (isLogged) {
            window.location.href = "/home";
        } else {
            return (
                <div className="login-page">
                <form onSubmit={registerSubmit}>
                <h1 className='main-title'>Getaway Genius</h1>
                    <h2>Register</h2>
                    <input
                        type="text"
                        name="name"
                        required
                        placeholder="Name"
                        value={user.name}
                        onChange={onChangeInput}
                    />
    
                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="Email"
                        value={user.email}
                        onChange={onChangeInput}
                    />
    
                    <input
                        type="password"
                        name="password"
                        required
                        autoComplete="on"
                        placeholder="Password"
                        value={user.password}
                        onChange={onChangeInput}
                    />
                    <div className="row">
                        <button type="submit">Register</button>
                        <Link to="/">Login</Link>
                    </div>
                </form>
            </div>
            );
        }
    }

    return (
        <div>
        {
            checkIsLogged()
        }
       
        </div>
    );
}

export default Register;
