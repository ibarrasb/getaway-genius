import React, { useState, useEffect } from 'react';
import { useParams, Link} from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import axios from 'axios';

const DetailedWishlist = () => {
  const { id } = useParams(); // Get the wishlist ID from the URL
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch wishlist data when the component mounts
    const fetchWishlist = async () => {
      try {
        const response = await axios.get(`/api/wishlist/spec-wishlist/${id}`);
        setWishlist(response.data);
        console.log(response.data)
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch wishlist data');
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [id]);

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
        <Link to="/favorites"><Button variant="text" className="back-button" startIcon={<ArrowBackIcon />}>Back</Button></Link>
    </div>
    {/*<div className="edit-button-container">
        <button className="editbutton-txt" onClick={handleEditToggle}>{editMode ? 'Cancel' : 'Edit'}</button>
    </div>*/}
</div>
      <h2>Wishlist Details</h2>
      {wishlist ? (
        <div>
          <h3>{wishlist.name}</h3>
          <ul>
            {wishlist.trips.map((trip, index) => (
              <li key={index}>
                <strong>{trip.location_address}</strong> - {trip.description}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>No wishlist data available.</div>
      )}
    </div>
  );
};

export default DetailedWishlist;
