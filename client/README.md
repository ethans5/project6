# JSONPlaceholder Clone - React Client

A Single-Page Application (SPA) built with React to serve as the client-side interface for the JSONPlaceholder Clone API (Step C).

## Strict Technical Constraints Applied

This client application strictly follows these rules:
- **Modern JavaScript**: Exclusively uses ES6+, standard React hooks (`useState`, `useEffect`), and the asynchronous `Fetch API` (`async`/`await`).
- **Communication**: Interagit avec l'API sur `http://localhost:3000`. Toutes les requêtes POST/PUT incluent l'en-tête `{'Content-Type': 'application/json'}` et envoient les données via `JSON.stringify()`.
- **Navigation**: Uses `react-router-dom` v6 for client-side routing.
- **Form Handling**: All forms are implemented as Controlled Components bound to React State.
- **Validation**: Real-time Regex validation is applied on inputs (e.g., email format on every keystroke).
- **Session Management**: User persistence is managed exclusively via browser `localStorage` under the key `currentUser`.
- **Language**: All UI text is written in English.
- **Styling**: Uses plain, vanilla CSS files (`.css`) without any external UI frameworks (No Bootstrap, Tailwind, or Material UI). The design prioritizes a modern, clean, and professional aesthetic (glassmorphism, smooth transitions).

## Directory Structure

```text
client/
├── public/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx   # Route guard checking localStorage
│   ├── pages/
│   │   ├── Login.jsx            # /login page with fetch
│   │   ├── Register.jsx         # /register page with Regex validation
│   │   └── Dashboard.jsx        # /dashboard protected page
│   ├── styles/
│   │   ├── Login.css
│   │   ├── Register.css
│   │   └── Dashboard.css
│   ├── App.jsx                  # Main router configuration
│   ├── index.css                # Global styles and resets
│   └── main.jsx                 # Vite React entry point
├── package.json
├── vite.config.js
└── README.md
```

## Setup and Running

**Prerequisite:** Ensure the Node.js API server (`../server`) is already running on `http://localhost:3000`.

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`). You will be automatically redirected to the Login page.

## Pages Overview

### 1. Login (`/login`)
- Accepts a username and password.
- Sends a `POST` request to the backend.
- On success, saves the returned user object to `localStorage` and redirects to the Dashboard.

### 2. Register (`/register`)
- Accepts Full Name, Username, Email, and Password.
- Features real-time visual feedback for Email validation using Regex.
- Sends a `POST` request to create the user on the backend.
- Redirects to Login upon successful account creation.

### 3. Dashboard (`/dashboard`)
- Protected route: If `currentUser` is not found in `localStorage`, it instantly redirects to `/login`.
- Features a sticky navigation bar with a dynamic welcome message.
- Includes an "Info" button that triggers a modal displaying the connected user's details.
- Includes a "Logout" button that securely clears the `localStorage` and redirects to `/login`.
- The main section serves as a clean placeholder for future features (Todos, Posts, Comments).
