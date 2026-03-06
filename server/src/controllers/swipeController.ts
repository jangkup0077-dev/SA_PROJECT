import { Response } from 'express';
import { pool } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

// 1. ดึงโปรไฟล์คนอื่นมาแสดงให้ปัด (Candidates)
export const getCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user?.userId;

    // Logic: 
    // 1. ต้องไม่ใช่ตัวเอง (u.id != myId)
    // 2. ต้องยังไม่เคยปัด (NOT IN swipes)
    // 3. ต้องมีเกมตรงกันอย่างน้อย 1 เกม (IN user_game_interests)
    const result = await pool.query(`
      SELECT 
        u.id as user_id, 
        p.display_name, 
        p.bio, 
        p.age, 
        p.country, 
        p.profile_images,
        json_agg(json_build_object('id', g.id, 'name', g.game_name)) as shared_games
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      JOIN user_game_interests ugi ON u.id = ugi.user_id
      JOIN games g ON ugi.game_id = g.id
      WHERE u.id != $1 
      AND u.id NOT IN (
        SELECT target_id FROM swipes WHERE requester_id = $1
      )
      AND u.id IN (
        SELECT user_id FROM user_game_interests 
        WHERE game_id IN (SELECT game_id FROM user_game_interests WHERE user_id = $1)
      )
      GROUP BY u.id, p.display_name, p.bio, p.age, p.country, p.profile_images
      LIMIT 10; -- ดึงมาทีละ 10 คน
    `, [myId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. รับค่าการปัด และตรวจสอบการ Match
export const swipeUser = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user?.userId;
    const { targetId, status } = req.body; // status ต้องเป็น 'LIKE' หรือ 'SKIP'

    if (!targetId || !status) {
      return res.status(400).json({ message: 'Missing targetId or status' });
    }

    // เช็คก่อนว่าเคยปัดคนนี้ไปหรือยัง (กันกดย้ำ)
    const checkSwipe = await pool.query(
      'SELECT * FROM swipes WHERE requester_id = $1 AND target_id = $2',
      [myId, targetId]
    );

    if (checkSwipe.rows.length > 0) {
      return res.status(400).json({ message: 'You already swiped this user' });
    }

    // 1. บันทึกการปัดลงตาราง swipes
    await pool.query(
      'INSERT INTO swipes (requester_id, target_id, status) VALUES ($1, $2, $3)',
      [myId, targetId, status]
    );

    let isMatch = false;
    let matchId: number | undefined;

    // 2. ถ้าเรากด LIKE ให้ไปเช็คว่าเขากด LIKE เราไว้ก่อนหน้านี้ไหม
    if (status === 'LIKE') {
      const checkMatch = await pool.query(
        'SELECT * FROM swipes WHERE requester_id = $1 AND target_id = $2 AND status = $3',
        [targetId, myId, 'LIKE']
      );

      // ถ้าเจอกด LIKE เหมือนกัน -> เกิดการ MATCH!
      if (checkMatch.rows.length > 0) {
        isMatch = true;
        // บันทึกลงตาราง matches
        const matchRes = await pool.query(
          'INSERT INTO matches (user_one_id, user_two_id) VALUES ($1, $2) RETURNING id',
          [myId, targetId] // หรือ [targetId, myId] ก็ได้
        );
        matchId = matchRes.rows[0].id;
      }
    }

    res.json({ message: 'Swipe recorded', isMatch, matchId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. ดึงรายชื่อคนที่เรา Match ติดแล้ว
export const getMyMatches = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user?.userId;

    // Logic: ดึงข้อมูลจากตาราง matches โดยหาว่าเราเป็น user_one หรือ user_two
    // แล้ว Join ไปหาข้อมูล Profile ของอีกฝั่ง
    const result = await pool.query(`
      SELECT 
        m.id as match_id,
        u.id as partner_id,
        p.display_name as partner_name,
        p.profile_images as partner_images,
        m.matched_at
      FROM matches m
      JOIN users u ON (u.id = m.user_one_id OR u.id = m.user_two_id) AND u.id != $1
      JOIN profiles p ON u.id = p.user_id
      WHERE (m.user_one_id = $1 OR m.user_two_id = $1)
      AND m.is_active = true
      ORDER BY m.matched_at DESC
    `, [myId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. ยกเลิกการ Match (Unmatch)
export const unmatchUser = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user?.userId;
    const { matchId } = req.params;

    // 1. ดักจับ Error ถ้า matchId ไม่ใช่ตัวเลข
    if (isNaN(Number(matchId))) {
      return res.status(400).json({ message: 'Invalid match ID' });
    }

    // 2. เช็คว่าเราเป็นเจ้าของ Match นี้จริงๆ ใช่ไหม (ป้องกันคนแอบลบของคนอื่น)
    const checkMatch = await pool.query(
      'SELECT * FROM matches WHERE id = $1 AND (user_one_id = $2 OR user_two_id = $2)',
      [matchId, myId]
    );

    if (checkMatch.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied: Cannot unmatch' });
    }

    // 3. เปลี่ยนสถานะ is_active ให้เป็น false (Soft Delete)
    await pool.query(
      'UPDATE matches SET is_active = false WHERE id = $1',
      [matchId]
    );

    res.json({ message: 'Unmatched successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};