import React, { useState, useEffect } from 'react';
import './Add.css'; // Import styles for the form

function Add({ selectedPlace }) {
  const currentDate = new Date().toISOString().split('T')[0]; // Get current date in 'YYYY-MM-DD' format
  const [location, setLocation] = useState('');
  const [tripStart, setTripStart] = useState('');
  const [tripEnd, setTripEnd] = useState('');
  const [stayExpense, setStayExpense] = useState('');
  const [travelExpense, setTravelExpense] = useState('');
  const [carRentalExpense, setCarRentalExpense] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Update the location state when the selectedPlace prop changes
  useEffect(() => {
    if (selectedPlace) {
      setLocation(selectedPlace.formatted_address);
    }
  }, [selectedPlace]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (new Date(tripStart) > new Date(tripEnd)) {
      setErrorMessage('Trip end date must be after trip start date.');
    } else {
      setErrorMessage('');
      // You can handle form submission here, for example, sending data to an API
      console.log({
        location,
        tripStart,
        tripEnd,
        stayExpense,
        travelExpense,
        carRentalExpense
      });
      // After submitting the form, you can redirect the user to another page if needed
      // For example, using React Router: history.push('/some-other-page')
    }
  };

  return (
    <div className="add-form-container">
      <h2>Add Trip</h2>
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
