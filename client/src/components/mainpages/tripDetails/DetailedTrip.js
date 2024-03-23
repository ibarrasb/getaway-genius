import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import TripDetails from './TripDetails';
import TripForm from './TripForm';
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

    useEffect(() => {
        const currentDate = new Date();
        if (tripDetails && new Date(tripDetails.trip_end) < currentDate) {
            setEditMode(false); // Disable edit mode if trip_end is before the current date
        }
    }, [tripDetails]);

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await Axios.put(`/api/trips/getaway/${id}`, formData);
            setEditMode(false);
            window.location.reload();
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

    // const isValidDate = (date) => {
    //     return !isNaN(Date.parse(date));
    // };

    // const formatDate = (dateString) => {
    //     const date = new Date(dateString);
    //     return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${(date.getDate() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    // };

    const formatDateWithExtraDay = (dateString) => {
        const date = new Date(dateString);
        date.setDate(date.getDate());
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${(date.getDate() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!tripDetails) {
        return <div className="not-found">Trip not found</div>;
    }

    return (
        <div className="detailed-container">
            <div className="detailed-button-container">
                <div className="back-button-container">
                    <Link to="/home" className="back-button">Back</Link>
                </div>
                {tripDetails.trip_end && new Date(tripDetails.trip_end) >= new Date() && ( // Check if trip_end is not in the past
                    <div className="edit-button-container">
                        <button className="editbutton-txt" onClick={handleEditToggle}>{editMode ? 'Cancel' : 'Edit'}</button>
                    </div>
                )}
            </div>

            <div className='tripinfo-container'>
                <TripDetails tripDetails={tripDetails} formData={formData} formatDateWithExtraDay={formatDateWithExtraDay} />
                <TripForm
                    formData={formData}
                    editMode={editMode}
                    handleExpenseChange={handleExpenseChange}
                    handleDateChange={handleDateChange}
                    handleSubmit={handleSubmit}
                    calculateTotalExpenses={calculateTotalExpenses}
                    numberOfPeople={numberOfPeople}
                    handlePeopleChange={handlePeopleChange}
                    calculateCostPerPerson={calculateCostPerPerson}
                />
            </div>
        </div>
    );
}

export default DetailedTrip;