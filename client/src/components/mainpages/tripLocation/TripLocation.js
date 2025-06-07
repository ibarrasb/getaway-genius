import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import TripDetails from '../tripDetails/TripDetails';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import './TripLocation.css';

// Format: 📅 July 1 – 3, 2025
const formatDateRange = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);

    const startMonth = start.toLocaleString('en-US', { month: 'long' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = start.getFullYear();

    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
};

function TripLocation() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [tripDetails, setTripDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTripDetails = async () => {
            try {
                const res = await Axios.get(`/api/trips/getaway/${id}`);
                setTripDetails(res.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching trip details:', error);
                setLoading(false);
            }
        };

        fetchTripDetails();
    }, [id]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!tripDetails) {
        return <div className="not-found">Trip not found</div>;
    }

    return (
        <div className="trip-location-layout">
            {/* Left Panel */}
            <div className="left-panel">
                <div className="back-button">
                    <Button
                        variant="text"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </Button>
                </div>

                <div className="tripinfo-container">
                    <TripDetails tripDetails={tripDetails} />
                </div>
            </div>

            {/* Right Panel */}
            <div className="right-panel trip-instances-panel">
                <h3>Trip Instances</h3>

                <Button
                    variant="contained"
                    className="create-instance-button"
                    onClick={() => alert('Open trip instance form')}
                >
                    + Create
                </Button>

                <div>
                    {[1, 2].map((_, idx) => (
                        <div
                            key={idx}
                            className="instance-card"
                            onClick={() => alert(`Open detailed view for instance ${idx + 1}`)}
                        >
                            <div className="instance-dates">
                                📅 <span>{formatDateRange(`2025-07-0${idx + 1}`, `2025-07-0${idx + 3}`)}</span>
                            </div>
                            <div className="instance-price">
                                💰 <span>$1,500</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TripLocation;
