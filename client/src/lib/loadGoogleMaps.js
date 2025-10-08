// src/utils/loadGoogleMaps.js
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

export async function loadGoogleMaps() {
  if (!window.google || !window.google.maps) {
    setOptions({
      apiKey: import.meta.env.VITE_FRONTENDGOOGLEKEY,
      version: "weekly"
    });

    await importLibrary("places");
  }
}
  