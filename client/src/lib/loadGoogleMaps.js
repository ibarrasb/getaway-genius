// src/utils/loadGoogleMaps.js
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export async function loadGoogleMaps() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { Map: null, places: null, google: null, disabled: true };
  }
  setOptions({ apiKey, version: 'weekly', libraries: ['places'] });
  const [{ Map }, places] = await Promise.all([
    importLibrary('maps'),
    importLibrary('places'),
  ]);
  return { Map, places, google: window.google, disabled: false };
}
  