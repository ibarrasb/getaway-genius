import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite'; // Import the Favorite icon
import Axios from 'axios'; // Import Axios for making HTTP requests
import './Trips.css'; // Import CSS file for styling

const Trips = ({ trip, onRemove }) => {
  const [isFavorite, setIsFavorite] = useState(trip.isFavorite); // State to manage the favorite status

  const startDate = new Date(trip.trip_start);
  const endDate = new Date(trip.trip_end);
  const startMonth = startDate.toLocaleString('default', { month: 'short' });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleString('default', { month: 'short' });
  const endDay = endDate.getDate();

  const handleFavoriteToggle = async () => {
    try {
      // Update the isFavorite state to its opposite value
      const newFavoriteStatus = !isFavorite;
      setIsFavorite(newFavoriteStatus);

      // Send a PUT request to update trip details including isFavorite property
      await Axios.put(`/api/trips/getaway/${trip._id}`, { isFavorite: newFavoriteStatus });
    } catch (error) {
      console.error('Error updating trip details:', error);
    }
  };

  const handleRemove = () => {
    onRemove(trip._id);
  };
  
  return (
    <div className="trip-box">
      <div className="trip-image-container">
        {/* Render the FavoriteIcon component with conditional color */}
        <div className="favorite-icon" onClick={handleFavoriteToggle}>
          <FavoriteIcon style={{ color: isFavorite ? 'red' : 'grey' }} />
        </div>
        {/* Render the trip image */}
        <img className="trip-image" src={trip.image_url} alt={trip.trip_location} />
      </div>
      <div className='trip-details-box'>
        <div className="trip-duration">
          {startMonth} {startDay + 1} - {endMonth} {endDay + 1}
        </div>
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
      
      
      
        <div className="trip-location">{trip.location_address}</div>
        <div className='button-container'>
          <Link to={{ pathname: `/trips/${trip._id}`, state: { trip } }} className="view-button">View</Link>
          <button onClick={handleRemove} className="view-button" id='delete-button'>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default Trips;
