import React, { useState, useEffect } from 'react';
import { Typography, Box, CircularProgress } from '@mui/material';

function TripSuggestions({ city, state, country }) {
    const [funPlaces, setFunPlaces] = useState(null);
    const [funPlacesLoading, setFunPlacesLoading] = useState(false);

    useEffect(() => {
        if (!city || !state || !country) return;

        setFunPlacesLoading(true);
        const location = `${city}, ${state}, ${country}`;
        
        fetch('/api/chatgpt/fun-places', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ location }),
        })
        .then(response => response.ok ? response.json() : Promise.reject('Fun places fetch failed'))
        .then(data => setFunPlaces(data.funPlaces))
        .catch(error => console.error('Error fetching fun places:', error))
        .finally(() => setFunPlacesLoading(false));
    }, [city, state, country]); // ✅ useEffect dependency array

    return (
        <Box className="fun-places">
            {funPlacesLoading ? (
                <CircularProgress />
            ) : funPlaces ? (
                <>
                    <Typography variant="h6">Fun Places to Visit:</Typography>
                    <div>
                        {funPlaces.split('\n').map((place, index) => (
                            <div key={index}>{place}</div>
                        ))}
                    </div>
                </>
            ) : null}
        </Box>
    );
}

export default TripSuggestions;
