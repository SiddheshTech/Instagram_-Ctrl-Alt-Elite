require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // You can restrict this to your frontend URL in production
    methods: ['GET', 'POST'],
  },
});

// Make io accessible to our router
app.set('io', io);

// Track online users mapping: userId -> socketId
const onlineUsers = new Map();
app.set('onlineUsers', onlineUsers);

// Socket.io Connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('addUser', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('getUsers', Array.from(onlineUsers.keys()));
  });

  // WebRTC Signaling for Voice/Camera Calls
  socket.on('callUser', (data) => {
    const userToCallSocket = onlineUsers.get(data.userToCall);
    if (userToCallSocket) {
      io.to(userToCallSocket).emit('callUser', { 
        signal: data.signalData, 
        from: data.from, 
        name: data.name 
      });
    }
  });

  socket.on('answerCall', (data) => {
    const callerSocket = onlineUsers.get(data.to);
    if (callerSocket) {
      io.to(callerSocket).emit('callAccepted', data.signal);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (let [id, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(id);
        break;
      }
    }
    io.emit('getUsers', Array.from(onlineUsers.keys()));
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve Static Files for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Instagram Clone Backend API is running...' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/reels', require('./routes/reelsRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
