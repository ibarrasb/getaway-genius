import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import Axios from 'axios';
import './Add.css';

const initialState = {
  user_email: '',
  location_address: '',
  within_trips: [],
  image_url: '',
  isFavorite: false,
};

function Add({ selectedPlace, photoURL }) {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [token] = state.token;
  const [location, setLocation] = useState('');
  const [picURL, setPicURL] = useState('');
  const [callback, setCallback] = state.UserAPI.callback;
  const [tripObject, setTripObject] = useState(initialState);
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  useEffect(() => {
    if (selectedPlace) {
      setLocation(selectedPlace.formatted_address);
    }
  }, [selectedPlace]);

  useEffect(() => {
    if (photoURL) {
      setPicURL(photoURL);
    }
  }, [photoURL]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const sentObj = {
      ...initialState,
      user_email: email,
      location_address: location,
      image_url: picURL,
    };

    setTripObject(sentObj);

    try {
      await Axios.post('/api/trips/getaway-trip', sentObj, {
        headers: { Authorization: token },
      });
      setCallback(prev => !prev);
      window.location.reload();
      window.location.href = '/explore';
    } catch (err) {
      alert(err.response?.data?.msg || 'Error creating trip');
    }
  };

  function checkImage() {
    return picURL ? <img src={picURL} alt="Trip Location" /> : null;
  }

  useEffect(() => {
    if (location) {
      fetch(`/api/chatgpt/trip-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch suggestions'))
        .then(data => setSuggestions(data.tripSuggestions))
        .catch(err => console.error('Suggestion fetch error:', err))
        .finally(() => setSuggestionLoading(false));
    }
  }, [location]);

  return (
    <div className="add-form-container">
      <h1 className="wyg-text">Create your trip</h1>
      {checkImage()}
      <h2>{location}</h2>
      <form onSubmit={handleSubmit} className="add-form">
        <button type="submit">Create</button>
      </form>
    </div>
  );
}

export default Add;
