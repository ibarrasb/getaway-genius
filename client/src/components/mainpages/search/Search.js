import React, { useState, useEffect } from 'react';
import './styles.css';
import Add from '../add/Add';
import Autocomplete from "react-google-autocomplete";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

const Search = () => {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [photoURL, setPhotoURL] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const getPlacePhotos = async (placeid) => {
    try {
        const response = await fetch(`/api/places-details?placeid=${placeid}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data);
        
        // Extract photos data from the response
        const photos = data.photos || [];
        if (photos.length === 0) {
          // No photos found
          console.log('No photos found for this place.');
          return null;
        }
        
        // Generate a random index within the range of the array length
        const randomIndex = Math.floor(Math.random() * photos.length);
        
        const randomPhotoReference = photos[randomIndex].name;
        console.log("Random Photo Reference: " + randomPhotoReference);
        
        // Fetch the photo for the first reference
        return getPhoto(randomPhotoReference); // Assuming apiKey is defined somewhere
        
        // Return the fetched data
    } catch (error) {
      console.error('Error:', error);
      throw error; // Re-throw the error to handle it outside
    }
  };
  
  const getPhoto = async (photoreference) => {
    try{
      const response = await fetch(`/api/places-pics?photoreference=${photoreference}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log(data);
      setPhotoURL(data.photoUri)
    }
    catch (error) {
      console.error('Error:', error);
      throw error; // Re-throw the error to handle it outside
    }

  };

  // Call getPlacePhotos when selectedPlace changes
  useEffect(() => {
    if (selectedPlace) {
      const placeId = selectedPlace.place_id;
      
  
      getPlacePhotos(placeId);
    }
  }, [selectedPlace]);

  // Handle place selection
  const handlePlaceSelected = (place) => {
    setSelectedPlace(place);
    setSearchValue('');
  };

  function checkSelectedPlace(){
    if(selectedPlace){
      return (
        <Add selectedPlace={selectedPlace} photoURL={photoURL} /> 
      )
    }
    else {
      return (
        <div></div>
      )
    }
  }
  

  return (

    <div>

    <Link to="/home"> <Button variant="text" className="back-button"startIcon={<ArrowBackIcon />}>Back</Button></Link>

    <div className="container-search">
    <div className="contain-search">
      <h1 className='wyg-text'>Where are you going?</h1>
      <div className="search-bar-container">
      <Autocomplete
        className="custom-autocomplete"
        onPlaceSelected={handlePlaceSelected}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      
      />
 
      </div>
      </div>
      {
        checkSelectedPlace()
      }
    </div>
    </div>
  );
};

export default Search;
