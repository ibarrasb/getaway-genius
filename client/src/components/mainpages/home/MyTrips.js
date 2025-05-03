import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import Axios from 'axios';
import Slider from 'react-slick';
import Trips from './IndividualTripComponent'; // Your Trips component
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import './styles.css';


//MyTrips Tab
function MyTrips() {
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
        setTrips(res.data);
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
             //Removes Trip from wishlist first before deleting trip
              const wishlistsResponse = await Axios.get('/api/wishlist/getlists', {
                params: { email: email }
              });
              const wishlists = wishlistsResponse.data;
          
              // Find the wishlist containing the trip
              const wishlistWithTrip = wishlists.find(wishlist => 
                wishlist.trips.some(t => t._id === id)
              );
        
              if (wishlistWithTrip) {
                // Remove the trip from the found wishlist
                await Axios.delete(`/api/wishlist/${wishlistWithTrip._id}/remove-trip/${id}`);
              }

        const res = await Axios.delete(`/api/trips/getaway/${id}`, {
          headers: { Authorization: token }
        });
        alert(res.data.msg);
        setTrips(prevTrips => prevTrips.filter(trip => trip._id !== id));
        window.location.reload();

      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  if (!isLogged) return <p>Please log in to view your trips.</p>;
  if (loading) return <div>Loading...</div>;
  if (trips.length === 0) return <p className="notrips">Start planning your trips!</p>;

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: false,
    swipe: true, // Enables swipe gestures
    touchMove: true, // Ensures smooth touch interaction
    draggable: true,
    arrows: false, // Allows dragging with a mouse
  };

  return (
    <div className="home-container">
      <h2>Active</h2>

      <Slider {...settings}>
        {trips.map((trip) => (
          <div key={trip._id}>
            <Trips trip={trip} onRemove={removePost} />
          </div>
        ))}
      </Slider>
      
    </div>
  );
}

export default MyTrips;
