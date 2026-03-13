import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB, pool } from './config/db.js';
import authRoutes from './routes/authRoute.js';
import profileRoutes from './routes/profileRoute.js';
import uploadRoutes from './routes/uploadRoute.js';
import swipeRoutes from './routes/swipeRoute.js';
import chatRoutes from './routes/chatRoute.js';
import adminRoutes from './routes/adminRoute.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.set('trust proxy', true);

connectDB();

// ==========================================
// Socket.io Presence Tracking (Bulletproof)
// ==========================================
export const onlineUsers = new Map<number, Set<string>>(); // userId -> Set of socketIds

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.on('register_user', async (userId) => {
    const id = Number(userId);
    if (!isNaN(id)) {
      if (!onlineUsers.has(id)) {
        onlineUsers.set(id, new Set());
        // First tab for this user - mark as online in DB and broadcast
        await pool.query('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
        io.emit('user_connected', id);
      }
      
      onlineUsers.get(id)!.add(socket.id);
      socket.data.userId = id;
      socket.join(`user_${id}`);
    }
  });

  socket.on('join_match', (matchId) => {
    socket.join(`match_${matchId}`);
  });

  socket.on('check_online', (targetId, callback) => {
    const id = Number(targetId);
    callback(onlineUsers.has(id));
  });

  socket.on('disconnect', async () => {
    const userId = socket.data.userId;
    if (userId && onlineUsers.has(userId)) {
      const socketIds = onlineUsers.get(userId)!;
      socketIds.delete(socket.id);
      
      if (socketIds.size === 0) {
        onlineUsers.delete(userId);
        // Last tab closed - mark as offline and broadcast
        await pool.query('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
        io.emit('user_disconnected', userId);
      }
    }
  });
});
// ==========================================

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Game Match API is Ready!');
});

// Removed temporary wipe endpoint

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});