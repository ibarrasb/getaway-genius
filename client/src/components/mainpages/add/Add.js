import React, { useContext, useState, useEffect } from 'react';
import {GlobalState} from '../../../GlobalState'
import Axios from 'axios';
import './Add.css'; // Import styles for the form

const initialState = {
  "location_address": '',
  "trip_start": '',
  "trip_end": '',
  "stay_expense": 0,
  "travel_expense": 0,
  "car_expense": 0,
  "image_url": ''
}


function Add({ selectedPlace, photoURL }) {
  const state = useContext(GlobalState)
  const [isLogged] = state.UserAPI.isLogged
  const [token] = state.token
  const currentDate = new Date().toISOString().split('T')[0]; // Get current date in 'YYYY-MM-DD' format
  const [location, setLocation] = useState('');
  const [tripStart, setTripStart] = useState('');
  const [tripEnd, setTripEnd] = useState('');
  const [stayExpense, setStayExpense] = useState('');
  const [travelExpense, setTravelExpense] = useState('');
  const [carRentalExpense, setCarRentalExpense] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [picURL, setPicURL] = useState('');
  const addTrip = state.UserAPI.addTrip
  const [callback ,setCallback] = state.UserAPI.callback
  const [tripObject, setTripObject] = useState(initialState)

 
  // Update the location state when the selectedPlace prop changes
  useEffect(() => {
    if (selectedPlace) {
      setLocation(selectedPlace.formatted_address);
    }
  }, [selectedPlace]);

  useEffect(() => {
    if (photoURL) {
      setPicURL(photoURL);
      console.log("TESTING" + photoURL)
    }
  }, [photoURL]);

  const formatExpense = (value) => {
    // Ensure the value has exactly two decimal places
    const formattedValue = parseFloat(value).toFixed(2);
    // Ensure the formatted value is a valid number, if not return an empty string
    return isNaN(formattedValue) ? '' : formattedValue;
  };

  const handleExpenseChange = (setter) => (e) => {
    setter(e.target.value);
  };

  const handleExpenseBlur = (setter) => (e) => {
    setter(formatExpense(e.target.value));
  };

  function setObject() {
    const sentObj = {
      location_address: location,
      trip_start: tripStart,
      trip_end: tripEnd,
      stay_expense: stayExpense,
      travel_expense: travelExpense,
      car_expense: carRentalExpense,
      image_url: picURL
    }
    setTripObject(sentObj)

  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(tripStart) > new Date(tripEnd)) {
      setErrorMessage('Trip end date must be after trip start date.');
    } else {
      setErrorMessage('');
      const sentObj = {
        location_address: location,
        trip_start: tripStart,
        trip_end: tripEnd,
        stay_expense: stayExpense,
        travel_expense: travelExpense,
        car_expense: carRentalExpense,
        image_url: picURL
      };
  
      // Create a Promise to wait for the state update to finish
      const stateUpdatePromise = new Promise(resolve => {
        setTripObject(sentObj);
        resolve(); // Resolve the Promise after the state is updated
      });
  
      // Wait for the state update to finish before continuing
      await stateUpdatePromise;
  
      try {
        await Axios.post('/api/trips/getaway-trip', sentObj, { headers: { Authorization: token } });
        setCallback(!callback);
        window.location.reload();
      } catch (err) {
        alert(err.response.data.msg);
      }
    }
  };
  

  function checkImage(){
    if(picURL){
      return (
        <img 
        src={picURL}
        alt=""
        />
      )
    }
    else {
      return (
        <div></div>
      )
    }
  }

  return (
    <div className="add-form-container">
   {
    checkImage()
   }
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
        <label>
          Stay Expense:
          <input
            type="text"
            value={stayExpense}
            onChange={handleExpenseChange(setStayExpense)}
            onBlur={handleExpenseBlur(setStayExpense)}
            required
          />
        </label>
        <label>
          Travel Expense:
          <input
            type="text"
            value={travelExpense}
            onChange={handleExpenseChange(setTravelExpense)}
            onBlur={handleExpenseBlur(setTravelExpense)}
            required
          />
        </label>
        <label>
          Car Rental Expense:
          <input
            type="text"
            value={carRentalExpense}
            onChange={handleExpenseChange(setCarRentalExpense)}
            onBlur={handleExpenseBlur(setCarRentalExpense)}
            required
          />
        </label>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Add;
