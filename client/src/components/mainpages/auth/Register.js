import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Register() {
    const [user, setUser] = useState({
        name: '',
        email: '',
        password: '',
        consoles: [] // Initialize consoles as an empty array
    });

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setUser({ ...user, [name]: value });
    };

    const handleConsoleChange = (e) => {
        const { value } = e.target;
        if (user.consoles.includes(value)) {
            // If the console is already selected, remove it
            setUser({ ...user, consoles: user.consoles.filter((console) => console !== value) });
        } else {
            // If the console is not selected, add it
            setUser({ ...user, consoles: [...user.consoles, value] });
        }
    };

    const registerSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/user/register', { ...user });

            localStorage.setItem('firstLogin', true);
            window.location.href = '/';
        } catch (err) {
            alert(err.response.data.msg);
        }
    }

    return (
        <div className="login-page">
            <form onSubmit={registerSubmit}>
            <h1 className='main-title'>Gameshare</h1>
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

                {/* Checkboxes for selecting consoles */}
                <div className='check-box'>
                    <label className='check-name'>
                        <input
                        className='check-name'
                            type="checkbox"
                            name="consoles"
                            value="Xbox"
                            checked={user.consoles.includes('Xbox')}
                            onChange={handleConsoleChange}
                        />
                        Xbox
                    </label>

                    <label className='check-name'>
                        <input
                        
                            type="checkbox"
                            name="consoles"
                            value="PlayStation"
                            checked={user.consoles.includes('PlayStation')}
                            onChange={handleConsoleChange}
                        />
                        PlayStation
                    </label>

                    <label className='check-name'>
                        <input
                        
                            type="checkbox"
                            name="consoles"
                            value="PlayStation"
                            checked={user.consoles.includes('Nintendo')}
                            onChange={handleConsoleChange}
                        />
                        Nintendo
                    </label>

                    {/* Add checkboxes for other console options here */}
                </div>

                <div className="row">
                    <button type="submit">Register</button>
                    <Link to="/">Login</Link>
                </div>
            </form>
        </div>
    );
}

export default Register;
