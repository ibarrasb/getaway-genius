import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import { Link } from 'react-router-dom';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Axios from 'axios';
import Trip from './IndividualTripComponent'; // Import the Trip component
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import './styles.css';

// Define custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#14213D', // Custom color
    },
  },
});

function ViewAll() {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [token] = state.token;
  const [isLogged] = state.UserAPI.isLogged;
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return <p>Please log in to view your trips.</p>;
  }

  if (loading) {
    return <div>Loading...</div>;
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
     <div className="back-button-container">
                    <Link to="/my-trip"><Button variant="text" className="back-button" startIcon={<ArrowBackIcon />}>Back</Button></Link>
                </div>
      {Object.keys(groupedCurrentTrips).length > 0 ? (
        Object.keys(groupedCurrentTrips).map(year => (
          <div key={year} className="year-trips">
            <h2 className="year-text">{year}</h2>
            <div className="open-trips-container">
              {groupedCurrentTrips[year].map((trip, index) => (
                <Trip key={index} trip={trip} onRemove={removePost} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="no-trips-message">
          <p className="notrips">Start planning your trips!</p>
        </div>
      )}

      {/* Floating Action Button */}
      <ThemeProvider theme={theme}>
        <div className="fab-container">
          <Link to="/search" style={{ textDecoration: 'none' }}>
          <Fab
              color="primary"
              aria-label="add"
              variant="extended"
              sx={{
                color: '#FFFFFF', // Set text color to white
              }}
            >
            <AddIcon style={{ marginRight: 8 }} />
            Create
          </Fab>

          </Link>
        </div>
      </ThemeProvider>
    </div>
  );
}

export default ViewAll;