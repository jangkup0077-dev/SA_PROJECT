import { Response } from 'express';
import { pool } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { io, onlineUsers } from '../index.js';

export const getCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user?.userId;
    const result = await pool.query(`
      SELECT 
        u.id as user_id, 
        p.display_name, 
        p.bio, 
        p.birth_date, 
        p.country, 
        p.profile_image_url,
        json_agg(json_build_object('id', g.id, 'name', g.game_name)) as shared_games
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_game_interests ugi ON u.id = ugi.user_id
      JOIN games g ON ugi.game_id = g.id
      WHERE u.id != $1 
      AND u.id NOT IN (
        SELECT target_id FROM swipes WHERE requester_id = $1
      )
      AND u.id NOT IN (
        SELECT user_id FROM user_bans WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP
      )
      AND u.id IN (
        SELECT user_id FROM user_game_interests 
        WHERE game_id IN (SELECT game_id FROM user_game_interests WHERE user_id = $1)
      )
      AND p.country = (SELECT country FROM profiles WHERE user_id = $1)
      GROUP BY u.id, p.display_name, p.bio, p.birth_date, p.country, p.profile_image_url
      LIMIT 10;
    `, [myId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const swipeUser = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user?.userId;
    const { targetId, status } = req.body;
    let matchId = null;

    if (!targetId || !status) {
      return res.status(400).json({ message: 'Missing targetId or status' });
    }

    // Check if requester is suspended
    const userRes = await pool.query('SELECT is_suspended, suspension_until FROM users WHERE id = $1', [myId]);
    const user = userRes.rows[0];
    if (user?.is_suspended && new Date(user.suspension_until) > new Date()) {
        return res.status(403).json({ 
            message: 'Your account is suspended. You cannot swipe.',
            suspension_until: user.suspension_until 
        });
    }

    const checkSwipe = await pool.query(
      'SELECT * FROM swipes WHERE requester_id = $1 AND target_id = $2',
      [myId, targetId]
    );

    if (checkSwipe.rows.length > 0) {
      return res.status(400).json({ message: 'You already swiped this user' });
    }

    await pool.query(
      'INSERT INTO swipes (requester_id, target_id, status) VALUES ($1, $2, $3)',
      [myId, targetId, status]
    );

    let isMatch = false;

    if (status === 'LIKE') {
      const checkMatch = await pool.query(
        'SELECT * FROM swipes WHERE requester_id = $1 AND target_id = $2 AND status = $3',
        [targetId, myId, 'LIKE']
      );

      if (checkMatch.rows.length > 0) {
        isMatch = true;
        const matchRes = await pool.query(
          'INSERT INTO matches (user_one_id, user_two_id) VALUES ($1, $2) RETURNING id',
          [myId, targetId] 
        );
        matchId = matchRes.rows[0].id;
      
        io.to(`user_${myId}`).emit('new_notification', { type: 'match' });
        io.to(`user_${targetId}`).emit('new_notification', { type: 'match' });
      }
    }

    res.json({ message: 'Swipe recorded', isMatch, matchId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyMatches = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user?.userId;

    const result = await pool.query(`
      SELECT 
        m.id as match_id,
        u.id as partner_id,
        p.display_name as partner_name,
        p.profile_image_url as partner_images,
        p.bio as partner_bio,
        p.birth_date as partner_birth_date,
        u.last_active_at,
        m.matched_at,
        (SELECT message_content FROM messages WHERE match_id = m.id ORDER BY sent_at DESC LIMIT 1) as last_message,
        (
          SELECT json_agg(json_build_object('id', g.id, 'name', g.game_name))
          FROM user_game_interests ugi
          JOIN games g ON ugi.game_id = g.id
          WHERE ugi.user_id = u.id
        ) as partner_games
      FROM matches m
      JOIN users u ON (u.id = m.user_one_id OR u.id = m.user_two_id) AND u.id != $1
      JOIN profiles p ON u.id = p.user_id
      WHERE (m.user_one_id = $1 OR m.user_two_id = $1)
      AND m.is_active = true
      ORDER BY m.matched_at DESC
    `, [myId]);

    const matches = result.rows.map(row => ({
      ...row,
      is_online: onlineUsers.has(row.partner_id)
    }));

    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const unmatchUser = async (req: AuthRequest, res: Response) => {
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
      return res.status(403).json({ message: 'Access denied: Cannot unmatch' });
    }

    await pool.query(
      'UPDATE matches SET is_active = false, unmatched_at = CURRENT_TIMESTAMP WHERE id = $1',
      [matchId]
    );

    res.json({ message: 'Unmatched successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};