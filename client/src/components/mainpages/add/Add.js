import React, { useState } from 'react';
import './Add.css'; // Import styles for the form

function Add() {
  const currentDate = new Date().toISOString().split('T')[0]; // Get current date in 'YYYY-MM-DD' format
  const [location, setLocation] = useState('');
  const [tripStart, setTripStart] = useState('');
  const [tripEnd, setTripEnd] = useState('');
  const [stayExpense, setStayExpense] = useState('');
  const [activityExpense, setActivityExpense] = useState('');
  const [carRentalExpense, setCarRentalExpense] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
        activityExpense,
        carRentalExpense
      });
      // After submitting the form, you can redirect the user to another page if needed
      // For example, using React Router: history.push('/some-other-page')
    }
  };

  return (
    <div className="add-form-container">
      <h2>Add Trip</h2>
      <form onSubmit={handleSubmit} className="add-form">
        <label>
          Location:
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </label>
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
          Activity Expense:
          <input
            type="text"
            value={activityExpense}
            onChange={handleExpenseChange(setActivityExpense)}
            onBlur={handleExpenseBlur(setActivityExpense)}
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