import { Response } from 'express';
import { pool } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.is_admin, u.created_at, u.last_active_at,
             p.display_name, p.birth_date, p.country
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { userId } = req.params;
    const { reason = "Violated terms of service" } = req.body;

    if (isNaN(Number(userId))) return res.status(400).json({ message: 'Invalid user ID' });

    if (Number(userId) === adminId) {
        return res.status(400).json({ message: 'Cannot ban yourself' });
    }

    const checkUser = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (checkUser.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      'INSERT INTO user_bans (user_id, admin_id, reason) VALUES ($1, $2, $3)',
      [userId, adminId, reason]
    );

    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id, details) VALUES ($1, $2, $3, $4)',
      [adminId, 'BANNED_USER', userId, reason]
    );

    res.json({ message: 'User has been banned successfully' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'User is already banned' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addGame = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { game_name, game_icon_url } = req.body;

    if (!game_name) return res.status(400).json({ message: 'Game name is required' });

    const newGame = await pool.query(
      'INSERT INTO games (game_name, game_icon_url) VALUES ($1, $2) RETURNING *',
      [game_name, game_icon_url || '']
    );

    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id, details) VALUES ($1, $2, $3, $4)',
      [adminId, 'ADDED_GAME', newGame.rows[0].id, `Added game: ${game_name}`]
    );

    res.status(201).json({ message: 'Game added successfully', game: newGame.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};