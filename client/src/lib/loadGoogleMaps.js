// src/utils/loadGoogleMaps.js
export async function loadGoogleMaps() {
    if (!window.google || !window.google.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_FRONTENDGOOGLEKEY}&libraries=places`;
      script.async = true;
      script.defer = true;
  
      document.head.appendChild(script);
  
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error("Google Maps JS failed to load"));
      });
    }
  }
  