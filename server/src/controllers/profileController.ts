import { Response } from 'express';
import { pool } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import geoip from 'geoip-lite';

export const getAllGames = async (req: any, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY game_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const userResult = await pool.query(`
      SELECT u.id as user_id, u.name, u.email, u.is_admin,
             p.display_name, p.bio, p.country, p.birth_date, p.profile_image_url
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [userId]);

    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const gamesResult = await pool.query(`
      SELECT g.id as game_id, g.game_name, g.game_icon_url
      FROM user_game_interests ugi
      JOIN games g ON ugi.game_id = g.id
      WHERE ugi.user_id = $1
    `, [userId]);

    res.json({
      ...userResult.rows[0],
      games: gamesResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    let { display_name, bio, country, birth_date, profile_image_url } = req.body;

    // Detect Country via IP if missing or requested
    if (!country) {
      const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
      const geo = geoip.lookup(clientIp);
      if (geo && geo.country) {
         country = geo.country;
      } else {
         country = 'Unknown';
      }
    }

    await pool.query(`
      INSERT INTO profiles (user_id, display_name, bio, country, birth_date, profile_image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET 
        display_name = $2, 
        bio = $3, 
        country = $4, 
        birth_date = $5, 
        profile_image_url = $6,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, display_name, bio, country, birth_date, profile_image_url]);

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMyGames = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { gameId } = req.body;

    const gameCheck = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
    if(gameCheck.rows.length === 0) return res.status(400).json({ message: 'Game not found in system' });

    await pool.query(`
      INSERT INTO user_game_interests (user_id, game_id)
      VALUES ($1, $2)
    `, [userId, gameId]);

    res.json({ message: 'Game interest added successfully' });
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ message: 'Game already added' });
    console.error(err);
    res.status(500).json({ message: 'Error adding game' });
  }
};

export const removeMyGame = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { gameId } = req.params;

    if (isNaN(Number(gameId))) {
      return res.status(400).json({ message: 'Invalid game ID' });
    }

    const result = await pool.query(
      'DELETE FROM user_game_interests WHERE user_id = $1 AND game_id = $2 RETURNING *',
      [userId, gameId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Game not found in your profile' });
    }

    res.json({ message: 'Game removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId;

    if (isNaN(Number(targetUserId))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const userResult = await pool.query(`
      SELECT u.id as user_id, u.name, u.last_active_at,
             p.display_name, p.bio, p.country, p.birth_date, p.profile_image_url
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [targetUserId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const gamesResult = await pool.query(`
      SELECT g.id as game_id, g.game_name, g.game_icon_url
      FROM user_game_interests ugi
      JOIN games g ON ugi.game_id = g.id
      WHERE ugi.user_id = $1
    `, [targetUserId]);

    res.json({
      ...userResult.rows[0],
      games: gamesResult.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitReport = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user?.userId;
    const { reportedId, reportType, description, images } = req.body;

    if (!reportedId || !reportType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await pool.query(
      'INSERT INTO reports (reporter_id, reported_user_id, report_type, description, images) VALUES ($1, $2, $3, $4, $5)',
      [reporterId, reportedId, reportType, description, images || []]
    );

    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};