import React from 'react';
import WishlistTrips from './WishlistTrips'
import ListedExploreTrips from './ListedExploreTrips';
import { Link } from 'react-router-dom';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import { createTheme, ThemeProvider } from '@mui/material/styles';

function ExploreTrips() {

    // Define custom theme
const theme = createTheme({
    palette: {
      primary: {
        main: '#14213D', // Custom color
      },
    },
  });

    return (
        <div>
            <ListedExploreTrips/>
            <WishlistTrips/> 

               {/* Floating Action Button */}
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