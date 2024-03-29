import React from 'react';
import HotelSharpIcon from '@mui/icons-material/HotelSharp';
import FlightSharpIcon from '@mui/icons-material/FlightSharp';
import DirectionsCarFilledSharpIcon from '@mui/icons-material/DirectionsCarFilledSharp';

function TripForm({ formData, editMode, handleExpenseChange, handleDateChange, handleSubmit, calculateTotalExpenses, numberOfPeople, handlePeopleChange, calculateCostPerPerson }) {
    return (
        <form className="detailed-form" onSubmit={handleSubmit}>
        <div className={`expense-section ${editMode ? 'edit-mode' : ''}`} >
            <label className='expense-specific'>
                <HotelSharpIcon />
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
            <label className='expense-specific'>
                <FlightSharpIcon />
                {editMode ? (
                    <input
                        type="text"
                        name="travel_expense"
                        value={formData.travel_expense}
                        onChange={(e) => handleExpenseChange('travel_expense', e.target.value)}
                        required
                    />
                ) :(
                    <p>{`$${formData.travel_expense}`}</p>
                )}
            </label>
            <label className='expense-specific'>
                <DirectionsCarFilledSharpIcon />
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
                    {formData.trip_end && new Date(formData.trip_end) >= new Date() && ( // Check if trip_end is not in the past
                  
                    <label>
                    Number of People:
                    <input
                        type="number"
                        value={numberOfPeople}
                        onChange={handlePeopleChange}
                        min="1"
                    />
                    <h2>Cost per Person: ${calculateCostPerPerson()}</h2>
                </label>                
                )}   
                </div>
            )}
            {editMode && <button className='updatetrip-button' type="submit">Update Trip</button>}
        </form>
    );
}

export default TripForm;
