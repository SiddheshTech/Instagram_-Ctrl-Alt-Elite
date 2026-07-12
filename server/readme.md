# Instagram Clone Backend (Authentication)

This folder contains the authentication backend for the Instagram clone project. It handles user signups, logins, and session fetching using Node.js, Express, Mongoose, and JWT.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env` (copy from `.env.example` if it doesn't exist).
3. Make sure MongoDB is running locally on port `27017` or update the `MONGO_URI` to point to MongoDB Atlas.
4. Run in development mode:
   ```bash
   npm run dev
   ```

## Folder Structure

- `server.js` - Main entry point
- `config/` - Database config
- `models/` - Mongoose schemas (User)
- `controllers/` - Signup, Login, and Me endpoint handlers
- `middleware/` - JWT Verification middleware
- `routes/` - Express router mappings
