import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import Axios from 'axios';
import './Add.css';

const initialState = {
  user_email: '',
  location_address: '',
  trip_start: '',
  trip_end: '',
  stay_expense: 0,
  travel_expense: 0,
  car_expense: 0,
  other_expense: 0,
  image_url: '',
  isFavorite: false,
  activities: [],
};

function Add({ selectedPlace, photoURL }) {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [token] = state.token;
  const currentDate = new Date().toISOString().split('T')[0];
  const [location, setLocation] = useState('');
  const [tripStart, setTripStart] = useState('');
  const [tripEnd, setTripEnd] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [picURL, setPicURL] = useState('');
  const [callback, setCallback] = state.UserAPI.callback;
  const [tripObject, setTripObject] = useState(initialState); // Declared and used
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
      console.log('TESTING' + photoURL);
    }
  }, [photoURL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(tripStart) > new Date(tripEnd)) {
      setErrorMessage('Trip end date must be after trip start date.');
    } else {
      setErrorMessage('');
      const sentObj = {
        user_email: email,
        location_address: location,
        trip_start: tripStart,
        trip_end: tripEnd,
        stay_expense: 0,
        travel_expense: 0,
        car_expense: 0,
        other_expense: 0,
        image_url: picURL,
        isFavorite: false,
        activities: [],
      };

      setTripObject(sentObj); // Update tripObject state with sentObj

      try {
        await Axios.post('/api/trips/getaway-trip', sentObj, { headers: { Authorization: token } });
        setCallback(!callback);
        window.location.reload();
        window.location.href = '/home';
      } catch (err) {
        alert(err.response.data.msg);
      }
    }
  };

  function checkImage() {
    if (picURL) {
      return <img src={picURL} alt="Trip Location" />;
    } else {
      return <div></div>;
    }
  }

  // Optionally, use tripObject for rendering or debugging
  useEffect(() => {
    console.log('Trip Object updated:', tripObject);
  }, [tripObject]); // This effect runs whenever tripObject changes

  useEffect(() => {
    if (location) {
        const loc = { location }; // Wrap location in an object
        console.log("HERE:" + JSON.stringify(loc));

        fetch(`/api/chatgpt/trip-suggestion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loc), // Ensure body is a JSON string
        })
            .then(response => response.ok ? response.json() : Promise.reject('Recommendation Suggestion fetch failed'))
            .then(data => {
                setSuggestions(data.tripSuggestions); // Match the key from the server response
            })
            .catch(error => console.error('Error fetching fun places:', error))
            .finally(() => setSuggestionLoading(false));
    }
}, [location]);

  console.log(suggestions)
 
  return (
    <div className="add-form-container">
      <h1 className="wyg-text">When are you going?</h1>
      {checkImage()}
      <h2>{location}</h2>
      <form onSubmit={handleSubmit} className="add-form">
        <label>
          Trip Start:
          <input
            type="date"
            value={tripStart}
            min={currentDate}
            onChange={(e) => setTripStart(e.target.value)}
            required
          />
        </label>
        <label>
          Trip End:
          <input
            type="date"
            value={tripEnd}
            min={tripStart || currentDate}
            onChange={(e) => setTripEnd(e.target.value)}
            required
          />
        </label>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button type="submit">Create</button>
      </form>
    </div>
  );
}

export default Add;