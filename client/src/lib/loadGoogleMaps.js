// src/lib/loadGoogleMaps.js
let mapsLoaderPromise = null;

export async function loadGoogleMaps() {
  if (window.google?.maps) return window.google.maps;
  if (mapsLoaderPromise) return mapsLoaderPromise;

  const key = import.meta.env.VITE_FRONTENDGOOGLEKEY;
  if (!key) throw new Error("VITE_FRONTENDGOOGLEKEY is not set");

  mapsLoaderPromise = new Promise((resolve, reject) => {
    const callbackName = "__ggMapsInit";
    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      `&libraries=places&loading=async&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[callbackName];
      mapsLoaderPromise = null;
      reject(new Error("Google Maps JS failed to load"));
    };

    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
}
  
