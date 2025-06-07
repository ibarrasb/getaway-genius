import React, { useState, useEffect } from 'react';
import { WiDaySunny, WiCloud, WiRain, WiSnow, WiThunderstorm } from 'react-icons/wi';
import { Typography, Box, CircularProgress, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TripSuggestions from './TripSuggestions';

function TripDetails({ tripDetails, formData }) {
    const [weatherData, setWeatherData] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [weatherError, setWeatherError] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);

    function parseLocationAddress(address) {
        const parts = address.split(',').map(part => part.trim());
        const city = parts[0] || '';
        const state = parts[1] || '';
        const country = parts[2] || '';
        return { city, state, country };
    }

    const { city, state, country } = parseLocationAddress(tripDetails.location_address || '');

    useEffect(() => {
        if (tripDetails.location_address) {
            const { city, state, country } = parseLocationAddress(tripDetails.location_address);

            setWeatherLoading(true);
            const queryParams = new URLSearchParams();
            if (city) queryParams.append('city', city);
            if (state) queryParams.append('state', state);
            if (country) queryParams.append('country', country);
            queryParams.append('units', 'metric');

            fetch(`/api/weather?${queryParams.toString()}`)
                .then(response => response.ok ? response.json() : Promise.reject('Weather data fetch failed'))
                .then(data => setWeatherData(data))
                .catch(error => {
                    console.error('Error fetching weather data:', error);
                    setWeatherError('Failed to fetch weather data');
                })
                .finally(() => setWeatherLoading(false));
        }
    }, [tripDetails.location_address]);

    const getWeatherIcon = (description) => {
        if (description.includes('clear')) return <WiDaySunny size={50} color="#f39c12" />;
        if (description.includes('cloud')) return <WiCloud size={50} color="#95a5a6" />;
        if (description.includes('rain')) return <WiRain size={50} color="#3498db" />;
        if (description.includes('snow')) return <WiSnow size={50} color="#ecf0f1" />;
        if (description.includes('thunderstorm')) return <WiThunderstorm size={50} color="#e74c3c" />;
        return <WiCloud size={50} color="#7f8c8d" />;
    };

    return (
        <div className="trip-details-container">
            <div className="details-left">
{/* 
                <div className="back-button-container">
                    <Button
                        variant="text"
                        className="back-button"
                        startIcon={<ArrowBackIcon fontSize="small" />}
                        onClick={() => window.history.back()}
                    >
                        Back
                    </Button>
                </div> */}

                <div className="trip-image-container">
                    <div className="destination-overlay">
                        <p className="location">{tripDetails.location_address}</p>
                    </div>
                    <img src={tripDetails.image_url} alt="TripPic" className="trip-image-detailed" />
                </div>
            </div>

            <div className="details-right">
                <Box className="weather-info">
                    {weatherLoading ? (
                        <CircularProgress />
                    ) : weatherError ? (
                        <Typography variant="h6" color="error">
                            {weatherError}
                        </Typography>
                    ) : weatherData ? (
                        <div className="weather-display">
                            {getWeatherIcon(weatherData.weather[0].description)}
                            <div className="weather-text">
                                <Typography variant="h5" className="w-description">
                                    {weatherData.weather[0].description
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ')}
                                </Typography>
                                <Typography variant="h6" className="degrees">
                                    {weatherData.main.temp.toFixed(1)}°C
                                </Typography>
                            </div>
                        </div>
                    ) : null}
                </Box>

                <div className="suggestions-box">
                    <Button
                        variant="outlined"
                        className="suggestions-button"
                        onClick={() => setShowSuggestions(prev => !prev)}
                    >
                        {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
                    </Button>

                    {showSuggestions && (
                        <div className="suggestions-container">
                            <TripSuggestions city={city} state={state} country={country} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TripDetails;
