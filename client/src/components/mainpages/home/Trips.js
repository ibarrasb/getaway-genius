import React, { useState, useContext, useEffect } from 'react';
import { GlobalState } from '@/context/GlobalState';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite'; // Import the Favorite icon
import Axios from 'axios'; // Import Axios for making HTTP requests
import './Trips.css'; // Import CSS file for styling
import WishlistModal from './WishlistModal'; // Import the WishlistModal component
import { useDataRefresh } from '@/hooks/useDataRefresh.js';
import { useToast } from '@/context/ToastContext.jsx';

const Trips = ({ trip, onRemove }) => {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [token] = state.token;
  const navigate = useNavigate();
  const location = useLocation();
  const { refetchTrips, refetchWishlists } = useDataRefresh();
  const { success, error } = useToast();
  
  const [isFavorite, setIsFavorite] = useState(trip.isFavorite); // State to manage the favorite status
  const [showWishlistModal, setShowWishlistModal] = useState(false); // State to control modal visibility
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
    if (isToggling) return;
    if (isFavorite) {
      // If already a favorite, perform the unfavorite action directly
      handleUnfavorite();
    } else {
      // If not a favorite, show the modal to add to wishlist
      setShowWishlistModal(true);
    }
  };

  const handleRemove = async () => {
    if (isDeleting) return;
    
    if (!window.confirm("Do you want to delete this trip?")) return;
    
    setIsDeleting(true);
    
    try {
      const headers = token ? { Authorization: token } : undefined;
      await Axios.delete(`/api/trips/getaway/${trip._id}`, { headers });
      
      if (location.pathname === `/trips/${trip._id}`) {
        navigate('/explore');
      }
      
      onRemove(trip._id);
      
      await Promise.all([refetchTrips(), refetchWishlists()]);
      
      success("Trip deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
      error("Failed to delete trip. Please try again.");
    } finally {
      setIsDeleting(false);
    }
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
      
      await Promise.all([refetchTrips(), refetchWishlists()]);
    } catch (error) {
      console.error('Error updating trip details:', error);
      setIsFavorite(false);
      error("Failed to add trip to wishlist. Please try again.");
    }
  };

  // Function to handle unfavoriting a trip
  const handleUnfavorite = async () => {
    if (!trip._id || isToggling) {
      console.error('Missing trip ID for unfavorite action');
      return;
    }
    
    setIsToggling(true);
    const originalFavoriteState = isFavorite;
  
    try {
      setIsFavorite(false);
      
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
      
      await Promise.all([refetchTrips(), refetchWishlists()]);
  
      if (wishlistWithTrip?.list_name) {
        success('Trip has been removed from ' + wishlistWithTrip.list_name);
      } else {
        success('Trip removed from favorites');
      }
    } catch (error) {
      // Log the full error response
      console.error('Error removing trip from favorites and wishlist:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.message);
      
      setIsFavorite(originalFavoriteState);
      error("Failed to remove from favorites. Please try again.");
    } finally {
      setIsToggling(false);
    }
  };
  
  return (
    <div className="trip-box">
    <div className="trip-location">{trip.location_address}</div>
    <div className="trip-duration">
          {startMonth} {startDay + 1} - {endMonth} {endDay + 1}
        </div>
      <div className="trip-image-container">
      
        <div className={`favorite-icon ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={handleFavoriteToggle}>
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
          <button 
            onClick={handleRemove} 
            disabled={isDeleting}
            className={`view-button ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`} 
            id="delete-button"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
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
