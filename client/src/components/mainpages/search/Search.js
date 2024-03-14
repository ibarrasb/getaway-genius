import React, { useState } from 'react';
import './styles.css';
import Add from '../add/Add';
import Autocomplete from "react-google-autocomplete";

const Search = () => {
  // Define state to manage the selected place and the search bar value
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  // Define the callback function to handle the selected place
  const handlePlaceSelected = (place) => {
    console.log("Selected place:", place);
    setSelectedPlace(place); // Update the selectedPlace state with the selected place
    setSearchValue(''); // Reset the search bar value to an empty string
  };

  console.log("after: " + JSON.stringify(selectedPlace));

  return (
    <div className="container-search">
      <h1>Where are you going?</h1>
      <div className="search-bar-container">
        {/* Pass the handlePlaceSelected function to the onPlaceSelected prop */}
        <Autocomplete
        className="custom-autocomplete"
          onPlaceSelected={handlePlaceSelected}
          value={searchValue} // Bind the value of the input field to the searchValue state
          onChange={(e) => setSearchValue(e.target.value)} // Update the searchValue state when the input changes
        />
      </div>
      {/* Render the Add component with the selectedPlace prop */}
      <Add selectedPlace={selectedPlace} />
    </div>
  );
};

export default Search;

