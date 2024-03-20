import React from 'react';

function TripDetails({ tripDetails, formData, formatDateWithExtraDay }) {
    return (
        <div className="trip-details-container">
            <div className="details-left">
                <div className="trip-image-container">
                <div className="destination-overlay">
                <p className="location">{tripDetails.location_address}</p>
                <p className="dates">Trip Start: {formatDateWithExtraDay(formData.trip_start)}</p>
                <p className="dates">Trip End: {formatDateWithExtraDay(formData.trip_end)}</p>
            </div>
                    <img src={tripDetails.image_url} alt="Trip Image" className="trip-image-detailed" />
                   
                </div>
            </div>
        
        </div>
    );
}

export default TripDetails;
