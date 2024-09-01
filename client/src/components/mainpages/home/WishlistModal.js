import React, { useState, useEffect, useContext } from 'react';
import { GlobalState } from '../../../GlobalState';
import Axios from 'axios';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import './WishlistModal.css'; // Import CSS for styling

const initialState = {
  list_name: '',
  trips: [],
  email: ''
};

const WishlistModal = ({ show, onClose, onSave, trip }) => {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [wishlists, setWishlists] = useState([]);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [selectedWishlist, setSelectedWishlist] = useState('');
  const [selectedWishlistName, setSelectedWishlistName] = useState('');
  const [sentObject, setSentObject] = useState(initialState);

  useEffect(() => {
    if (show) {
      // Reset state when the modal is opened
      setNewWishlistName('');
      setSelectedWishlist('');
      setSelectedWishlistName('');
      setSentObject(initialState);
      
      // Fetch existing wishlists when the modal is shown
      const fetchWishlists = async () => {
        try {
          const response = await Axios.get('/api/wishlist/getlists', {
            params: { email: email }
          });
          setWishlists(response.data);
          console.log(response.data);
        } catch (error) {
          console.error('Error fetching wishlists:', error);
        }
      };

      fetchWishlists();
    }
  }, [show]);

  const handleSave = async () => {
    try {
      if (selectedWishlist) {
        // Add trip to selected wishlist
        const response = await Axios.post(`/api/wishlist/addtrip/${selectedWishlist}`, trip);
        // Call onSave function to handle any additional logic after saving
        onSave();
        alert('Trip has been added to ' + selectedWishlist);
      } else if (newWishlistName) {
        // Create new wishlist and add trip
        const setObj = {
          list_name: newWishlistName,
          trips: [trip],
          email: trip.user_email
        };

        setSentObject(setObj);
        await Axios.post('/api/wishlist/createlist', setObj);
        onSave();
        alert('Trip has been added to ' + newWishlistName);
      }
    } catch (error) {
      console.error('Error handling wishlist operation:', error);
    }
  };

  const handleButtonClick = (wishlistId, wishlistName) => {
    setSelectedWishlist(wishlistId);
    setSelectedWishlistName(wishlistName);
  };

  const handleClear = () => {
    setSelectedWishlist('');
    setNewWishlistName('');
    setSelectedWishlistName('');
  };

  if (!show) {
    return null;
  }

  return (
    <div className="wishlist-modal">
      <div className="wishlist-modal-content">
        <h2>Add to Wishlist</h2>
        <div className="wishlist-options">
          {wishlists.length > 0 && (
            <div>
              <h3>Existing Wishlists</h3>
              <div className="wishlist-buttons">
                {wishlists.map(wishlist => (
                  <Button
                    key={wishlist._id}
                    variant={selectedWishlist === wishlist._id ? 'contained' : 'outlined'}
                    className='wishlist-button'
                    onClick={() => handleButtonClick(wishlist._id, wishlist.list_name)}
                    style={{ marginBottom: '8px', marginRight: '8px'}}
                  >
                    {wishlist.list_name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className='new-wishlist-text'>Create New Wishlist</h3>
            <TextField
              label="Wishlist Name"
              variant="outlined"
              fullWidth
              value={newWishlistName}
              onChange={e => setNewWishlistName(e.target.value)}
              disabled={!!selectedWishlist} // Disable input if an existing wishlist is selected
              className={selectedWishlist ? 'disabled-input' : ''} // Apply a class for styling if disabled
              style={{ marginTop: '16px' }}
            />
          </div>
        </div>
        <div className="wishlist-modal-buttons">
          <Button variant="contained" color="primary" onClick={handleSave} style={{ marginRight: '8px' }}>
            Save
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleClear} style={{ marginRight: '8px' }}>
            Clear
          </Button>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WishlistModal;