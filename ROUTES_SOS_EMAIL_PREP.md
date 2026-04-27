# Velora Prep: Routes, TSP, SOS, and Emails

This note is for explaining the `Routes + SOS` part of Velora in a demo, viva, or interview.

## Quick File Map

### Backend routing and TSP

- `server.js`
  - Mounts all API routes under `/api`.
  - Important line of flow: `app.use("/api", routeRoutes)` and `app.use("/api", sosRoutes)`.

- `routes/routeRoutes.js`
  - Defines `POST /api/route/optimize`.
  - Sends the request to `controllers/routeController.optimizeRoute`.

- `controllers/routeController.js`
  - Main active route optimization controller.
  - Reads `locations`, optional `startPoint`, optional `endPoint` from the request body.
  - Calls Google Distance Matrix through `services/googleApi.js`.
  - Calls TSP helper functions from `utils/tsp.js`.
  - Returns optimized route order, distance/time between stops, optional start/end legs, and a summary.

- `utils/tsp.js`
  - Contains the actual TSP logic.
  - Uses nearest-neighbor heuristic.
  - Has two modes:
    - `nearestNeighborMatrix`: uses real Google driving distance matrix.
    - `nearestNeighbor`: fallback using Haversine distance from latitude/longitude.
  - `totalRouteDistance` calculates display distance in km.

- `services/googleApi.js`
  - `getDistanceMatrix(places)` calls Google Distance Matrix API for all selected places.
  - `getPointDistance(origin, destination)` calculates a single leg such as user start point to first stop.
  - `getTouristPlaces(city)` fetches tourist places with names, ratings, lat/lng, photo references, and place IDs.

- `controllers/placeController.js`
  - Handles places, weather, map embed URL, photo, and point-to-point distance APIs.
  - It also contains older/alternate route optimization logic/comments. For the active `/api/route/optimize`, explain `controllers/routeController.js`.

### Frontend routing UI

- `travel-frontend/src/pages/trip.jsx`
  - Main trip planning page.
  - Lets user search city, select places, choose date, and click `Optimize Route`.
  - `handleOptimizeRoute` builds selected place objects with `lat/lng` and calls `POST /api/route/optimize`.
  - Displays optimized route and distance/time details.
  - Also shows emergency modal and nearby/mock emergency cards.

- `travel-frontend/src/pages/OptimizedRoute.jsx`
  - Detailed route result page.
  - Displays final route order, route details, map embed, Google Maps directions link, total distance, and save button.
  - Saves route data through `POST /api/save-trip`.
  - Shows emergency contacts modal.

- `travel-frontend/src/App.jsx`
  - Frontend route mapping:
    - `/trips` -> `trip.jsx`
    - `/route` -> `OptimizedRoute.jsx`
    - `/emergency` -> `Emergency.jsx`

### SOS and emergency

- `routes/sosRoutes.js`
  - Defines:
    - `GET /api/sos/nearby`
    - `POST /api/sos/alert`
  - Both routes use JWT auth middleware.

- `controllers/sosController.js`
  - `getNearbyEmergency`
    - Accepts `lat` and `lng`.
    - Uses Google Places Nearby Search for hospitals, police stations, and fire stations.
    - Returns nearest services sorted by distance.
  - `sendSosAlert`
    - Accepts `name`, `email`, `lat`, `lng`, and `city`.
    - Builds a Google Maps location link and timestamp.
    - Currently returns success with `"mailer disabled"` instead of actually sending email.

- `travel-frontend/src/pages/Emergency.jsx`
  - Dedicated emergency page.
  - Gets browser geolocation.
  - Calls `/api/sos/nearby` when location is granted and user has a token.
  - SOS button starts a 5-second countdown.
  - After countdown, calls `/api/sos/alert`.
  - Shows national emergency numbers and safety tips.

### Emails

- `services/emailService.js`
  - Central Nodemailer email service.
  - Uses Gmail SMTP through `GMAIL_USER` and `GMAIL_PASS`.
  - Sends:
    - OTP email
    - Welcome email
    - Login notification email
    - Trip confirmation email
    - Trip reminder email
    - Reset password email

- `controllers/authController.js`
  - Calls OTP, welcome, login, and reset password emails.

- `controllers/tripController.js`
  - `saveTrip` saves trip data and sends trip confirmation email.

- `jobs/notificationJob.js`
  - Scheduled cron job.
  - Sends reminder emails 5, 3, and 1 day before trip date.
  - Uses in-memory dedupe so one process run does not send the same reminder repeatedly.

## Route Optimization: How It Works

