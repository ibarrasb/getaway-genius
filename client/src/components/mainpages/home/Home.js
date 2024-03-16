import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import { Link } from 'react-router-dom'; 
import Axios from 'axios'
import './styles.css';

function Home() {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [local] = state.TripsAPI.trip;
  const [token] = state.token;
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    if (local && email) {
      const filteredTrips = local.filter(trip => trip.user_email === email);
      setTrips(filteredTrips);
      setLoading(false);
    }
  }, [local, email]);

  const removePost = async (id) => {
    if (window.confirm("Do you want to delete this post?")) {
      const res = await Axios.delete(`/api/trips/getaway/${id}`, {
        headers: { Authorization: token }
      });
      alert(res.data.msg);
    }
  };

  const doublePlay = async (id) => {
    await removePost(id);
    window.location.reload();
  };

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
          <button onClick={() => doublePlay(vacation._id)} className="delete">Delete</button>
        </div>
      </div>
    );
  };

  // Display loading message while data is being fetched
  if (loading) {
    return <div>Loading...</div>;
  }

  // Render "Start Planning trips" message if no trips are available
  if (trips.length === 0) {
    return (
      <div className="home-container">
        <div className="search-container">
          <div className="search-input-container">
            <Link to="/search" className="search-button">Create</Link>
          </div>
        </div>
        <h2>Start Planning trips</h2>
      </div>
    );
  }

  // Render trips grouped by year
  const tripsByYear = trips.reduce((acc, vacation) => {
    const startDate = new Date(vacation.trip_start);
    const year = startDate.getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(vacation);
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
          <div className="year-trip">
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
