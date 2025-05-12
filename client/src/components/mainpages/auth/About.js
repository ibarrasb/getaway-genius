import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GlobalState } from '../../../GlobalState';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Button, Grid } from '@mui/material'; // Import Grid for layout
import './login.css';

function About() {
    const state = useContext(GlobalState);
    const [isLogged] = state.UserAPI.isLogged;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false); // Set loading to false once isLogged is initialized
    }, [isLogged]);

  
    return (
        <div>
        <div className="back-button-container">
        <Link to="/my-trip"><Button variant="text" className="back-button" startIcon={<ArrowBackIcon />}>Back</Button></Link>
    </div>
        <div className="about-page">
        <h2>About</h2>
        <h4 className='about-text'>Welcome to Getaway Genius, your go-to travel companion for planning budget-friendly getaways. Our app is designed to help you track and compare the total costs of your trips, ensuring that you get the most value for your money. Whether it's airfare, accommodations, car rentals, or other expenses, Getaway Genius helps you account for every cost so you can make an informed decision about when and where to travel. Simply input your travel details—like the dates, flight options, lodging, and more—and our app will organize and compare your choices based on price. This allows you to easily see price differences between trips/locations/dates, so you can decide the most cost-effective time to embark on your adventure. With Getaway Genius, you'll always know which trip works best for your budget. Ready to explore smarter? Start planning with us today!
        </h4>
    </div>
        </div>
    );
}

export default About;
