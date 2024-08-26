import React, { useState, useEffect } from 'react';
import { WiDaySunny, WiCloud, WiRain, WiSnow, WiThunderstorm } from 'react-icons/wi'; // Importing weather icons
import { Typography, Box } from '@mui/material'; // MUI components for styling

function TripDetails({ tripDetails, formData, formatDateWithExtraDay }) {
    const [weatherData, setWeatherData] = useState(null);
    const [weatherError, setWeatherError] = useState(null);

    // Function to parse location_address
    const parseLocationAddress = (address) => {
        const parts = address.split(',').map(part => part.trim());
        const city = parts[0] || '';
        const state = parts[1] || ''; // Ensure state is handled even if empty
        const country = parts[2] || ''; // Ensure country is handled even if empty

        return { city, state, country };
    };

    useEffect(() => {
        // Ensure tripDetails.location_address exists before making an API call
        if (tripDetails.location_address) {
            const { city, state, country } = parseLocationAddress(tripDetails.location_address);

            // Build the query string dynamically based on which parameters are available
            const queryParams = new URLSearchParams();
            if (city) queryParams.append('city', city);
            if (state) queryParams.append('state', state);
            if (country) queryParams.append('country', country);
            queryParams.append('units', 'metric');

            fetch(`/api/weather?${queryParams.toString()}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Weather data fetch failed');
                    }
                    return response.json();
                })
                .then(data => setWeatherData(data))
                .catch(error => {
                    console.error('Error fetching weather data:', error);
                    setWeatherError('Failed to fetch weather data');
                });
        }
    }, [tripDetails.location_address]);

    // Function to get the appropriate weather icon
    const getWeatherIcon = (description) => {
        if (description.includes('clear')) return <WiDaySunny size={50} color="#f39c12" />;
        if (description.includes('cloud')) return <WiCloud size={50} color="#95a5a6" />;
        if (description.includes('rain')) return <WiRain size={50} color="#3498db" />;
        if (description.includes('snow')) return <WiSnow size={50} color="#ecf0f1" />;
        if (description.includes('thunderstorm')) return <WiThunderstorm size={50} color="#e74c3c" />;
        return <WiCloud size={50} color="#7f8c8d" />; // Default icon
    };

    return (
        <div className="trip-details-container">
            <div className="details-left">
                <div className="trip-image-container">
                    <div className="destination-overlay">
                        <p className="location">{tripDetails.location_address}</p>
                        <p className="dates">Trip Start: {formatDateWithExtraDay(formData.trip_start)}</p>
                        <p className="dates">Trip End: {formatDateWithExtraDay(formData.trip_end)}</p>
                    </div>
                    <img src={tripDetails.image_url} alt="TripPic" className="trip-image-detailed" />
                </div>
            </div>
            {weatherError && (
                <Typography variant="h6" color="error">
                    {weatherError}
                </Typography>
            )}
            {weatherData && !weatherError && (
                <Box className="weather-info">
                    {getWeatherIcon(weatherData.weather[0].description)}
                    <Typography variant="h4">
                        {weatherData.weather[0].description}
                    </Typography>
                    <Typography variant="h5">
                        {weatherData.main.temp.toFixed(1)}°C
                    </Typography>
                </Box>
            )}
        </div>
    );
}

export default TripDetails;
