import React from 'react';
import HotelSharpIcon from '@mui/icons-material/HotelSharp';
import FlightSharpIcon from '@mui/icons-material/FlightSharp';
import DirectionsCarFilledSharpIcon from '@mui/icons-material/DirectionsCarFilledSharp';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import Divider from '@mui/material/Divider';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Typography, Box, CircularProgress, Button } from '@mui/material';

function TripDetailedExpenses({ formData, editMode, handleExpenseChange, handleDateChange, handleSubmit, calculateTotalExpenses, numberOfPeople, handlePeopleChange, calculateCostPerPerson }) {
    return (
<div className='expense-container'>

        <form className="detailed-form" onSubmit={handleSubmit}>
   
            <div className={`expense-section ${editMode ? 'edit-mode' : ''}`} >

                <div className="expense-item">
                
                    <label className='expense-specific'>
                        <HotelSharpIcon />
                        <h3>Stay</h3>
                        <ArrowForwardIosIcon
                        className='arrow-fw'
                        onClick={() => {
                          // Your function logic here
                          console.log('Arrow icon clicked');
                          // Additional actions
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                        {editMode ? (
                            <input
                                type="text"
                                name="stay_expense"
                                value={formData.stay_expense}
                                onChange={(e) => handleExpenseChange('stay_expense', e.target.value)}
                                required
                            />
                        ) : (
                            <p>{`$${formData.stay_expense}`}</p>
                        )}
                    </label>
                    
                    <Divider /> {/* Divider enclosed */}
                </div>

                <div className="expense-item">
                    <label className='expense-specific'>
                        <FlightSharpIcon />
                        <h3>Travel</h3>
                        <ArrowForwardIosIcon
                        className='arrow-fw'
                        onClick={() => {
                          // Your function logic here
                          console.log('Arrow icon clicked');
                          // Additional actions
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                        {editMode ? (
                            <input
                                type="text"
                                name="travel_expense"
                                value={formData.travel_expense}
                                onChange={(e) => handleExpenseChange('travel_expense', e.target.value)}
                                required
                            />
                        ) : (
                            <p>{`$${formData.travel_expense}`}</p>
                        )}
                    </label>
                    <Divider /> {/* Divider enclosed */}
                </div>

                <div className="expense-item">
                    <label className='expense-specific'>
                        <DirectionsCarFilledSharpIcon />
                        <h3>Transportation</h3>
                        <ArrowForwardIosIcon
                        className='arrow-fw'
                        onClick={() => {
                          // Your function logic here
                          console.log('Arrow icon clicked');
                          // Additional actions
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                        {editMode ? (
                            <input
                                type="text"
                                name="car_expense"
                                value={formData.car_expense}
                                onChange={(e) => handleExpenseChange('car_expense', e.target.value)}
                                required
                            />
                        ) : (
                            <p>{`$${formData.car_expense}`}</p>
                        )}
                    </label>
                    <Divider /> {/* Divider enclosed */}
                </div>

                <div className="expense-item">
                    <label className='expense-specific'>
                        <LocalOfferIcon />
                        <h3>Other</h3>
                        <ArrowForwardIosIcon
                        className='arrow-fw'
                        onClick={() => {
                          // Your function logic here
                          console.log('Arrow icon clicked');
                          // Additional actions
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                        {editMode ? (
                            <input
                                type="text"
                                name="other_expense"
                                value={formData.other_expense}
                                onChange={(e) => handleExpenseChange('other_expense', e.target.value)}
                                required
                            />
                        ) : (
                            <p>{`$${formData.other_expense}`}</p>
                        )}
                    </label>
                    <Divider /> {/* Divider enclosed */}
                </div>

            </div>

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
                    <h2>Total: ${calculateTotalExpenses().toFixed(2)}</h2>
                    {formData.trip_end && new Date(formData.trip_end) >= new Date() && (
                     <label>   {/*
                            Number of People:
                            <input
                                type="number"
                                value={numberOfPeople}
                                onChange={handlePeopleChange}
                                min="1"
                            />
                            <h2>Cost per Person: ${calculateCostPerPerson()}</h2>*/}
                    </label> 
                    )} 
                </div>
            )}
            {editMode && <button className='updatetrip-button' type="submit">Update Trip</button>}
        </form>
        </div>
    );
}

export default TripDetailedExpenses;
