import React, { useState } from 'react';
import { Button, Stack, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import './discover.css';

function Discover() {
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedDates, setSelectedDates] = useState(''); // Holds "Anytime" or custom date range
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [priceRange, setPriceRange] = useState('');
    const [step, setStep] = useState(1);

    const locations = [
        'Anywhere', 'United States', 'Europe', 'Mexico', 'Canada',
        'South America', 'Italy', 'Caribbean',
    ];

    const handleLocationChange = (event) => {
        setSelectedLocation(event.target.value);
        setStep(2); // Move to the next step
    };

    const handleDateOptionClick = (option) => {
        if (option === 'Anytime') {
            setSelectedDates('Anytime');
            setStep(3); // Move to price selection
        } else {
            setSelectedDates('Custom'); // User chooses a custom date
        }
    };

    const handleConfirmDates = () => {
        if (startDate && endDate) {
            setSelectedDates(`${startDate} to ${endDate}`);
            setStep(3); // Move to price selection
        }
    };

    const handlePriceChange = (value) => {
        setPriceRange(value);
    };

    const renderDateSelector = () => (
        <div className="custom-calendar">
            <div className="calendar-header">
            
            </div>
            <div className="calendar-body">
                <div className="calendar-date">
                    <input
                        type="date"
                        value={startDate || ''}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Start Date"
                    />
                </div>
                <div className="calendar-date">
                    <input
                        type="date"
                        value={endDate || ''}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="End Date"
                    />
                </div>
                <Button onClick={() => setStartDate(null)}>Clear</Button>
                <Button
                    variant="contained"
                    onClick={handleConfirmDates}
                    disabled={!startDate || !endDate}
                >
                    Confirm
                </Button>
            </div>
        </div>
    );

    return (
        <div className="discover-container">
            <h2>Discover Your Next Getaway</h2>

            {/* Step 1: Location */}
            {step >= 1 && (
                <div className="filter-section">
                    <h2>Select a Location</h2>
                    <FormControl fullWidth>
                        <InputLabel>Location</InputLabel>
                        <Select
                            value={selectedLocation}
                            onChange={handleLocationChange}
                            label="Location"
                        >
                            {locations.map((location) => (
                                <MenuItem key={location} value={location}>
                                    {location}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </div>
            )}

            {/* Step 2: Dates */}
            {step >= 2 && (
                <div className="filter-section">
                    <h2>Select Dates</h2>
                    <Stack spacing={2} direction="row">
                        <Button
                            onClick={() => handleDateOptionClick('Anytime')}
                            variant={selectedDates === 'Anytime' ? 'contained' : 'outlined'}
                        >
                            Anytime
                        </Button>
                        <Button
                            onClick={() => handleDateOptionClick('Custom')}
                            variant={selectedDates === 'Custom' ? 'contained' : 'outlined'}
                        >
                            Custom Dates
                        </Button>
                    </Stack>
                    {selectedDates === 'Custom' && renderDateSelector()}
                </div>
            )}

            {/* Step 3: Price */}
            {step >= 3 && (
                <div className="filter-section">
                    <h2>Select Price Range</h2>
                    <Stack spacing={2} direction="row">
                        {['$', '$$', '$$$'].map((price) => (
                            <Button
                                key={price}
                                onClick={() => handlePriceChange(price)}
                                variant={priceRange === price ? 'contained' : 'outlined'}
                            >
                                {price}
                            </Button>
                        ))}
                    </Stack>
                </div>
            )}
        </div>
    );
}

export default Discover;
