import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GlobalState } from '../../../GlobalState';
import { Button, Grid } from '@mui/material'; // Import Grid for layout
import './login.css';

function About() {
    const state = useContext(GlobalState);
    const [isLogged] = state.UserAPI.isLogged;
    const [loading, setLoading] = useState(true);

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
                    <div className="main-title">
                        <span className="getaway">Getaway</span> <span className="genius">Genius</span>
                    </div>
                    <h2>About</h2>
                    <h4>Welcome to Getaway Genius, your go-to travel companion for planning budget-friendly getaways. Our app is designed to help you track and compare the total costs of your trips, ensuring that you get the most value for your money. Whether it's airfare, accommodations, car rentals, or other expenses, Getaway Genius helps you account for every cost so you can make an informed decision about when and where to travel. Simply input your travel details—like the dates, flight options, lodging, and more—and our app will organize and compare your choices based on price. This allows you to easily see price differences between trips/locations/dates, so you can decide the most cost-effective time to embark on your adventure. With Getaway Genius, you'll always know which trip works best for your budget. Ready to explore smarter? Start planning with us today!
                    </h4>
                    <Grid container spacing={2} justifyContent="center"> {/* Grid container with spacing */}
                        <Grid item>
                            <Button
                                variant="contained"
                                color="primary"
                                component={Link}
                                to="/login"
                            >
                                Login
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="outlined"
                                color="secondary"
                                component={Link}
                                to="/register"
                            >
                                Register
                            </Button>
                        </Grid>
                    </Grid>
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

export default About;