The route feature solves a practical version of the Travelling Salesman Problem. The user selects multiple tourist places, and the app tries to find a short visiting order.

Flow:

1. User searches a city in `trip.jsx`.
2. Frontend fetches places from `/api/places/:city`.
3. Each place includes `name`, `lat`, `lng`, rating, and metadata.
4. User selects at least two places and clicks `Optimize Route`.
5. `trip.jsx` sends:

```json
{
  "locations": [
    { "name": "Place A", "lat": 12.97, "lng": 77.59 },
    { "name": "Place B", "lat": 12.98, "lng": 77.60 }
  ]
}
```

6. Backend route:

```txt
POST /api/route/optimize
routes/routeRoutes.js
controllers/routeController.js
```

7. Backend calls `getDistanceMatrix(locations)`.
8. If Google Distance Matrix succeeds, the algorithm uses real driving distance.
9. If Google fails, the algorithm falls back to Haversine distance.
10. Backend returns:

```json
{
  "route": ["Place A", "Place C", "Place B"],
  "details": [
    { "name": "Place A", "distToNext": 2500, "timeToNext": 600 },
    { "name": "Place C", "distToNext": 1800, "timeToNext": 420 },
    { "name": "Place B", "distToNext": 0, "timeToNext": 0 }
  ],
  "startLeg": null,
  "endLeg": null,
  "summary": {
    "totalDistanceKm": 4.3,
    "dataSource": "Google Distance Matrix"
  }
}
```

## TSP Algorithm Explanation

This project uses the nearest-neighbor heuristic for TSP.

Simple explanation:

1. Start from the first selected place.
2. Look at all unvisited places.
3. Pick the nearest unvisited place.
4. Move there and mark it visited.
5. Repeat until all places are visited.

Why this algorithm?

- Exact TSP becomes expensive as places increase.
- Nearest neighbor is simple, fast, and good enough for a travel planning app.
- Time complexity is roughly `O(n^2)` because for each stop it scans remaining places.
- It does not always guarantee the global shortest path, but it gives a practical optimized route quickly.

How real distance is used:

- `services/googleApi.js` creates a distance matrix.
- `matrix[i][j]` means distance from place `i` to place `j` in metres.
- `utils/tsp.js` uses that matrix to choose the nearest unvisited place.

Fallback:

- If Google Distance Matrix fails, `utils/tsp.js` uses Haversine.
- Haversine calculates straight-line distance between latitude/longitude coordinates.
- This keeps route optimization working even if the API is unavailable.

## SOS Flow

There are two SOS experiences:

1. Quick emergency contact modal inside `trip.jsx` and `OptimizedRoute.jsx`.
2. Full emergency page in `Emergency.jsx`.

Full emergency page flow:

1. User opens `/emergency`.
2. User clicks `Share My Location`.
3. Browser geolocation gives `lat/lng`.
4. Frontend calls:

```txt
GET /api/sos/nearby?lat=<lat>&lng=<lng>
```

5. Backend searches nearby:
   - hospitals
   - police stations
   - fire stations
6. Backend sorts results by distance and sends them to frontend.
7. User can call a service or open map.

SOS alert button flow:

1. User clicks SOS button.
2. Frontend starts a 5-second countdown.
3. User can cancel during countdown.
4. If not cancelled, frontend calls:

```txt
POST /api/sos/alert
```

with body:

```json
{
  "name": "Velora User",
  "email": "contact@example.com",
  "lat": 12.97,
  "lng": 77.59,
  "city": "Current Location"
}
```

5. Backend creates a Google Maps link:

```txt
https://www.google.com/maps?q=<lat>,<lng>
```

Important honest point:

- `sendSosAlert` currently does not send a real email.
- It returns success with message: `SOS alert email skipped (mailer disabled).`
- The email infrastructure exists in `services/emailService.js`, so the next improvement would be adding a real `sendSosEmail` function and calling it from `sendSosAlert`.

## Email System Explanation

The app uses Nodemailer with Gmail SMTP.

Environment variables:

```txt
GMAIL_USER=<gmail address>
GMAIL_PASS=<gmail app password>
```

Main helper:

- `createTransporter()` creates Gmail transporter.
- If env variables are missing, email sending is skipped safely.
- `send(to, subject, html)` sends HTML email using the shared Velora template.

Where emails are triggered:

- Signup OTP: `authController.register` -> `sendOtpEmail`
- Verify signup: `authController.verifySignupOtp` -> `sendWelcomeEmail`
- Login: `authController.login` / `verifyLoginOtp` -> `sendLoginEmail`
- Forgot password: `authController.forgotPassword` -> `sendOtpEmail`
- Reset password link: `sendResetPasswordEmail`
- Save trip: `tripController.saveTrip` -> `sendTripConfirmationEmail`
- Trip reminders: `notificationJob.runReminderJob` -> `sendTripReminderEmail`

