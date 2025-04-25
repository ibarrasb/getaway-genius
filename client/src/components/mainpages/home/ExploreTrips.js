import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Axios from 'axios';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import Home from './MyTrips';
import './styles.css'; // Assuming this CSS file contains your styles

// Define custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#14213D', // Custom color
    },
  },
});

function ExploreTrips() {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [isLogged] = state.UserAPI.isLogged;
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); // Hook for programmatic navigation

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wishlistsResponse = await Axios.get('/api/wishlist/getlists', {
          params: { email: email }
        });
        if (wishlistsResponse.status === 200) {
          setWishlists(wishlistsResponse.data);
        } else {
          throw new Error('Network response was not ok');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching wishlists:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [email]);

  const handleClick = (wishlistId) => {
    navigate(`/wishlist-detail/${wishlistId}`);
  };

  const handleDelete = async (wishlistId) => {
    try {
      // Fetch the specific wishlist to get its trips
      const response = await Axios.get(`/api/wishlist/spec-wishlist/${wishlistId}`);
      const { trips } = response.data; // Assuming the response contains a trips array
      console.log(response)
      // Update the isFavorite status for each trip in the wishlist to false
      const updatePromises = trips.map(trip =>
        Axios.put(`/api/trips/getaway/${trip._id}`, { isFavorite: false })
      );
  
      // Wait for all the updates to complete
      await Promise.all(updatePromises);
  
      // Delete the wishlist after updating all trips
      await Axios.delete(`/api/wishlist/removewishlist/${wishlistId}`);
  
      // Update state to remove the wishlist from the list
      setWishlists(prevWishlists => prevWishlists.filter(wishlist => wishlist._id !== wishlistId));
    } catch (error) {
      console.error('Error deleting wishlist:', error);
    }
  };
  

  if (!isLogged) {
    return (
      <div>
        <p>Please log in to view your trips.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  // Separate wishlists into those with trips and those without
  const wishlistsWithTrips = wishlists.filter(wishlist => wishlist.trips.length > 0);
  const wishlistsWithoutTrips = wishlists.filter(wishlist => wishlist.trips.length === 0);

  return (
    <div className="home-container">
    <Home/>
     
      <div className="wishlists-container">
        {wishlistsWithTrips.length > 0 && (
          <div className="wishlists-with-trips">
            {wishlistsWithTrips.map(wishlist => (
              <Card
                key={wishlist._id}
                className="wishlist-card"
                onClick={() => handleClick(wishlist._id)} // Handle card click
                sx={{ cursor: 'pointer', mb: 2 }} // Add margin-bottom for spacing
              >
                {wishlist.trips.length > 0 && wishlist.trips[0].image_url ? (
                  <CardMedia
                    component="img"
                    height="140"
                    image={wishlist.trips[0].image_url}
                    alt="Trip Image"
                  />
                ) : (
                  <CardMedia
                    component="img"
                    height="140"
                    image="https://source.unsplash.com/random/1600x900/?nature,water" // Creative fallback image
                    alt="Creative Fallback Image"
                  />
                )}
                <CardContent className='card-content-wishlist'>
                <div>
                <Typography variant="h6" component="div">
                    {wishlist.list_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {wishlist.trips.length} trips
                  </Typography>
                </div>
                  
                
                    <DeleteIcon edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent click event from bubbling up to the card
                      handleDelete(wishlist._id);
                    }}
                    className="delete-button-wishlist"/>
                  
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {wishlistsWithoutTrips.length > 0 && (
          <div className="wishlists-without-trips">
            {wishlistsWithoutTrips.map(wishlist => (
              <List key={wishlist._id} className="wishlist-list">
                <ListItem button onClick={() => handleClick(wishlist._id)}> {/* Use the button prop here */}
                  <ListItemText
                    primary={wishlist.list_name}
                    secondary="No trips available"
                  />
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent click event from bubbling up to the list item
                      handleDelete(wishlist._id);
                    }}
                    className="delete-button"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              </List>
            ))}
          </div>
        )}

        {wishlists.length === 0 && (
          <p className='dont-have'>Start planning!</p>
        )}
      </div>

      <ThemeProvider theme={theme}>
        <div className="fab-container">
          <Link to="/search" style={{ textDecoration: 'none' }}>
          <Fab
              color="primary"
              aria-label="add"
              variant="extended"
              sx={{
                color: '#FFFFFF', // Set text color to white
              }}
            >
            <AddIcon style={{ marginRight: 8 }} />
            Create
          </Fab>

          </Link>
        </div>
      </ThemeProvider>
    </div>
  );
}

export default ExploreTrips;
