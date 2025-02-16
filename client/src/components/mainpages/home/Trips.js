import React, { useState, useContext, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import { Link } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite'; // Import the Favorite icon
import Axios from 'axios'; // Import Axios for making HTTP requests
import './Trips.css'; // Import CSS file for styling
import WishlistModal from './WishlistModal'; // Import the WishlistModal component

const Trips = ({ trip, onRemove }) => {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [isFavorite, setIsFavorite] = useState(trip.isFavorite); // State to manage the favorite status
  const [showWishlistModal, setShowWishlistModal] = useState(false); // State to control modal visibility
  
  // Update isFavorite state when trip prop changes
  useEffect(() => {
    setIsFavorite(trip.isFavorite);
  }, [trip]); // Dependency array includes trip to trigger effect on changes

  const startDate = new Date(trip.trip_start);
  const endDate = new Date(trip.trip_end);
  const startMonth = startDate.toLocaleString('default', { month: 'short' });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleString('default', { month: 'short' });
  const endDay = endDate.getDate();

  // Function to handle toggling the favorite status
  const handleFavoriteToggle = () => {
    if (isFavorite) {
      // If already a favorite, perform the unfavorite action directly
      handleUnfavorite();
    } else {
      // If not a favorite, show the modal to add to wishlist
      setShowWishlistModal(true);
    }
  };

  const handleRemove = () => {
    onRemove(trip._id);
  };

  const handleModalClose = () => {
    setShowWishlistModal(false);
  };

  const handleModalSave = async () => {
    try {
      setIsFavorite(true);

      // Update trip to be a favorite
      await Axios.put(`/api/trips/getaway/${trip._id}`, { isFavorite: true });

      setShowWishlistModal(false);
    } catch (error) {
      console.error('Error updating trip details:', error);
    }
  };

  // Function to handle unfavoriting a trip
  const handleUnfavorite = async () => {
    if (!trip._id) {
      console.error('Missing trip ID for unfavorite action');
      return;
    }
  
    try {
      // Fetch all wishlists to find the one containing the trip
      const wishlistsResponse = await Axios.get('/api/wishlist/getlists', {
        params: { email: email }
      });
      const wishlists = wishlistsResponse.data;
  
      // Find the wishlist containing the trip
      const wishlistWithTrip = wishlists.find(wishlist => 
        wishlist.trips.some(t => t._id === trip._id)
      );

      if (wishlistWithTrip) {
        // Remove the trip from the found wishlist
        await Axios.delete(`/api/wishlist/${wishlistWithTrip._id}/remove-trip/${trip._id}`);
      }

      // Update the trip to be unfavorite
      await Axios.put(`/api/trips/getaway/${trip._id}`, { isFavorite: false });
  
      // Update the state if both API calls are successful
      setIsFavorite(false);
      alert('Trip has been removed from ' + wishlistWithTrip.list_name);
    } catch (error) {
      // Log the full error response
      console.error('Error removing trip from favorites and wishlist:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.message);
    }
  };
  
  return (
    <div className="trip-box">
    <div className="trip-location">{trip.location_address}</div>
    <div className="trip-duration">
          {startMonth} {startDay + 1} - {endMonth} {endDay + 1}
        </div>
      <div className="trip-image-container">
      
        <div className="favorite-icon" onClick={handleFavoriteToggle}>
          <FavoriteIcon style={{ color: isFavorite ? 'red' : 'grey' }} />
        </div>
        
        <img className="trip-image" src={trip.image_url} alt={trip.trip_location} />
      </div>
      <div className="trip-details-box">
        
        <div className="trip-location">
          {
            (
              (Number(trip.stay_expense) || 0) +
              (Number(trip.car_expense) || 0) +
              (Number(trip.travel_expense) || 0)
            ).toFixed(2) === "0.00"
              ? <span className="needs-attention">Needs Attention</span>
              : `$${(
                (Number(trip.stay_expense) || 0) +
                (Number(trip.car_expense) || 0) +
                (Number(trip.travel_expense) || 0)
              ).toFixed(2)}`
          }
        </div>
        
        <div className="button-container">
          <Link to={{ pathname: `/trips/${trip._id}`, state: { trip } }} className="view-button">View</Link>
          <button onClick={handleRemove} className="view-button" id="delete-button">Delete</button>
          {/* Add an Unfavorite button */}
          {isFavorite && (
            <button onClick={handleUnfavorite} className="view-button" id="unfavorite-button"/>
          )}
        </div>
      </div>
      {/* Render WishlistModal when showWishlistModal is true */}
      <WishlistModal
        show={showWishlistModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        trip={trip}
      />
    </div>
  );
};

export default Trips;
