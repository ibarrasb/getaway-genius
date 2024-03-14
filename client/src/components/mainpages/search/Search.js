import React, { useState, useEffect } from 'react';
import './styles.css';
import Add from '../add/Add';
import Autocomplete from "react-google-autocomplete";

const Search = () => {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placePhotos, setPlacePhotos] = useState([]);
  const [photoURL, setPhotoURL] = useState([]);


  // const fetchData = async (placeid) => {
  //   try {
  //     const response = await fetch(`/api/places-details?placeid=${placeid}`);
  //     if (!response.ok) {
  //       throw new Error('Network response was not ok');
  //     }
  //     const data = await response.json();

  //     console.log(data.results);
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // };

 

  
// Function to retrieve photos for a given place ID 
const getPlacePhotos = (placeId, apiKey) => {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,photos&key=${apiKey}`;
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      const photos = data.photos || [];
      const photoPromises = photos.map(photo => {
        const photoReference = photo.name;
        console.log("Data Reference: "+photoReference)
        return getPhoto(photoReference, apiKey);
      });
      return Promise.all(photoPromises);

    })
    .then(photos => {
      setPlacePhotos(photos);
    })
    .catch(error => console.error('Error:', error));
};


 // Function to retrieve photo using photo reference
  const getPhoto = (photoReference, apiKey) => {
    let params = 'maxHeightPx=400&maxWidthPx=400'
    const url = `https://places.googleapis.com/v1/${photoReference}/media?key=${apiKey}&${params}`;
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        console.log("Photos URL: "+response.url)
        return response.url;
       
      })
      .then(blob => {
      
        setPhotoURL(blob)
        
      });
  };

  console.log("HERE IT IS" + photoURL)

  // Call getPlacePhotos when selectedPlace changes
  useEffect(() => {
    if (selectedPlace) {
      const placeId = selectedPlace.place_id;
      const apiKey = 'AIzaSyCCOkokPBi1Gv9C1CXTBFH1p-cKfSzJ0-I';
      getPlacePhotos(placeId, apiKey);
    }
  }, [selectedPlace]);

  // Handle place selection
  const handlePlaceSelected = (place) => {
    setSelectedPlace(place);
  };

  return (
    <div className="container-search">
      <h1>Where are you going?</h1>
      <div className="search-bar-container">
        <Autocomplete
          className="custom-autocomplete"
          onPlaceSelected={handlePlaceSelected}
        />
      </div>
      <Add selectedPlace={selectedPlace} placePhotos={placePhotos} />
    </div>
  );
};

export default Search;
