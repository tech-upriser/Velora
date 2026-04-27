# Velora

Velora is a full-stack travel planning app that helps users discover places in a city, plan optimized travel routes, save trips, view analytics, check weather, and access emergency assistance while travelling.

The project contains an Express/MongoDB backend and a React/Vite frontend.

## Features

- User authentication with JWT, OTP verification, password reset, and change password.
- Google Places based tourist destination discovery.
- Weather data using OpenWeatherMap.
- Route optimization using a nearest-neighbor TSP heuristic.
- Google Distance Matrix integration for real driving distances and durations.
- Haversine fallback when Distance Matrix is unavailable.
- Route map embeds and Google Maps directions links.
- Saved trips with route details, selected places, dates, and total distance.
- Trip duplication, update, delete, search, and date filtering.
- User analytics for saved travel activity.
- Emergency page with browser geolocation.
- Nearby hospitals, police stations, and fire stations using Google Places Nearby Search.
- National emergency numbers and SOS countdown flow.
- Email service for OTPs, welcome emails, login alerts, trip confirmations, trip reminders, and password reset.
- Daily cron job for trip reminder emails.

## Tech Stack

### Backend

- Node.js
- Express
- MongoDB and Mongoose
- JWT authentication
- Nodemailer
- node-cron
- Google Places API
- Google Distance Matrix API
- Google Maps Embed API
- OpenWeatherMap API

### Frontend

- React
- Vite
- React Router
- Firebase auth integration
- Axios
- Recharts

## Project Structure

```txt
Velora/
  config/                 MongoDB connection
  controllers/            Backend request handlers
  jobs/                   Scheduled background jobs
  middleware/             Auth middleware
  models/                 Mongoose schemas
  routes/                 Express route definitions
  services/               Google, weather, and email services
  utils/                  TSP helper functions
  travel-frontend/        React/Vite frontend app
  server.js               Backend entry point
  setup.js                Optional environment setup helper
```

## Important Files

- `server.js` mounts backend middleware, routes, cron jobs, and server startup.
- `routes/routeRoutes.js` defines `POST /api/route/optimize`.
- `controllers/routeController.js` coordinates route optimization.
- `utils/tsp.js` contains nearest-neighbor TSP logic and Haversine fallback.
- `services/googleApi.js` calls Google Places and Distance Matrix APIs.
- `routes/sosRoutes.js` defines SOS and nearby emergency endpoints.
- `controllers/sosController.js` handles nearby emergency services and SOS alert flow.
- `services/emailService.js` contains Nodemailer email templates and send helper.
- `jobs/notificationJob.js` sends scheduled trip reminders.
- `travel-frontend/src/pages/trip.jsx` is the main trip planning experience.
- `travel-frontend/src/pages/OptimizedRoute.jsx` displays optimized routes.
- `travel-frontend/src/pages/Emergency.jsx` powers emergency assistance.

For a focused explanation of routes, TSP, SOS, and emails, see:

```txt
ROUTES_SOS_EMAIL_PREP.md
```

## Prerequisites

- Node.js and npm
- MongoDB Atlas or local MongoDB connection string
- Google Cloud API key with required APIs enabled
- OpenWeatherMap API key
- Gmail app password if email sending is required

Google APIs used by the project:

- Places API
- Distance Matrix API
- Maps Embed API
- Directions-related map URLs

## Environment Variables

Create a root `.env` file for the backend:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
JWT_SECRET=<your-secret>
GOOGLE_API_KEY=<your-google-api-key>
OPENWEATHER_API_KEY=<your-openweather-api-key>
GMAIL_USER=<your-gmail-address>
GMAIL_PASS=<your-gmail-app-password>
```

Create `travel-frontend/.env` for the frontend:

```env
VITE_API_URL=http://localhost:3000
```

Note: the active email service reads `GMAIL_USER` and `GMAIL_PASS`.

## Installation

Install backend dependencies from the project root:

```bash
npm install
```

Install frontend dependencies:

```bash
cd travel-frontend
npm install
```

## Running Locally

Start the backend from the project root:

```bash
npm run dev
```

or:

```bash
npm start
```

Start the frontend in a second terminal:

```bash
cd travel-frontend
npm run dev
```

Default local URLs:

```txt
Backend:  http://localhost:3000
Frontend: http://localhost:5173
```

Health check:

```txt
GET http://localhost:3000/api/health
```

## API Overview

### Auth

```txt
POST /api/register
POST /api/login
POST /api/verify-signup-otp
POST /api/verify-login-otp
POST /api/resend-otp
POST /api/forgot-password
POST /api/verify-forgot-otp
POST /api/reset-password
POST /api/change-password
GET  /api/verify-token
```

### Places, Weather, Maps, Distance

```txt
GET  /api/places/:city
GET  /api/weather/:city
GET  /api/current-weather/:city
GET  /api/maps/embed
GET  /api/photo?ref=<photo_reference>
POST /api/distance
```

### Route Optimization

```txt
POST /api/route/optimize
```

Example body:

```json
{
  "locations": [
    { "name": "Place A", "lat": 12.97, "lng": 77.59 },
    { "name": "Place B", "lat": 12.98, "lng": 77.60 }
  ]
}
```

Example response:

```json
{
  "route": ["Place A", "Place B"],
  "details": [
    { "name": "Place A", "distToNext": 2500, "timeToNext": 600 },
    { "name": "Place B", "distToNext": 0, "timeToNext": 0 }
  ],
  "startLeg": null,
  "endLeg": null,
  "summary": {
    "totalDistanceKm": 2.5,
    "dataSource": "Google Distance Matrix"
  }
}
```

### Trips

Protected routes require:

```txt
Authorization: Bearer <token>
```

```txt
POST   /api/save-trip
GET    /api/trips
GET    /api/trip/:id
PUT    /api/trip/:id
DELETE /api/trip/:id
POST   /api/trip/:id/duplicate
```

### Analytics

```txt
GET /api/analytics/me
```

### SOS

```txt
GET  /api/sos/nearby?lat=<lat>&lng=<lng>
POST /api/sos/alert
```

The nearby endpoint returns hospitals, police stations, and fire stations sorted by distance.

The SOS alert endpoint currently builds a location link and returns success while direct SOS email sending is disabled in the controller. The shared email infrastructure is already available in `services/emailService.js`.

### Email Testing And Reminders

```txt
GET /api/test-email?to=<email>
GET /api/trigger-reminders
```

The reminder job runs daily at 9 AM and checks trips that are 5, 3, or 1 day away.

## Route Optimization Approach

Velora uses a nearest-neighbor heuristic for the Travelling Salesman Problem.

1. Start with the first selected place.
2. Find the nearest unvisited place.
3. Move to that place and mark it visited.
4. Repeat until all selected places are ordered.

When Google Distance Matrix is available, distance decisions use real driving distances. If it fails, the app falls back to Haversine distance using latitude and longitude.

This approach is fast and practical for trip planning, though it does not guarantee the mathematically shortest possible route.

## Notes

- Do not commit `.env` files.
- Use a Gmail app password, not your normal Gmail password.
- MongoDB connection errors are logged without crashing the backend during local development.
- The root `setup.js` script can help create environment files, but verify variable names against the active code before running in production.

