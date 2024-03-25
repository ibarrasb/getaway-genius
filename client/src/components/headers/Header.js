import React, { useContext } from 'react';
import { GlobalState } from '../../GlobalState';
import { Link, useLocation } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import './header.css';

function Header() {
  const state = useContext(GlobalState);
  const [isLogged, setIsLogged] = state.UserAPI.isLogged;


const theme = createTheme({
  palette: {
    primary: {
      light: '#84A98C',
      main: '#84A98C',
      dark: '#84A98C',
      contrastText: '#84A98C',
    },
    secondary: {
      light: '#84A98C',
      main: '#84A98C',
      dark: '#84A98C',
      contrastText: '#84A98C',
    },
  },
});
 

  const location = useLocation();

  const logoutUser = async () => {
    setIsLogged(false);
    await axios.get('/api/user/logout');
    localStorage.clear();
    window.location.href = '/';
  };

  const loggedRouter = () => {
    return (
      <div className="container">
      <div className="dv1">
      <span className="getaway">Getaway</span> <span className="genius">Genius</span>
  </div>
        <div className="dv2">
        <Stack spacing={2} direction="row">
        <ThemeProvider theme={theme}>
        <Link to="/search"> <Button variant="text" className="back-button"startIcon={<AddIcon />}>Add</Button></Link>
      
        <Button variant="text" component={Link} to="/" className="log-out" onClick={logoutUser}>
        Logout
      </Button>
      </ThemeProvider>
          </Stack>
        </div>
      </div>
    );
  };

  return (
    <div>
    <div>
    {!(location.pathname.startsWith('/search') || location.pathname.startsWith('/trips')) && isLogged ? loggedRouter() : ''}
  </div>
  
    </div>
  );
}

export default Header;
