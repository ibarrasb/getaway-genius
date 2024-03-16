import React, {useState, useContext, useEffect} from 'react'
import {Link} from 'react-router-dom'
import { GlobalState } from '../../../GlobalState'
import axios from 'axios'
import './login.css'

function Login() {
    const state = useContext(GlobalState)
    const [isLogged] = state.UserAPI.isLogged
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({
        email:'', password: ''
    })

    const onChangeInput = e =>{
        const {name, value} = e.target;
        setUser({...user, [name]:value})
    }

    const loginSubmit = async e =>{
        e.preventDefault()
        try {
            await axios.post('/api/user/login', {...user})

            localStorage.setItem('firstLogin', true)
            
            window.location.href = "/home";
        } catch (err) {
            alert(err.response.data.msg)
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
                    <form onSubmit={loginSubmit}>
                        <h1 className='main-title'>Getaway Genius</h1>
                        <h2>Login</h2>
                        <input type="email" name="email" required placeholder="Email" value={user.email} onChange={onChangeInput} />
                        <input type="password" name="password" required autoComplete="on" placeholder="Password" value={user.password} onChange={onChangeInput} />
                        <div className="row">
                            <button type="submit">Login</button>
                            <Link to="/register">Register</Link>
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
    )
}

export default Login