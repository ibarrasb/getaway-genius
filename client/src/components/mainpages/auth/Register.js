import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GlobalState } from '../../../GlobalState';
import axios from 'axios';
import './login.css';

function Register() {
    const state = useContext(GlobalState);
    const [isLogged] = state.UserAPI.isLogged;
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({
        fname: '',
        lname: '',
        email: '',
        password: '',
        birthday: '',
        city: '',
        state: '',  
        zip: '',    // New field for zip code
    });

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        // Allow only numbers for zip code and ensure it's 5 digits long
        if (name === "zip") {
            if (/^\d{0,5}$/.test(value)) {
                setUser({ ...user, [name]: value });
            }
        } else {
            setUser({ ...user, [name]: value });
        }
    };

    const registerSubmit = async (e) => {
        e.preventDefault();
        try {
            // Check if the zip code is exactly 5 digits before submission
            if (user.zip.length !== 5) {
                alert("Zip code must be exactly 5 digits.");
                return;
            }
            
            await axios.post('/api/user/register', { ...user });

            localStorage.setItem('firstLogin', true);
            window.location.href = '/home';
        } catch (err) {
            alert(err.response.data.msg);
        }
    };

    useEffect(() => {
        setLoading(false); 
    }, [isLogged]);

    function checkIsLogged() {
        if (loading) {
            return <h1>Loading...</h1>;
        }

        if (isLogged) {
            window.location.href = "/home";
        } else {
            return (
                <div className="login-page">
                    <form onSubmit={registerSubmit}>
                        <div className='main-title'>
                            <span className="getaway">Getaway</span> <span className="genius">Genius</span>
                        </div>
                        <h2>Register</h2>
                        <input
                            type="text"
                            name="fname"
                            required
                            placeholder="First Name"
                            value={user.fname}
                            onChange={onChangeInput}
                        />
                        <input
                        type="text"
                        name="lname"
                        required
                        placeholder="Last Name"
                        value={user.lname}
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
                       
                        <label htmlFor="birthday">Date of Birth</label>
                            <input
                            type="date"
                            id="birthday"
                            name="birthday"
                            required
                            placeholder="birthday" // Example format
                            value={user.birthday}
                            onChange={onChangeInput}
                            />


                        <input
                            type="text"
                            name="city"
                            required
                            placeholder="City"
                            value={user.city}
                            onChange={onChangeInput}
                        />

                        <select
                            name="state"
                            required
                            value={user.state}
                            onChange={onChangeInput}
                        >
                            <option value="">Select State</option>
                            <option value="AL">Alabama (AL)</option>
                            <option value="AK">Alaska (AK)</option>
                            <option value="AZ">Arizona (AZ)</option>
                            <option value="AR">Arkansas (AR)</option>
                            <option value="CA">California (CA)</option>
                            <option value="CO">Colorado (CO)</option>
                            <option value="CT">Connecticut (CT)</option>
                            <option value="DE">Delaware (DE)</option>
                            <option value="FL">Florida (FL)</option>
                            <option value="GA">Georgia (GA)</option>
                            <option value="HI">Hawaii (HI)</option>
                            <option value="ID">Idaho (ID)</option>
                            <option value="IL">Illinois (IL)</option>
                            <option value="IN">Indiana (IN)</option>
                            <option value="IA">Iowa (IA)</option>
                            <option value="KS">Kansas (KS)</option>
                            <option value="KY">Kentucky (KY)</option>
                            <option value="LA">Louisiana (LA)</option>
                            <option value="ME">Maine (ME)</option>
                            <option value="MD">Maryland (MD)</option>
                            <option value="MA">Massachusetts (MA)</option>
                            <option value="MI">Michigan (MI)</option>
                            <option value="MN">Minnesota (MN)</option>
                            <option value="MS">Mississippi (MS)</option>
                            <option value="MO">Missouri (MO)</option>
                            <option value="MT">Montana (MT)</option>
                            <option value="NE">Nebraska (NE)</option>
                            <option value="NV">Nevada (NV)</option>
                            <option value="NH">New Hampshire (NH)</option>
                            <option value="NJ">New Jersey (NJ)</option>
                            <option value="NM">New Mexico (NM)</option>
                            <option value="NY">New York (NY)</option>
                            <option value="NC">North Carolina (NC)</option>
                            <option value="ND">North Dakota (ND)</option>
                            <option value="OH">Ohio (OH)</option>
                            <option value="OK">Oklahoma (OK)</option>
                            <option value="OR">Oregon (OR)</option>
                            <option value="PA">Pennsylvania (PA)</option>
                            <option value="RI">Rhode Island (RI)</option>
                            <option value="SC">South Carolina (SC)</option>
                            <option value="SD">South Dakota (SD)</option>
                            <option value="TN">Tennessee (TN)</option>
                            <option value="TX">Texas (TX)</option>
                            <option value="UT">Utah (UT)</option>
                            <option value="VT">Vermont (VT)</option>
                            <option value="VA">Virginia (VA)</option>
                            <option value="WA">Washington (WA)</option>
                            <option value="WV">West Virginia (WV)</option>
                            <option value="WI">Wisconsin (WI)</option>
                            <option value="WY">Wyoming (WY)</option>
                        </select>

                        {/* Zip code input field */}
                        <input
                            type="text"
                            name="zip"
                            required
                            placeholder="Zip Code"
                            value={user.zip}
                            onChange={onChangeInput}
                        />

                        <div className="row">
                            <button type="submit">Register</button>
                            <Link to="/login">Login</Link>
                        </div>
                    </form>
                </div>
            );
        }
    }

    return (
        <div>
            {checkIsLogged()}
        </div>
    );
}

export default Register;
