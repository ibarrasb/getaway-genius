import React from "react";
import { Button } from "@mui/material";
import { Link } from 'react-router-dom';
import "./landing.css";

const Landing = () => {
  return (
    <div className="landing-container">
    
    <div>
    <span className="getaway-start">Getaway</span>
    <span className="genius-start">Genius</span>
    </div>
      {/* Hero Section */}
      <section className="hero-section">
  
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Plan Smarter, Travel Further.</h1>
          <p className="hero-subtitle">
            Find, plan, and save your perfect trip—affordable adventures await!
          </p>
          <div className="cta-buttons">
          <Link to="/login">
          <Button variant="contained" color="primary">Get Started</Button>
          </Link>
    
        </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step-card">
            <h3>1️⃣ Discover</h3>
            <p>Filter trips by location, date, and budget.</p>
          </div>
          <div className="step-card">
            <h3>2️⃣ Plan & Save</h3>
            <p>Favorite destinations, set budgets, and get weather insights.</p>
          </div>
          <div className="step-card">
            <h3>3️⃣ Go & Enjoy</h3>
            <p>Seamless trip organization with wishlist & details.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <h2>Ready for Your Next Getaway?</h2>
        <Link to="/login">
        <Button variant="contained" className="cta-button">
          Start Planning
        </Button>
        </Link>
        
      </section>
    </div>
  );
};

export default Landing;

