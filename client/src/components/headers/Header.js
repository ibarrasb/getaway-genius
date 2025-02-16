import React, { useContext, useState, useEffect } from 'react';
import { GlobalState } from '../../GlobalState';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { Tabs, Tab } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import './header.css';
import '../mainpages/home/styles.css';

function Header() {
  const state = useContext(GlobalState);
  const [isLogged, setIsLogged] = state.UserAPI.isLogged;
  const [userID] = state.UserAPI.userID;
  const [value, setValue] = useState(0); // State for active tab

  const theme = createTheme({
    palette: {
      primary: {
        light: '#14213D',
        main: '#14213D',
        dark: '#14213D',
        contrastText: '#14213D',
      },
      secondary: {
        light: '#14213D',
        main: '#14213D',
        dark: '#14213D',
        contrastText: '#14213D',
      },
    },
  });

  const location = useLocation();
  const navigate = useNavigate();

  const logoutUser = async () => {
    setIsLogged(false);
    await axios.get('/api/user/logout');
    localStorage.clear();
    window.location.href = '/';
  };

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
    switch (newValue) {
      // case 0:
      //   navigate('/discover');
      //   break;
      case 0:
        navigate('/home');
        break;
      case 1:
        navigate('/favorites');
        break;
      case 2: 
      navigate('/previous-trips');
        break;
      default:
        navigate('/home');
    }
  };

  // useEffect to sync the tab value with the current route
  useEffect(() => {
    switch (location.pathname) {
      // case '/discover':
      //   setValue(0);
      //   break;
      case '/home':
        setValue(0);
        break;
      case '/favorites':
        setValue(1);
        break;
      case '/previous-trips':
        setValue(2);
        break;
      default:
        setValue(0);
    }
  }, [location.pathname]); // Runs whenever location.pathname changes

  const loggedRouter = () => {
    return (
      <div>
        <div className="container">
          <button className="dv1" onClick={() => navigate('/home')}>
            <span className="getaway">Getaway</span>
            <span className="genius">Genius</span>
          </button>
          <div className="dv2">
            <Stack spacing={2} direction="row">
              <ThemeProvider theme={theme}>
                <Link to="/about">
                  <Button variant="text" className="header-button">
                    About
                  </Button>
                </Link>
                <Link to={`/profile/${userID}`}>
                  <Button variant="text" className="header-button">
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="text"
                  component={Link}
                  to="/"
                  className="header-button"
                  onClick={logoutUser}
                >
                  Logout
                </Button>
              </ThemeProvider>
            </Stack>
          </div>
        </div>
        <div className="center-button">
          <ThemeProvider theme={theme}>
          <Tabs
  value={value}
  onChange={handleTabChange}
  aria-label="navigation tabs"
  sx={{ gap: '8px' }} // Adjust spacing between the tabs
  //<Tab label="Discover" sx={{ minWidth: '80px' }} />
>
  
  <Tab label="Trips" sx={{ minWidth: '80px' }} />
  <Tab label="Wishlists" sx={{ minWidth: '80px' }} />
  <Tab label="Past" sx={{ minWidth: '80px' }} />
</Tabs>

          </ThemeProvider>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div>
        {!( location.pathname.startsWith('/trips') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/about') || location.pathname.startsWith('/wishlist-detail')) &&
        isLogged
          ? loggedRouter()
          : ''}
      </div>
    </div>
  );
}

export default Header;
