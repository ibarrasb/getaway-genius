import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import { Link } from 'react-router-dom'; 
// import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Axios from 'axios';
import './styles.css';

function PreviousTrips() {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [token] = state.token;
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetches new and current trips associated with the user email
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await Axios.get('/api/trips/getaway-trip', {
          params: { email: encodeURIComponent(email) }  // Encoding email parameter
        });
        if (res.status !== 200) {
          throw new Error('Network response was not ok');
        }
        const data = res.data;
        setTrips(data);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [email]);

  // Delete trip
  const removePost = async (id) => {
    if (window.confirm("Do you want to delete this post?")) {
      try {
        const res = await Axios.delete(`/api/trips/getaway/${id}`, {
          headers: { Authorization: token }
        });
        alert(res.data.msg);
        // Remove the deleted trip from the trips state
        setTrips(prevTrips => prevTrips.filter(trip => trip._id !== id));
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  // Previous trip component
  const renderPreviousTrip = (trip, index) => {
    const startDate = new Date(trip.trip_start);
    const endDate = new Date(trip.trip_end);
    const startMonth = startDate.toLocaleString('default', { month: 'short' });
    const startDay = startDate.getDate();
    const endMonth = endDate.toLocaleString('default', { month: 'short' });
    const endDay = endDate.getDate();

    return (
      <div className="trip-box-previous" key={index}>
        <img className="trip-image" src={trip.image_url} alt={trip.trip_location} />
        <div className='trip-details-box'>
          <div className="trip-duration">
            {startMonth} {startDay + 1} - {endMonth} {endDay + 1}
          </div>
          <div className="trip-location">{trip.location_address}</div>
          <div className='button-container'>
            <Link to={{ pathname: `/trips/${encodeURIComponent(trip._id)}`, state: { trip } }} className="view-button-previous">View</Link>  {/* Encoding trip ID */}
            <button onClick={() => removePost(trip._id)} className="view-button-previous" id='delete-button'>Delete</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const currentDate = new Date();

  // Previous trip logic to not include trips that end on the current day
  const previousTrips = trips.filter(trip => {
    const tripEndDate = new Date(trip.trip_end);
    
    // Add one day to the trip's end date
    const tripEndDatePlusOneDay = new Date(tripEndDate);
    tripEndDatePlusOneDay.setDate(tripEndDate.getDate() + 1);
  
    // Check if the adjusted end date is less than the current date
    return tripEndDatePlusOneDay < currentDate;
  });

  // If no previous trips, message will display
  if (previousTrips.length === 0) {
    return (
      <div className="home-container">
        <p className='dont-have'>You don't have Previous Trips.</p>
      </div>
    );
  }

  // Group previous trips by year
  const groupedPreviousTrips = previousTrips.reduce((acc, trip) => {
    const tripYear = new Date(trip.trip_end).getFullYear();
    if (!acc[tripYear]) {
      acc[tripYear] = [];
    }
    acc[tripYear].push(trip);
    return acc;
  }, {});

  return (
    <div className="home-container">
      {/* Render previous trips grouped by year */}
      {Object.keys(groupedPreviousTrips).map(year => (
        <div key={year} className="year-trips">
          <h2 className='year-text'>{year}</h2>
          <div className="open-trips-container">
            {groupedPreviousTrips[year].map((trip, index) => renderPreviousTrip(trip, index))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PreviousTrips;
