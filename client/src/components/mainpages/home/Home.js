import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import Axios from 'axios';
import Slider from 'react-slick';
import Trips from './Trips'; // Your Trips component
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import './styles.css';

function Home() {
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

  if (!isLogged) return <p>Please log in to view your trips.</p>;
  if (loading) return <div>Loading...</div>;
  if (trips.length === 0) return <p className="notrips">Start planning your trips!</p>;

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: true,
  };

  return (
    <div className="home-container">
    <h2>In Progress</h2>
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

export default Home;


