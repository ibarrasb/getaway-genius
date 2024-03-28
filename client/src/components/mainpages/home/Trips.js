import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite'; // Import the Favorite icon
import './Trips.css'; // Import CSS file for styling

const Trips = ({ trip, onRemove }) => {
  const [isFavorite, setIsFavorite] = useState(false); // State to manage the favorite status

  const startDate = new Date(trip.trip_start);
  const endDate = new Date(trip.trip_end);
  const startMonth = startDate.toLocaleString('default', { month: 'short' });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleString('default', { month: 'short' });
  const endDay = endDate.getDate();

  const handleFavoriteToggle = () => {
    setIsFavorite(prevState => !prevState); // Toggle the favorite status
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
