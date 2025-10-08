
Getaway Genius

# https://getawaygenius-app-4fd57cb7099c.herokuapp.com/

# Getaway Genius  
  
A full-stack travel planning application that helps users create, manage, and organize budget-friendly trips with AI-powered suggestions, expense tracking, and wishlist functionality [0-cite-0](#0-cite-0) .  
  
## Features  
  
- **Trip Planning & Management**: Create and organize travel itineraries with detailed cost breakdowns [0-cite-1](#0-cite-1)   
- **Wishlist System**: Save favorite destinations and organize trips into custom lists [0-cite-2](#0-cite-2)   
- **Budget Tracking**: Compare total costs across flights, accommodations, and other expenses [0-cite-3](#0-cite-3)   
- **Weather Integration**: Get weather insights for your destinations [0-cite-4](#0-cite-4)   
- **User Authentication**: Secure login and registration system [0-cite-5](#0-cite-5)   
  
## Technology Stack  
  
### Frontend  
- **React** 19.1.0 - UI framework [0-cite-6](#0-cite-6)   
- **Vite** 7.0.4 - Build tool and development server [0-cite-7](#0-cite-7)   
- **React Router DOM** 7.7.1 - Client-side routing [0-cite-8](#0-cite-8)   
- **TailwindCSS** 4.1.11 - Styling framework [0-cite-9](#0-cite-9)   
- **Axios** 1.11.0 - HTTP client [0-cite-10](#0-cite-10)   
  
### Backend  
- **Express.js** 4.18.2 - Web framework [0-cite-11](#0-cite-11)   
- **MongoDB** with Mongoose 8.5.3 - Database [0-cite-12](#0-cite-12)   
- **JWT** 9.0.2 - Authentication [0-cite-13](#0-cite-13)   
- **bcrypt** 5.1.1 - Password hashing [0-cite-14](#0-cite-14)   
  
### External APIs  
- **OpenAI** 4.74.0 - AI trip suggestions [0-cite-15](#0-cite-15)   
- **Google Places API** - Location services and photos [0-cite-16](#0-cite-16)   
- **OpenWeather API** - Weather data <cite />  
  
## Installation & Setup  
  
### Prerequisites  
- Node.js 22.x (preferred) or 23.x (supported) - CI runs on 22.x for stability
- npm 10.x or higher
- MongoDB database  
  
### Environment Variables  
Create a `.env` file in the root directory with:  
```  
MONGODB_URL=your_mongodb_connection_string  
ACCESS_TOKEN_SECRET=your_jwt_access_secret  
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret  
CLIENT_ORIGIN=http://localhost:3000  
```  
  
### Installation  
```bash  
# Install all dependencies (client + server)  
npm run install-all  
  
# Or install separately  
npm run server-install  
npm run client-install  
```  
  
## Development  
  
### Available Scripts  
  
| Command | Description |  
|---------|-------------|  
| `npm run dev` | Run both client and server concurrently [0-cite-19](#0-cite-19)  |  
| `npm run server` | Run backend with nodemon [0-cite-20](#0-cite-20)  |  
| `npm run client` | Run frontend development server [0-cite-21](#0-cite-21)  |  
| `npm start` | Start production server [0-cite-22](#0-cite-22)  |  
  
### Development Workflow  
1. Start the development environment: `npm run dev`  
2. Frontend runs on `http://localhost:5173` (Vite default)  
3. Backend runs on `http://localhost:5001` [0-cite-23](#0-cite-23)   
  
## Architecture  
  
### Server Configuration  
The Express server handles both API routes and serves the React build in production [0-cite-24](#0-cite-24) :  
  
- `/api` - External service routes  
- `/api/trips` - Trip management [0-cite-25](#0-cite-25)   
- `/api/user` - User authentication  
- `/api/wishlist` - Wishlist operations [0-cite-26](#0-cite-26)   
  
### Frontend Structure  
The React application uses a component-based architecture with global state management [0-cite-27](#0-cite-27) :  
  
- **Pages**: Landing, About, Home, Profile, Trip Details  
- **Components**: Header, Footer, Modals, Forms  
- **State**: Global context provider for user and trip data  
  
## Deployment  
  
### Production Build  
```bash  
# Build client for production  
cd client && npm run build  
  
# Start production server  
npm start  
```  
  
### Environment Setup  
The application automatically detects production environment and serves static files [0-cite-28](#0-cite-28) . For deployment platforms like Heroku or Render, use the `heroku-postbuild` script [0-cite-29](#0-cite-29) .  
  
## API Endpoints  
  
### Trips  
- `GET /api/trips/getaway-trip` - Get user trips  
- `POST /api/trips/getaway-trip` - Create new trip  
- `DELETE /api/trips/getaway/:id` - Delete trip  
- `PUT /api/trips/getaway/:id` - Update trip  
  
### Wishlists  
- `POST /api/wishlist/createlist` - Create wishlist  
- `GET /api/wishlist/getlists` - Get user wishlists  
- `POST /api/wishlist/addtrip/:id` - Add trip to wishlist  
  
## Contributing  
  
1. Fork the repository  
2. Create a feature branch  
3. Make your changes  
4. Run tests and ensure code quality  
5. Submit a pull request  
  
## License  
  
ISC License [0-cite-30](#0-cite-30)   
  
## Notes  
  
The application uses ES modules throughout both client and server code [0-cite-31](#0-cite-31) [0-cite-32](#0-cite-32) . The development setup uses `concurrently` to run both frontend and backend simultaneously, while production serves the built React app through the Express server. The codebase includes both older Material-UI components and newer Tailwind-styled components, indicating ongoing modernization efforts.    
