# 📸 Instagram Clone — Ctrl Alt Elite

A full-stack Instagram clone built with **React + TypeScript** (frontend) and **Node.js + Express + MongoDB** (backend), featuring real-time messaging, reels, stories, notifications, and more.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| 🖥️ Frontend | [instagram-ctrl-alt-elite-gpyc.vercel.app](https://instagram-ctrl-alt-elite-gpyc.vercel.app) |
| ⚙️ Backend API | [instagram-ctrl-alt-elite-5a94.vercel.app](https://instagram-ctrl-alt-elite-5a94.vercel.app) |
| 📁 GitHub | [github.com/SiddheshTech/Instagram_-Ctrl-Alt-Elite](https://github.com/SiddheshTech/Instagram_-Ctrl-Alt-Elite) |

---

## ✨ Features

- 🔐 **Authentication** — Signup, Login, JWT-based session management
- 📸 **Reels / Posts** — Upload, like, comment on reels
- 📖 **Stories** — Create and view 24-hour stories
- 💬 **Direct Messages** — Real-time chat with Socket.io
- 🔔 **Notifications** — Follow, like, comment notifications
- 📝 **Notes** — Instagram-style notes on profiles
- 🔒 **Privacy Settings** — Public/Private account, activity status
- 📊 **Screen Time** — Daily time limit and break reminders
- 🌍 **Geo Location** — Location-based features
- 🔑 **Session Management** — View and revoke active login sessions
- 📧 **Email Logs** — Track email activity
- 👥 **Follow Requests** — Accept/decline follow requests for private accounts
- 📞 **Voice/Video Calls** — WebRTC-based calling via Socket.io
- 🤖 **Gemini AI Integration** — AI-powered features

---

## 🗂️ Project Structure

```
Instagram_-Ctrl-Alt-Elite/
├── client/                       # React + TypeScript Frontend
│   ├── src/
│   │   ├── App.tsx               # Main application component
│   │   ├── config.ts             # API base URL config
│   │   ├── components/
│   │   │   ├── Feed.tsx          # Home feed
│   │   │   ├── Login.tsx         # Login / Signup page
│   │   │   └── Sidebar.tsx       # Navigation sidebar
│   │   ├── data.ts               # Static/mock data
│   │   ├── index.css             # Global styles
│   │   └── main.tsx              # React entry point
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── server/                       # Node.js + Express Backend
    ├── config/
    │   └── db.js                 # MongoDB connection
    ├── controllers/              # Route logic/handlers
    ├── middleware/               # Auth middleware
    ├── models/                   # Mongoose schemas
    │   ├── User.js
    │   ├── Reel.js
    │   ├── Story.js
    │   ├── Message.js
    │   ├── Conversation.js
    │   ├── Comment.js
    │   ├── Note.js
    │   ├── Notification.js
    │   ├── Session.js
    │   ├── TimeSpent.js
    │   ├── FollowRequest.js
    │   ├── UnfollowRecord.js
    │   └── EmailLog.js
    ├── routes/
    │   ├── authRoutes.js         # /api/auth
    │   ├── userRoutes.js         # /api/users
    │   ├── reelsRoutes.js        # /api/reels
    │   ├── commentRoutes.js      # /api/comments
    │   ├── messageRoutes.js      # /api/messages
    │   ├── noteRoutes.js         # /api/notes
    │   ├── notificationRoutes.js # /api/notifications
    │   ├── storyRoutes.js        # /api/stories
    │   └── uploadRoutes.js       # /api/upload
    ├── utils/
    │   └── geo.js                # Geolocation utilities
    ├── uploads/                  # Local media uploads (dev only)
    ├── vercel.json               # Vercel deployment config
    ├── server.js                 # Main Express server
    ├── .env.example
    └── package.json
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS v4 | Styling |
| Axios | HTTP requests |
| Socket.io-client | Real-time communication |
| Framer Motion | Animations |
| Lucide React | Icons |
| Google Gemini AI | AI-powered features |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | Server framework |
| MongoDB + Mongoose | Database |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| Socket.io | Real-time WebSockets |
| Multer | File uploads |
| dotenv | Environment variables |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/SiddheshTech/Instagram_-Ctrl-Alt-Elite.git
cd Instagram_-Ctrl-Alt-Elite
```

---

### 2. Setup the Backend

```bash
cd server
npm install
```

Create a `.env` file (use `.env.example` as reference):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/instagram
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

Start the backend:

```bash
npm run dev      # Development mode (nodemon)
npm start        # Production mode
```

Backend runs at: `http://localhost:5000`

---

### 3. Setup the Frontend

```bash
cd client
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current authenticated user |
| GET | `/api/users/search?q=` | Search users by name/username |
| GET | `/api/users/follow-requests` | Get pending follow requests |
| PUT | `/api/users/profile` | Update profile info |
| PUT | `/api/users/password` | Change password |
| PUT | `/api/users/privacy` | Update privacy settings |
| PUT | `/api/users/time-settings` | Update screen time settings |
| GET | `/api/users/sessions` | Get active login sessions |
| GET | `/api/users/time-spent` | Get daily screen time stats |
| GET | `/api/reels` | Get all reels/posts |
| POST | `/api/reels` | Create a new reel/post |
| PUT | `/api/reels/:id/like` | Like or unlike a reel |
| POST | `/api/reels/:id/comments` | Add a comment |
| GET | `/api/messages/conversations` | Get all conversations |
| POST | `/api/messages` | Send a message |
| GET | `/api/messages/:id` | Get messages in a conversation |
| GET | `/api/notifications/recent-activity` | Get recent notifications |
| POST | `/api/stories` | Create a story |
| GET | `/api/stories` | Get all active stories |
| POST | `/api/notes` | Create or update a note |
| GET | `/api/notes` | Get notes |
| POST | `/api/upload` | Upload a media file (image/video) |

---

## 🌍 Deployment on Vercel

This project is deployed as two separate Vercel projects.

### Backend Deployment

The `server/vercel.json` routes all requests to the Express app:

```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

**Environment Variables (Backend Vercel Project):**

| Key | Value |
|-----|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A strong random secret key |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Your frontend Vercel URL |

---

### Frontend Deployment

Select `client` as the root directory when deploying on Vercel.

**Environment Variables (Frontend Vercel Project):**

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your backend Vercel URL |

> **Note:** After adding environment variables, always redeploy for changes to take effect.

---

## ⚠️ Known Limitations on Vercel

| Feature | Status | Reason |
|---------|--------|--------|
| REST APIs | ✅ Working | Express on serverless |
| Authentication | ✅ Working | JWT stateless |
| Real-time Socket.io | ⚠️ Limited | Vercel serverless has no persistent connections |
| Uploaded file serving | ⚠️ Not persistent | Use Cloudinary or AWS S3 for production uploads |

---

## 👥 Team — Ctrl Alt Elite

Built as a collaborative full-stack project.

---

## 📄 License

This project is built for educational purposes only. Not affiliated with Instagram or Meta.
