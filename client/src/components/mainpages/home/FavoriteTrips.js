import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import { Link } from 'react-router-dom'; 
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Axios from 'axios';
import Trip from './Trips'; // Import the Trip component
import './styles.css';

function FavoriteTrips() {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [token] = state.token;
  const [isLogged] = state.UserAPI.isLogged;
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = createTheme({
    palette: {
      primary: {
        light: '#84A98C',
        main: '#84A98C',
        dark: '#84A98C',
        contrastText: '#ffffff', // Changed contrast text for better visibility
      },
      secondary: {
        light: '#84A98C',
        main: '#84A98C',
        dark: '#84A98C',
        contrastText: '#ffffff', // Changed contrast text for better visibility
      },
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await Axios.get('/api/trips/favorites', {
          params: { email: email }
        });
        if (res.status === 200) { // Check status before updating state
          setTrips(res.data);
        } else {
          throw new Error('Network response was not ok');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [email]);

  const removePost = async (id) => {
    if (window.confirm("Do you want to delete this post?")) {
      try {
        const res = await Axios.delete(`/api/trips/getaway/${id}`, {
          headers: { Authorization: token }
        });
        alert(res.data.msg);
        setTrips(prevTrips => prevTrips.filter(trip => trip._id !== id));
      } catch (error) {
        console.error('Error:', error);
      }
    }
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

  if (trips.length === 0) {
    return (
      <div className="home-container">
      <div className="search-container">
        <h2 className='home-message'>Favorites</h2> 
      </div>

      <div className="center-button">
        <Stack spacing={2} direction="row">
          <ThemeProvider theme={theme}>
            <Link to="/home">
              <Button variant="outlined" color="primary" className="linkbutton">Home</Button>
            </Link>
            <Link to="/previous-trips">
              <Button variant="outlined" color="primary" className="linkbutton">Previous</Button>
            </Link>
            <Link to="/favorites">
              <Button variant="outlined" color="primary" className="linkbutton">Favorites</Button>
            </Link>
          </ThemeProvider>
        </Stack>
      </div>
          <p>you dont have previous Trips.</p>
      </div>
    );
  }

  const currentDate = new Date();
  const currentTrips = trips.filter(trip => {
    const tripEndDate = new Date(trip.trip_end);
    const tripEndDatePlusOneDay = new Date(tripEndDate);
    tripEndDatePlusOneDay.setDate(tripEndDate.getDate() + 1);
    return tripEndDatePlusOneDay >= currentDate;
  });

  const groupedCurrentTrips = currentTrips.reduce((acc, trip) => {
    const tripYear = new Date(trip.trip_end).getFullYear();
    if (!acc[tripYear]) {
      acc[tripYear] = [];
    }
    acc[tripYear].push(trip);
    return acc;
  }, {});

  for (const year in groupedCurrentTrips) {
    groupedCurrentTrips[year].sort((a, b) => new Date(a.trip_start) - new Date(b.trip_start));
  }
  
  return (
    <div className="home-container">
      <div className="search-container">
        <h2 className='home-message'>Favorites</h2> 
      </div>

      <div className="center-button">
        <Stack spacing={2} direction="row">
          <ThemeProvider theme={theme}>
            <Link to="/home">
              <Button variant="outlined" color="primary" className="linkbutton">Home</Button>
            </Link>
            <Link to="/previous-trips">
              <Button variant="outlined" color="primary" className="linkbutton">Previous</Button>
            </Link>
            <Link to="/favorites">
              <Button variant="outlined" color="primary" className="linkbutton">Favorites</Button>
            </Link>
          </ThemeProvider>
        </Stack>
      </div>
    
      {Object.keys(groupedCurrentTrips).map(year => (
        <div key={year} className="year-trips">
          <h2 className='year-text'>{year}</h2>
          <div className="open-trips-container">
            {groupedCurrentTrips[year].map((trip, index) => (
              <Trip key={index} trip={trip} onRemove={removePost} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default FavoriteTrips;
