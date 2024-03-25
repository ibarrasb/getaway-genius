import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import { Link } from 'react-router-dom'; 
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Axios from 'axios';
import './styles.css';

function Home() {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [token] = state.token;
  const [isLogged] = state.UserAPI.isLogged
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name] = state.UserAPI.name;

  // Fetches new and current trips associated with the user's email 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await Axios.get('/api/trips/getaway-trip', {
          params: { email: email }
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

  // Current trip component
  const renderTrip = (trip, index) => {
    const startDate = new Date(trip.trip_start);
    const endDate = new Date(trip.trip_end);
    const startMonth = startDate.toLocaleString('default', { month: 'short' });
    const startDay = startDate.getDate();
    const endMonth = endDate.toLocaleString('default', { month: 'short' });
    const endDay = endDate.getDate();

    return (
      <div className="trip-box" key={index}>
        <img className="trip-image" src={trip.image_url} alt={trip.trip_location} />
        <div className='trip-details-box'>
          <div className="trip-duration">
            {startMonth} {startDay + 1} - {endMonth} {endDay + 1}
          </div>
          <div className="trip-location">{trip.location_address}</div>
          <div className='button-container'>
            <Link to={{ pathname: `/trips/${trip._id}`, state: { trip } }} className="view-button">View</Link>
            <button onClick={() => removePost(trip._id)} className="view-button" id='delete-button'>Delete</button>
          </div>
        </div>
      </div>
    );
  };

  if (!isLogged) {
    return (
      <div>
        <p>Please log in to view your trips.</p>
      
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  // Categorize data by upcoming or past trip
  const currentDate = new Date();
  // Current trip logic to include trips that end on the current day
  const currentTrips = trips.filter(trip => {
    const tripEndDate = new Date(trip.trip_end);
    
    // Add one day to the trip's end date
    const tripEndDatePlusOneDay = new Date(tripEndDate);
    tripEndDatePlusOneDay.setDate(tripEndDate.getDate() + 1);
 
    // Check if the adjusted end date is less than the current date
    return tripEndDatePlusOneDay >= currentDate;
  });

  // Group current trips by year and sort them by start date
  const groupedCurrentTrips = currentTrips.reduce((acc, trip) => {
    const tripYear = new Date(trip.trip_end).getFullYear();
    if (!acc[tripYear]) {
      acc[tripYear] = [];
    }
    acc[tripYear].push(trip);
    return acc;
  }, {});

  // Sort trips within each year by start date
  for (const year in groupedCurrentTrips) {
    groupedCurrentTrips[year].sort((a, b) => new Date(a.trip_start) - new Date(b.trip_start));
  }
  

  return (
    <div className="home-container">
      <div className="search-container">
    
        <h2 className='home-message'>Hi, {name}</h2> 
      </div>

      {/* Previous trip button */}
      <div className="center-button">
      <Stack spacing={2} direction="row">
      <Link to="/about"> <Button variant="outlined" className="linkbutton">About</Button></Link>
        <Link to="/previous-trips"> <Button variant="outlined" className="linkbutton">Previous</Button></Link>
        </Stack>
      </div>
    
      {/* Render current trips and organize by year when trip is */}
      {Object.keys(groupedCurrentTrips).map(year => (
        <div key={year} className="year-trips">
          <h2 className='year-text'>{year}</h2>
          <div className="open-trips-container">
            {groupedCurrentTrips[year].map((trip, index) => renderTrip(trip, index))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Home;
