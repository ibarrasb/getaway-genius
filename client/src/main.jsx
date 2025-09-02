import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { loadGoogleMaps } from '../src/lib/loadGoogleMaps';
import axios from 'axios';

axios.defaults.withCredentials = true;

loadGoogleMaps().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}).catch(err => {
  console.error('Google Maps failed to load:', err);
});
