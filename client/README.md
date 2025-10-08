# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Google Maps Setup

This application uses Google Maps JavaScript API for location search and place autocomplete.

### Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Google Maps API key to `.env.local`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

### Required Google Cloud APIs

Enable the following APIs in your [Google Cloud Console](https://console.cloud.google.com/):
- **Maps JavaScript API**
- **Places API (New)**

### API Key Restrictions (Recommended)

For development:
- **Application restrictions**: HTTP referrers
- **Website restrictions**: `http://localhost:5173/*`

For production:
- Add your production domain to the referrer list

**Note**: Without a valid API key, the application will still run but location search will be disabled with a fallback input.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
