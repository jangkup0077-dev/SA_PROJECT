# GameMatch

GameMatch is a modern, web-based platform designed to help gamers find and match with other players based on shared interests and matching game titles. The platform brings the popular "swipe-to-match" interface into the gaming community, allowing players to connect, match, and chat in real-time.

## Features

- **Gamer Discovery:** Swipe right (Like) or left (Skip) on potential gaming companions.
- **Mutual Matching:** A real-time notification when two players mutually swipe right on each other.
- **Live Chat:** Real-time socket-based chat rooms for matched players to communicate instantly.
- **Dynamic Onboarding:** A smooth multi-step registration flow that allows users to pick their favorite games and set up their bios.
- **Interactive Profiles:** Users can view, edit, and update their profiles and gaming preferences.
- **Admin Dashboard (Planned):** Built-in structure for administrators to manage users and tags.

## Technology Stack

### Frontend
- **Framework:** Vue 3 with Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (featuring a sleek, dark-themed UI)
- **State Management:** Pinia
- **HTTP Client:** Axios
- **Real-Time Communication:** Socket.IO Client

### Backend
- **Framework:** Node.js with Express
- **Language:** TypeScript
- **Database:** PostgreSQL (using `pg`)
- **Real-Time Communication:** Socket.IO
- **Authentication:** JWT (JSON Web Tokens) & bcrypt
- **Media Hosting:** Cloudinary

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running locally, or a hosted database URL.

### Database Setup (Docker)
1. Ensure Docker and Docker Desktop are running.
2. Navigate to the `server` directory and start the PostgreSQL container using Docker Compose:
   ```bash
   cd server
   docker compose up -d
   ```
   *This will automatically launch the database and run the `init.sql` script to set up tables and mock data.*

### Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on your environment (ensure `DATABASE_URL` matches your local Docker config).
4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `client` directory:
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

## Key Workflows & Features Recently Added
- Overhauled onboarding to a sleek 5-screen gradient dark-mode interface.
- Redesigned the *Discover* (Swipe) and *Matches* pages.
- Resolved database synchronization for real-time swipe/match validation.
- Corrected real-time chat architecture to ensure sender/receiver message bubbles align accurately and histories are preserved.

## License
[MIT License](LICENSE)
