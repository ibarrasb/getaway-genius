import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import { Link } from 'react-router-dom'; 
import './styles.css';

// Import the updated JSON data
import testData from './testData.json'; // Replace with the actual path to your JSON file

function Home() {
  const state = useContext(GlobalState);
  // const [name] = state.UserAPI.name;

  const [trips, setTrips] = useState([]);
  
  useEffect(() => {
    // Load the updated JSON data into the state
    setTrips(testData.trips);
  }, []);

  // Function to render a single trip box
  const renderTrip = (trip, index) => {
    const startDate = new Date(trip.trip_start);
    const endDate = new Date(trip.trip_end);
    
    const startMonthDay = `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getDate()}`;
    const endMonthDay = `${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getDate()}`;

    return (
      <div className="trip-box" key={index}>
        <img className="trip-image" src={trip.location_img} alt={trip.trip_location} />
        <div>
          <div className="trip-duration">
            {startMonthDay} - {endMonthDay}
          </div>
          <div className="trip-location">{trip.trip_location}</div>
          <button className="view-button">View</button>
        </div>
      </div>
    );
  };

  // Group trips by year
  const tripsByYear = trips.reduce((acc, trip) => {
    const startDate = new Date(trip.trip_start);
    const year = startDate.getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(trip);
    return acc;
  }, {});

  return (
    <div className="home-container">
  
      <div className="search-container">
        <div className="search-input-container">
        
          <Link to="/search" className="search-button">Create</Link>
        </div>
      </div>

      {Object.entries(tripsByYear).map(([year, yearTrips]) => (
        <div key={year}>
          <div  className="year-trip">
            <h2>{year}</h2>
            <div className="open-trips-container">
              {yearTrips.map((trip, index) => renderTrip(trip, index))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Home;
