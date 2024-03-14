import React, { useState } from 'react';
import './styles.css';
import Add from '../add/Add';
import Autocomplete from "react-google-autocomplete";

const Search = () => {
  // Define state to manage the selected place
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Define the callback function to handle the selected place
  const handlePlaceSelected = (place) => {
    console.log("Selected place:", place);
    setSelectedPlace(place); // Update the selectedPlace state with the selected place
    // Call any other function or perform actions with the selected place here
  
  };


  return (
    <div className="container-search">
      <h1>Search</h1>
      <div className="search-bar-container">
        {/* Pass the handlePlaceSelected function to the onPlaceSelected prop */}
        <Autocomplete
          onPlaceSelected={handlePlaceSelected}
        />
       
      </div>
      {/* Display the selected place */}
      {selectedPlace && (
        <div>
          Selected place: {selectedPlace.formatted_address}
        </div>
      )}
    </div>
  );
};

export default Search;
