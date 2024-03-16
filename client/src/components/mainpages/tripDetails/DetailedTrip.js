import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Axios from 'axios';

function DetailedTrip(props) {
    const params = useParams();
    // const { match } = props;
    // console.log(match)
    const tripId = params.id; // Accessing match.params
    console.log(tripId)
  const [tripDetails, setTripDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const res = await Axios.get(`/api/trips/getaway/${tripId}`);
        console.log("RESPONSE" + res)
        setTripDetails(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trip details:', error);
        setLoading(false);
      }
    };

    console.log("DETAILED TRIP" + JSON.stringify(tripDetails))

    fetchTripDetails();
  }, [tripId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!tripDetails) {
    return <div>Trip not found</div>;
  }

  return (
    <div>
      <h2>Trip Details</h2>
      <p>Trip ID: {tripDetails._id}</p>
      {/* Render other trip details here */}
    </div>
  );
}

export default DetailedTrip;
