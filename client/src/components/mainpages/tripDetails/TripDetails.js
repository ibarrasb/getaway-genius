import React, { useState, useEffect } from 'react';
import { WiDaySunny, WiCloud, WiRain, WiSnow, WiThunderstorm } from 'react-icons/wi';
import { Typography, Box, CircularProgress } from '@mui/material';
import TripSuggestions from './TripSuggestions';

// Trip Details for location, dates, weather, places
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

    const formatModernDate = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const startMonth = start.toLocaleString('en-US', { month: 'short' });
        const startDay = start.getDate();
        const endDay = end.getDate();
        const endYear = end.getFullYear();

        if (start.getMonth() === end.getMonth()) {
            return `${startMonth} ${startDay + 1} - ${endDay + 1}, ${endYear}`;
        } else {
            const endMonth = end.toLocaleString('en-US', { month: 'short' });
            return `${startMonth} ${startDay + 1} - ${endMonth} ${endDay + 1}, ${endYear}`;
        }
    };

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
                <div className="trip-image-container">
                    <div className="destination-overlay">
                        <p className="location">{tripDetails.location_address}</p>
                        <div className="trip-dates-modern">
                            <p className="date-range">
                                {formatModernDate(formData.trip_start, formData.trip_end)}
                            </p>
                        </div>
                    </div>
                    <img src={tripDetails.image_url} alt="TripPic" className="trip-image-detailed" />
                </div>
            </div>

            <div className="details-right">
                {/* Weather Section */}
                <Box className="weather-info">
                    {weatherLoading ? (
                        <CircularProgress />
                    ) : weatherError ? (
                        <Typography variant="h6" color="error">
                            {weatherError}
                        </Typography>
                    ) : weatherData ? (
                        <>
                            {getWeatherIcon(weatherData.weather[0].description)}
                            <Typography variant="h4" className='w-description'>
                                {weatherData.weather[0].description.split(' ')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ')}
                            </Typography>
                            <Typography variant="h5" className='degrees'>
                                {weatherData.main.temp.toFixed(1)}°C
                            </Typography>
                        </>
                    ) : null}
                </Box>

                {/* Fun Places Section */}
                <button onClick={() => setShowSuggestions(prev => !prev)}>
                    {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
                </button>

                {showSuggestions && (
                    <TripSuggestions city={city} state={state} country={country} />
                )}
            </div>
        </div>
    );
}

export default TripDetails;
