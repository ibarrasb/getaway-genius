import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../../GlobalState';
import { useNavigate } from 'react-router-dom';
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
// import Button from '@mui/material/Button';
import './styles.css';

function FavoriteTrips() {
  const state = useContext(GlobalState);
  const [email] = state.UserAPI.email;
  const [isLogged] = state.UserAPI.isLogged;
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wishlistsResponse = await Axios.get('/api/wishlist/getlists', {
          params: { email: email }
        });
        if (wishlistsResponse.status === 200) {
          setWishlists(wishlistsResponse.data);
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
      const response = await Axios.get(`/api/wishlist/spec-wishlist/${wishlistId}`);
      const { trips } = response.data;

      const updatePromises = trips.map(trip =>
        Axios.put(`/api/trips/getaway/${trip._id}`, { isFavorite: false })
      );

      await Promise.all(updatePromises);
      await Axios.delete(`/api/wishlist/removewishlist/${wishlistId}`);

      setWishlists(prev => prev.filter(w => w._id !== wishlistId));
    } catch (error) {
      console.error('Error deleting wishlist:', error);
    }
  };

  if (!isLogged) return <p>Please log in to view your trips.</p>;
  if (loading) return <div>Loading...</div>;

  const wishlistsWithTrips = wishlists.filter(w => w.trips.length > 0);
  const wishlistsWithoutTrips = wishlists.filter(w => w.trips.length === 0);

  return (
    <div className="home-container">
      <div className="wishlists-container">
        {wishlistsWithTrips.length > 0 && (
          <div className="wishlists-with-trips">
            {wishlistsWithTrips.map(wishlist => (
              <Card
                key={wishlist._id}
                className="wishlist-card"
                onClick={() => handleClick(wishlist._id)}
                sx={{ cursor: 'pointer', mb: 2 }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={wishlist.trips[0]?.image_url || "https://source.unsplash.com/random/1600x900/?nature,water"}
                  alt="Trip Image"
                />
                <CardContent className='card-content-wishlist'>
                  <div>
                    <Typography variant="h6">{wishlist.list_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {wishlist.trips.length} trips
                    </Typography>
                  </div>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(wishlist._id);
                    }}
                    className="delete-button-wishlist"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {wishlistsWithoutTrips.length > 0 && (
          <div className="wishlists-without-trips">
            {wishlistsWithoutTrips.map(wishlist => (
              <List key={wishlist._id} className="wishlist-list">
                <ListItem onClick={() => handleClick(wishlist._id)} button>
                  <ListItemText
                    primary={wishlist.list_name}
                    secondary="No trips available"
                  />
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation();
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
          <p className='dont-have'>You don't have any wishlists.</p>
        )}
      </div>
    </div>
  );
}

export default FavoriteTrips;
