import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import './detailed.css';

function DetailedTrip() {
    const { id } = useParams();
    const [tripDetails, setTripDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        trip_start: new Date().toISOString().slice(0, 10),
        trip_end: '',
        stay_expense: '',
        travel_expense: '',
        car_expense: '',
    });
    const [numberOfPeople, setNumberOfPeople] = useState(1);

    useEffect(() => {
        const fetchTripDetails = async () => {
            try {
                const res = await Axios.get(`/api/trips/getaway/${id}`);
                setTripDetails(res.data);
                setFormData(prevState => ({
                    ...prevState,
                    trip_start: res.data.trip_start || new Date().toISOString().slice(0, 10),
                    trip_end: res.data.trip_end || '',
                    stay_expense: formatExpense(res.data.stay_expense),
                    travel_expense: formatExpense(res.data.travel_expense),
                    car_expense: formatExpense(res.data.car_expense),
                }));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching trip details:', error);
                setLoading(false);
            }
        };

        fetchTripDetails();
    }, [id]);

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await Axios.put(`/api/trips/getaway/${id}`, formData);
            setEditMode(false);
            window.location.href = "/home";
        } catch (error) {
            console.error('Error updating trip details:', error);
        }
    };

    const formatExpense = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '';
        }
        const formattedValue = Math.abs(parseFloat(value)).toFixed(2);
        return formattedValue.indexOf('.') === -1 ? `${formattedValue}.00` : formattedValue;
    };

    const handleExpenseChange = (key, value) => {
        if (!isNaN(value) || value === '') {
            setFormData(prevState => ({
                ...prevState,
                [key]: value,
            }));
        }
    };

    const handleDateChange = (key, value) => {
        setFormData(prevState => ({
            ...prevState,
            [key]: value,
        }));
    };

    const calculateTotalExpenses = () => {
        const { stay_expense, travel_expense, car_expense } = formData;
        return parseFloat(stay_expense) + parseFloat(travel_expense) + parseFloat(car_expense);
    };

    const handlePeopleChange = (e) => {
        const { value } = e.target;
        setNumberOfPeople(value);
    };

    const calculateCostPerPerson = () => {
        const totalExpenses = calculateTotalExpenses();
        const costPerPerson = totalExpenses / numberOfPeople;
        return isNaN(costPerPerson) ? 0 : costPerPerson.toFixed(2);
    };

    const isValidDate = (date) => {
        return !isNaN(Date.parse(date));
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!tripDetails) {
        return <div className="not-found">Trip not found</div>;
    }

    return (
        <div className="detailed-container">
            <div className="back-button-container">
                <Link to="/home" className="back-button">Back</Link>
            </div>
            <div className="edit-button-container">
                <button onClick={handleEditToggle}>{editMode ? 'Cancel' : 'Edit'}</button>
            </div>
            <div className="trip-details-container">
                <div className="details-left">
                    <div className="trip-image-container">
                        <img src={tripDetails.image_url} alt="Trip Image" className="trip-image" />
                        <div className="destination-overlay">
                            <p className="location">{tripDetails.location_address}</p>
                            <p className="dates">Trip Start: {formatDateWithExtraDay(formData.trip_start)}</p>
                            <p className="dates">Trip End: {formatDateWithExtraDay(formData.trip_end)}</p>
                        </div>
                    </div>
                </div>
                <div className="details-right">
                    <form className="detailed-form" onSubmit={handleSubmit}>
                        <label>
                            <h2>Stay Expense:</h2>
                            {editMode ? (
                                <input
                                    type="text"
                                    name="stay_expense"
                                    value={formData.stay_expense}
                                    onChange={(e) => handleExpenseChange('stay_expense', e.target.value)}
                                    required
                                />
                            ) : (
                                <p>{formData.stay_expense}</p>
                            )}
                        </label>
                        <label>
                            <h2>Travel Expense:</h2>
                            {editMode ? (
                                <input
                                    type="text"
                                    name="travel_expense"
                                    value={formData.travel_expense}
                                    onChange={(e) => handleExpenseChange('travel_expense', e.target.value)}
                                    required
                                />
                            ) :(
                                <p>{formData.travel_expense}</p>
                            )}
                        </label>
                        <label>
                            <h2>Car Expense:</h2>
                            {editMode ? (
                                <input
                                    type="text"
                                    name="car_expense"
                                    value={formData.car_expense}
                                    onChange={(e) => handleExpenseChange('car_expense', e.target.value)}
                                    required
                                />
                            ) : (
                                <p>{formData.car_expense}</p>
                            )}
                        </label>
                        {editMode && (
                            <div>
                                <label>
                                    <h2>Trip Start:</h2>
                                    <input
                                        type="date"
                                        name="trip_start"
                                        value={editMode ? new Date(formData.trip_start).toISOString().slice(0, 10) : formData.trip_start}
                                        onChange={(e) => handleDateChange('trip_start', e.target.value)}
                                        required
                                    />
                                </label>
                                <label>
                                    <h2>Trip End:</h2>
                                    <input
                                        type="date"
                                        name="trip_end"
                                        value={editMode ? new Date(formData.trip_end).toISOString().slice(0, 10) : formData.trip_end}
                                        onChange={(e) => handleDateChange('trip_end', e.target.value)}
                                        min={formData.trip_start}
                                        required
                                    />
                                </label>
                            </div>
                        )}
                        {!editMode && (
                            <div>
                                <h2>Total Expenses: ${calculateTotalExpenses().toFixed(2)}</h2>
                                <label>
                                    Number of People:
                                    <input
                                        type="number"
                                        value={numberOfPeople}
                                        onChange={handlePeopleChange}
                                        min="1"
                                    />
                                </label>
                                <h2>Cost per Person: ${calculateCostPerPerson()}</h2>
                            </div>
                        )}
                        {editMode && <button type="submit">Update Trip</button>}
                    </form>
                </div>
            </div>
        </div>
    );
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${(date.getDate() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function formatDateWithExtraDay(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate());
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${(date.getDate() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

export default DetailedTrip;




    
