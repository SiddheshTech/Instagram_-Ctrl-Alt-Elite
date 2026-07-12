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

  socket.on('addUser', async (userId) => {
    if (userId) {
      const roomName = userId.toString();
      socket.join(roomName);
      socket.userId = roomName; // Track userId directly on the socket
      socket.activeMinutes = 0; // Initialize connection minutes tracker
      
      onlineUsers.set(roomName, roomName); // Map user to room so io.to(receiverSocket) emits to all their sessions
      io.emit('getUsers', Array.from(onlineUsers.keys()));

      // Update DB Online Status
      try {
        const User = require('./models/User');
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit('onlineStatusChanged', { userId, isOnline: true });
      } catch (err) {
        console.error('Error updating online status:', err);
      }

      // Periodically track active time (every 60 seconds)
      if (!socket.timeTrackingInterval) {
        socket.timeTrackingInterval = setInterval(async () => {
          try {
            if (socket.userId) {
              const todayStr = new Date().toISOString().split('T')[0];
              const TimeSpent = require('./models/TimeSpent');
              
              // Increment minutes spent for today
              const todaySpent = await TimeSpent.findOneAndUpdate(
                { userId: socket.userId, date: todayStr },
                { $inc: { minutes: 1 } },
                { upsert: true, new: true }
              );

              // Increment socket connection session time for break reminders
              socket.activeMinutes += 1;

              // Query user settings
              const User = require('./models/User');
              const user = await User.findById(socket.userId);
              
              if (user) {
                // 1. Check if Daily Time Limit reached
                if (user.dailyTimeLimit > 0 && todaySpent.minutes >= user.dailyTimeLimit) {
                  socket.emit('dailyLimitReached', { 
                    limit: user.dailyTimeLimit, 
                    spent: todaySpent.minutes 
                  });
                }
                
                // 2. Check if Break Reminder reached
                if (user.breakReminder > 0 && socket.activeMinutes >= user.breakReminder) {
                  socket.emit('breakReminderReached', { 
                    reminder: user.breakReminder 
                  });
                  socket.activeMinutes = 0; // Reset reminder counter after alert
                }
              }
            }
          } catch (err) {
            console.error('Real-time time tracking error:', err);
          }
        }, 60000); // 60 seconds interval
      }
    }
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

  socket.on('iceCandidate', (data) => {
    const targetSocket = onlineUsers.get(data.to);
    if (targetSocket) {
      io.to(targetSocket).emit('iceCandidate', data.candidate);
    }
  });

  socket.on('endCall', (data) => {
    const targetSocket = onlineUsers.get(data.to);
    if (targetSocket) {
      io.to(targetSocket).emit('endCall');
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    for (let [id, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(id);
        
        // Update DB
        try {
          const User = require('./models/User');
          await User.findByIdAndUpdate(id, { isOnline: false });
          io.emit('onlineStatusChanged', { userId: id, isOnline: false });
        } catch (err) {
          console.error('Error updating online status on disconnect:', err);
        }
        
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
app.use('/api/stories', require('./routes/storyRoutes'));

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
