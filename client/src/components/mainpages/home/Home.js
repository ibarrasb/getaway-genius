import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import { Link } from 'react-router-dom'; 
import './styles.css';

// Import the updated JSON data
import testData from './testData.json'; // Replace with the actual path to your JSON file

function Home() {
  const state = useContext(GlobalState);
  // const [name] = state.UserAPI.name;
   const [local] = state.TripsAPI.trip
   console.log("HERE" +local)

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    // Load the updated JSON data into the state
    setTrips(local);
    setLoading(false); // Update loading state after data is loaded
  }, [local]);

  // Function to render a single trip box
  const renderTrip = (vacation, index) => {
    const startDate = new Date(vacation.trip_start);
    const endDate = new Date(vacation.trip_end);
    
    const startMonthDay = `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getDate()}`;
    const endMonthDay = `${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getDate()}`;

    return (
      <div className="trip-box" key={index}>
        <img className="trip-image" src={vacation.image_url} alt={vacation.trip_location} />
        <div>
          <div className="trip-duration">
            {startMonthDay} - {endMonthDay}
          </div>
          <div className="trip-location">{vacation.location_address}</div>
          <button className="view-button">View</button>
        </div>
      </div>
    );
  };

  // Group trips by year
  const tripsByYear = trips.reduce((acc, vacation) => {
    const startDate = new Date(vacation.trip_start);
    const year = startDate.getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(vacation);
    return acc;
  }, {});

  // Display loading message while data is being fetched
  if (loading) {
    return <div>Loading...</div>;
  }

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
