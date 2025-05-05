import React, { useState, useEffect, useContext } from 'react';
import { GlobalState } from '../../../GlobalState';
import { useParams, Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import axios from 'axios';
import Trip from '../home/IndividualTripComponent'; // Import the Trip component

const DetailedWishlist = () => {
  const { id } = useParams(); // Get the wishlist ID from the URL
  const state = useContext(GlobalState);
  const [token] = state.token;
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripsData, setTripsData] = useState([]); // State to store fetched trip data

  useEffect(() => {
    // Fetch wishlist data when the component mounts
    const fetchWishlist = async () => {
      try {
        const response = await axios.get(`/api/wishlist/spec-wishlist/${id}`);
        setWishlist(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch wishlist data');
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [id]);

  // Fetch trip data for each trip in the wishlist
  useEffect(() => {
    const fetchTripsData = async () => {
      if (wishlist && wishlist.trips) {
        try {
          const fetchedTrips = await Promise.all(
            wishlist.trips.map(trip => axios.get(`/api/trips/getaway/${trip._id}`))
          );
          // Update state with fetched trip data
          setTripsData(fetchedTrips.map(response => response.data));
        } catch (err) {
          console.error('Error fetching trip data:', err);
        }
      }
    };

    fetchTripsData();
  }, [wishlist]);

  const removePost = async (tripId) => {
    if (window.confirm("Do you want to delete this trip?")) {
      try {
        // Call the function to remove and unfavorite the trip
        await axios.delete(`/api/trips/getaway/${tripId}`, {
          headers: { Authorization: token }
        });
        
      } catch (error) {
        console.error('Error deleting trip:', error);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div className="profile-button-container">
        <div className="back-button-container">
          <Link to="/favorites">
            <Button variant="text" className="back-button" startIcon={<ArrowBackIcon />}>
              Back
            </Button>
          </Link>
        </div>
      </div>

      {wishlist ? (
        <div>
          <h2>{wishlist.list_name}</h2>

          {/* Rendering each trip using the Trip component */}
          {tripsData.length > 0 ? (
            <div className="wishlist-trips">
              {tripsData.map(trip => (
                <Trip key={trip._id} trip={trip} onRemove={removePost} customClass="wishlisted-trip" />

              ))}
            </div>
          ) : (
            <p>No trips in this wishlist.</p>
          )}
        </div>
      ) : (
        <div>No wishlist data available.</div>
      )}
    </div>
  );
};

export default DetailedWishlist;
