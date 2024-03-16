import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import { useParams } from 'react-router-dom';
import './detailed.css';

function DetailedTrip() {
    const { id } = useParams();
    const [tripDetails, setTripDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        trip_start: new Date().toISOString().slice(0, 10), // Set default to today's date
        trip_end: '',
        stay_expense: '',
        travel_expense: '',
        car_expense: '',
    });

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

    useEffect(() => {
      const fetchTripDetails = async () => {
          try {
              const res = await Axios.get(`/api/trips/getaway/${id}`);
              setTripDetails(res.data);
              setFormData(prevState => ({
                  ...prevState,
                  trip_start: new Date().toISOString().slice(0, 10), // Set default to today's date
                  stay_expense: res.data.stay_expense || '',
                  travel_expense: res.data.travel_expense || '',
                  car_expense: res.data.car_expense || '',
              }));
              setLoading(false);
          } catch (error) {
              console.error('Error fetching trip details:', error);
              setLoading(false);
          }
      };
  
      fetchTripDetails();
  }, [id]);
  

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'trip_start') {
            // Validate trip start date to be today or later
            const today = new Date();
            const selectedDate = new Date(value);
            if (selectedDate < today) {
                alert("Trip start date cannot be in the past");
                return;
            }
            setFormData({ ...formData, [name]: value });
        } else if (name === 'trip_end') {
            // Validate trip end date to be after trip start date
            const startDate = new Date(formData.trip_start);
            const endDate = new Date(value);
            if (endDate < startDate) {
                alert("Trip end date cannot be before trip start date");
                return;
            }
            setFormData({ ...formData, [name]: value });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await Axios.put(`/api/trips/getaway/${id}`, formData);
            window.location.href = "/home";
        } catch (error) {
            console.error('Error updating trip details:', error);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!tripDetails) {
        return <div className="not-found">Trip not found</div>;
    }

    return (
        <div className="container">
            <h2>Trip Details</h2>
            <p>Trip ID: {tripDetails._id}</p>
            
            <img src={tripDetails.image_url} alt="Trip Image" className="trip-image" />
            <p className="location">Location: {tripDetails.location_address}</p>
            <form className="detailed-form" onSubmit={handleSubmit}>
                <label>
                    Trip Start:
                    <input
                        type="date"
                        name="trip_start"
                        value={formData.trip_start}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>
                    Trip End:
                    <input
                        type="date"
                        name="trip_end"
                        value={formData.trip_end}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>
                    Stay Expense:
                    <input
                        type="number"
                        name="stay_expense"
                        value={formData.stay_expense}
                        onChange={handleExpenseChange((value) => setFormData({ ...formData, stay_expense: value }))}
                        onBlur={handleExpenseBlur((value) => setFormData({ ...formData, stay_expense: value }))}
                        required
                    />
                </label>
                <label>
                    Travel Expense:
                    <input
                        type="number"
                        name="travel_expense"
                        value={formData.travel_expense}
                        onChange={handleExpenseChange((value) => setFormData({ ...formData, travel_expense: value }))}
                        onBlur={handleExpenseBlur((value) => setFormData({ ...formData, travel_expense: value }))}
                        required
                    />
                </label>
                <label>
                    Car Expense:
                    <input
                        type="number"
                        name="car_expense"
                        value={formData.car_expense}
                        onChange={handleExpenseChange((value) => setFormData({ ...formData, car_expense: value }))}
                        onBlur={handleExpenseBlur((value) => setFormData({ ...formData, car_expense: value }))}
                        required
                    />
                </label>
                <button type="submit">Update Trip</button>
            </form>
        </div>
    );
}

export default DetailedTrip;
