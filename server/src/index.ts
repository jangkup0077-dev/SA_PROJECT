import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoute.js';
import profileRoutes from './routes/profileRoute.js';
import uploadRoutes from './routes/uploadRoute.js';
import swipeRoutes from './routes/swipeRoute.js';
import chatRoutes from './routes/chatRoute.js';
import adminRoutes from './routes/adminRoute.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// ==========================================
// Socket.io
// ==========================================
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: '*', // โหมด Dev อนุญาตทุกการเชื่อมต่อ
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('join_match', (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`User joined room: match_${matchId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
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

app.get('/', (req, res) => {
  res.send('Game Match API is Ready!');
});

// Temporary endpoint to wipe user data
app.get('/api/wipe', async (req, res) => {
  try {
    const { pool } = await import('./config/db.js');
    const result = await pool.query('DELETE FROM users;');
    res.json({ message: `Successfully wiped ${result.rowCount} users and all cascading data.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});