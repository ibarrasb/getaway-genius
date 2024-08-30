import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import './WishlistModal.css'; // Import CSS for styling

const initialState = {
  list_name: '',
  trips: [],
  email: ''
}

const WishlistModal = ({ show, onClose, onSave, trip }) => {
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
          const response = await Axios.get('/api/wishlist/getlists');
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
        alert('Trip has been added to ' + selectedWishlist)
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
        alert('Trip has been added to ' + newWishlistName)
      }
    } catch (error) {
      console.error('Error handling wishlist operation:', error);
    }
  };

  const handleRadioChange = (wishlistId, wishlistName) => {
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
          <div>
            <h3>Existing Wishlists</h3>
            <ul>
              {wishlists.map(wishlist => (
                <div key={wishlist._id}>
                  <label>
                    <input
                      type="radio"
                      name="wishlist"
                      value={wishlist._id}
                      checked={selectedWishlist === wishlist._id}
                      onChange={() => handleRadioChange(wishlist._id, wishlist.list_name)}
                    />
                    {wishlist.list_name}
                  </label>
                </div>
              ))}
            </ul>
          </div>
          <div>
            <h3>Create New Wishlist</h3>
            <input
              type="text"
              placeholder="Wishlist Name"
              value={newWishlistName}
              onChange={e => setNewWishlistName(e.target.value)}
              disabled={!!selectedWishlist} // Disable input if an existing wishlist is selected
              className={selectedWishlist ? 'disabled-input' : ''} // Apply a class for styling if disabled
            />
          </div>
        </div>
        <div className="wishlist-modal-buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={handleClear}>Clear</button> {/* Clear button */}
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default WishlistModal;
