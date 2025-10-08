// src/utils/loadGoogleMaps.js
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export async function loadGoogleMaps() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY');

  setOptions({ apiKey, version: 'weekly', libraries: ['places'] });
  const [{ Map }, places] = await Promise.all([
    importLibrary('maps'),
    importLibrary('places'),
  ]);
  return { Map, places, google: window.google };
}
  