Reminder job:

- Runs daily at 9 AM.
- Checks trips happening in 5, 3, or 1 day.
- Sends reminder email to the trip owner.
- Can be manually tested through:

```txt
GET /api/trigger-reminders
```

## How To Explain In 60 Seconds

Velora lets users select tourist places for a city and then optimizes the order of visiting them. The frontend sends selected places with latitude and longitude to `/api/route/optimize`. The backend first tries to get a real driving distance matrix from Google Distance Matrix API. Then it applies a nearest-neighbor TSP heuristic: start from the first place, repeatedly choose the closest unvisited place, and return the ordered route. If Google API fails, the backend falls back to Haversine straight-line distance, so the feature still works.

For SOS, Velora has an emergency page that uses browser geolocation. It sends the user's coordinates to `/api/sos/nearby`, and the backend uses Google Places Nearby Search to find hospitals, police, and fire stations sorted by distance. The SOS alert flow has a 5-second cancelable countdown and calls `/api/sos/alert`, which currently creates a map link and returns success while mailer sending is disabled.

For emails, Velora uses Nodemailer with Gmail SMTP. A shared email service sends OTPs, welcome emails, login alerts, trip confirmation emails, password reset emails, and scheduled trip reminders.

## Common Questions And Answers

**Q: Which file contains the route algorithm?**

`utils/tsp.js` contains the nearest-neighbor TSP helpers. `controllers/routeController.js` calls those helpers.

**Q: Which endpoint optimizes routes?**

`POST /api/route/optimize`, defined in `routes/routeRoutes.js`.

**Q: Is this exact TSP?**

No. It is a nearest-neighbor heuristic. It is faster and practical for travel planning but does not guarantee the global optimum.

**Q: Why use Google Distance Matrix?**

Because real driving distance/time is more useful than straight-line distance. Roads, turns, and city traffic layouts matter.

**Q: What happens if Google API fails?**

The backend falls back to Haversine distance using latitude/longitude.

**Q: What does `distToNext` mean?**

It is the distance from the current stop to the next stop in the optimized route, stored in metres.

**Q: What does `timeToNext` mean?**

It is the travel duration from current stop to next stop, stored in seconds.

**Q: How is the route saved?**

`OptimizedRoute.jsx` sends route, route details, places data, date, and total distance to `POST /api/save-trip`. Backend saves it in MongoDB using `models/trip.js`.

**Q: How are emergency services found?**

`Emergency.jsx` gets browser location and calls `/api/sos/nearby`. `sosController.getNearbyEmergency` calls Google Places Nearby Search for hospital, police, and fire station types.

**Q: Does SOS currently send a real email?**

The UI calls `/api/sos/alert`, but backend currently returns success with `mailer disabled`. Real email sending can be added using the existing `emailService.js`.

**Q: Where is email configured?**

`services/emailService.js`, using `GMAIL_USER` and `GMAIL_PASS`.

**Q: What emails does Velora send?**

OTP, welcome, login notification, trip confirmation, trip reminders, and reset password.

**Q: How are trip reminders scheduled?**

`jobs/notificationJob.js` uses `node-cron` and runs daily at 9 AM, checking trips 5, 3, and 1 day away.

## Demo Checklist

Use this order while presenting:

1. Open `travel-frontend/src/pages/trip.jsx`.
2. Show user selects city and places.
3. Show `handleOptimizeRoute` calling `/api/route/optimize`.
4. Open `routes/routeRoutes.js`.
5. Open `controllers/routeController.js`.
6. Show Google Distance Matrix call and fallback.
7. Open `utils/tsp.js`.
8. Explain nearest-neighbor TSP.
9. Open `travel-frontend/src/pages/Emergency.jsx`.
10. Show geolocation, nearby emergency API, and SOS countdown.
11. Open `controllers/sosController.js`.
12. Explain nearby services and current disabled SOS email.
13. Open `services/emailService.js`.
14. Explain Nodemailer and email templates.
15. Open `jobs/notificationJob.js`.
16. Explain scheduled reminders.

## One Improvement You Can Mention

The current SOS alert endpoint has email sending disabled. A strong improvement would be to add:

```js
sendSosEmail(contactEmail, name, mapsLink, timeStr, city)
```

inside `services/emailService.js`, then call it from `controllers/sosController.js`. That would make the SOS email path fully functional using the same Nodemailer system already used by OTPs and trip reminders.
