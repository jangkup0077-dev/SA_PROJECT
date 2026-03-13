import { pool } from '../config/db.js';
import { io } from '../index.js';
// 1. ดึงประวัติข้อความทั้งหมด (GET /api/chat/:matchId)
export const getMessages = async (req, res) => {
    try {
        const myId = req.user?.userId;
        const { matchId } = req.params;
        if (isNaN(Number(matchId))) {
            return res.status(400).json({ message: 'Invalid match ID' });
        }
        // ระบบรักษาความปลอดภัย: เช็คว่าเราเป็น 1 ในคนที่อยู่ใน Match นี้จริงๆ ใช่ไหม
        const checkMatch = await pool.query('SELECT * FROM matches WHERE id = $1 AND (user_one_id = $2 OR user_two_id = $2)', [matchId, myId]);
        if (checkMatch.rows.length === 0) {
            return res.status(403).json({ message: 'Access denied: You are not part of this match' });
        }
        // ดึงข้อความเรียงตามเวลาเก่าไปใหม่
        const messages = await pool.query('SELECT * FROM message WHERE match_id = $1 ORDER BY sent_at ASC', [matchId]);
        res.json(messages.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
// 2. ส่งข้อความใหม่ (POST /api/chat/:matchId)
export const sendMessage = async (req, res) => {
    try {
        const myId = req.user?.userId;
        const { matchId } = req.params;
        const { message_content } = req.body;
        if (isNaN(Number(matchId))) {
            return res.status(400).json({ message: 'Invalid match ID' });
        }
        if (!message_content) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }
        const checkMatch = await pool.query('SELECT * FROM matches WHERE id = $1 AND (user_one_id = $2 OR user_two_id = $2)', [matchId, myId]);
        if (checkMatch.rows.length === 0) {
            return res.status(403).json({ message: 'Access denied' });
        }
        // 1. บันทึกข้อความลง Database
        const newMessage = await pool.query('INSERT INTO message (match_id, sender_id, message_content) VALUES ($1, $2, $3) RETURNING *', [matchId, myId, message_content]);
        const savedMessage = newMessage.rows[0];
        // 2. ส่งข้อความเด้งไปหาห้องแชทนั้นๆ ผ่าน Socket ทันที
        io.to(`match_${matchId}`).emit('receive_message', savedMessage);
        res.status(201).json(savedMessage);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
