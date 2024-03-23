import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import { Link } from 'react-router-dom'; 
import Axios from 'axios';
import './styles.css';

function Home() {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [token] = state.token;
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

//fetches new and current trips associated to the user with the email 
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

//delete trip 
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

//current trip component
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
            {startMonth} {startDay} - {endMonth} {endDay}
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

  if (loading) {
    return <div>Loading...</div>;
  }

  //categorizes data by upcoming or past trip
  const currentDate = new Date();
  const currentTrips = trips.filter(trip => new Date(trip.trip_end) >= currentDate);

  // Group current trips by year
  const groupedCurrentTrips = currentTrips.reduce((acc, trip) => {
    const tripYear = new Date(trip.trip_end).getFullYear();
    if (!acc[tripYear]) {
      acc[tripYear] = [];
    }
    acc[tripYear].push(trip);
    return acc;
  }, {});

  return (
    <div className="home-container">
      <div className="search-container">
        <h2 className='home-message'>Destination for smart planning</h2> 
      </div>

      {/* Previous trip button */}
      <div className="center-button">
      <Link to="/previous-trips" className="linkbutton">Previous</Link>
    </div>
    
     
      {/* Render current trips and organizes by year when trip is */}
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