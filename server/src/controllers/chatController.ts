import { Response } from 'express';
import { pool } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { io } from '../index.js'; 

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user?.userId;
    const { matchId } = req.params;

    if (isNaN(Number(matchId))) {
      return res.status(400).json({ message: 'Invalid match ID' });
    }

    const checkMatch = await pool.query(
      'SELECT * FROM matches WHERE id = $1 AND (user_one_id = $2 OR user_two_id = $2)',
      [matchId, myId]
    );

    if (checkMatch.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied: You are not part of this match' });
    }

    const messages = await pool.query(
      'SELECT * FROM messages WHERE match_id = $1 ORDER BY sent_at ASC',
      [matchId]
    );

    res.json(messages.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user?.userId;
    const { matchId } = req.params;
    const { message_content, message_type = 'TEXT' } = req.body;

    if (isNaN(Number(matchId))) {
      return res.status(400).json({ message: 'Invalid match ID' });
    }

    if (!message_content) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const checkMatch = await pool.query(
      'SELECT * FROM matches WHERE id = $1 AND (user_one_id = $2 OR user_two_id = $2)',
      [matchId, myId]
    );

    if (checkMatch.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    //const matchData = checkMatch.rows[0];
    //const targetUserId = matchData.user_one_id === myId ? matchData.user_two_id : matchData.user_one_id;

    const newMessage = await pool.query(
      'INSERT INTO messages (match_id, sender_id, message_type, message_content) VALUES ($1, $2, $3, $4) RETURNING *',
      [matchId, myId, message_type, message_content]
    );

    const savedMessage = newMessage.rows[0];

    io.to(`match_${matchId}`).emit('receive_message', savedMessage);

    const matchData = checkMatch.rows[0];
    const targetUserId = matchData.user_one_id === myId ? matchData.user_two_id : matchData.user_one_id;
    io.to(`user_${targetUserId}`).emit('new_notification', { type: 'message' });

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};