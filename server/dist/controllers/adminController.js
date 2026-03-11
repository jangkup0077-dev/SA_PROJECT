import { pool } from '../config/db.js';
import { reportService } from '../services/reportService.js';
import { notificationService } from '../services/notificationService.js';
// 1. ดึงข้อมูลผู้ใช้ทั้งหมด (GET /api/admin/users)
export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.is_admin, u.created_at,
             p.display_name, p.age, p.country
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
// 2. แบนผู้ใช้ (POST /api/admin/ban/:userId) - ใช้วิธีลบไอดีทิ้งถาวร
export const banUser = async (req, res) => {
    try {
        const adminId = req.user?.userId;
        const { userId } = req.params;
        if (isNaN(Number(userId)))
            return res.status(400).json({ message: 'Invalid user ID' });
        // ป้องกันแอดมินเผลอกดแบนตัวเอง
        if (Number(userId) === adminId) {
            return res.status(400).json({ message: 'Cannot ban yourself' });
        }
        // ลบ User (ระบบจะ CASCADE ไปลบโปรไฟล์และแชททิ้งทั้งหมดอัตโนมัติ)
        const deleteResult = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        // บันทึกประวัติว่าแอดมินคนไหนเป็นคนกดแบน
        await pool.query('INSERT INTO admin_logs (admin_id, action, target_id) VALUES ($1, $2, $3)', [adminId, 'banned_user', userId]);
        res.json({ message: 'User banned and permanently removed' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
// 3. เพิ่มรายชื่อเกมใหม่ (POST /api/admin/games)
export const addGame = async (req, res) => {
    try {
        const adminId = req.user?.userId;
        const { game_name, game_icon_url } = req.body;
        if (!game_name)
            return res.status(400).json({ message: 'Game name is required' });
        // บันทึกเกมใหม่ลง Database
        const newGame = await pool.query('INSERT INTO games (game_name, game_icon_url) VALUES ($1, $2) RETURNING *', [game_name, game_icon_url || '']);
        // บันทึกประวัติของแอดมิน
        await pool.query('INSERT INTO admin_logs (admin_id, action, target_id) VALUES ($1, $2, $3)', [adminId, 'added_new_game', newGame.rows[0].id]);
        res.status(201).json({ message: 'Game added successfully', game: newGame.rows[0] });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
export const updateGame = async (req, res) => {
    try {
        const adminId = req.user?.userId;
        const { id } = req.params;
        const { game_name, game_icon_url } = req.body;
        if (!game_name)
            return res.status(400).json({ message: 'Game name is required' });
        const updatedGame = await pool.query('UPDATE games SET game_name = $1, game_icon_url = $2 WHERE id = $3 RETURNING *', [game_name, game_icon_url || '', id]);
        if (updatedGame.rowCount === 0)
            return res.status(404).json({ message: 'Game not found' });
        await pool.query('INSERT INTO admin_logs (admin_id, action, target_id) VALUES ($1, $2, $3)', [adminId, 'updated_game', id]);
        res.json({ message: 'Game updated successfully', game: updatedGame.rows[0] });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
export const deleteGame = async (req, res) => {
    try {
        const adminId = req.user?.userId;
        const { id } = req.params;
        const deleteResult = await pool.query('DELETE FROM games WHERE id = $1 RETURNING id', [id]);
        if (deleteResult.rowCount === 0)
            return res.status(404).json({ message: 'Game not found' });
        await pool.query('INSERT INTO admin_logs (admin_id, action, target_id) VALUES ($1, $2, $3)', [adminId, 'deleted_game', id]);
        res.json({ message: 'Game deleted successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
// 4. Get all reports (GET /api/admin/reports)
export const getReports = async (req, res) => {
    try {
        const { status, date, reportedUserId } = req.query;
        const reports = await reportService.getAllReports(status, date, reportedUserId ? Number(reportedUserId) : undefined);
        res.json(reports);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error retrieving reports' });
    }
};
// 5. Update Report Status (PATCH /api/admin/reports/:id/status)
export const updateReportStatus = async (req, res) => {
    try {
        const adminId = req.user?.userId;
        const reportId = parseInt(req.params.id);
        const { status } = req.body;
        const updatedReport = await reportService.updateReportStatus(reportId, status);
        // Log admin action
        await pool.query('INSERT INTO admin_logs (admin_id, action, target_id, reason) VALUES ($1, $2, $3, $4)', [adminId, `updated_report_${status.toLowerCase()}`, reportId, 'Report moderation']);
        // Notify the reporter
        await notificationService.sendNotification({
            userId: updatedReport.reporter_id,
            type: 'REPORT_UPDATE',
            title: 'Report Status Updated',
            message: `Your report has been marked as ${status}.`,
            entityId: reportId
        });
        res.json({ message: 'Report status updated', report: updatedReport });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating report' });
    }
};
// 6. Suspend User (POST /api/admin/suspend/:userId)
export const suspendUser = async (req, res) => {
    try {
        const adminId = req.user?.userId;
        const { userId } = req.params;
        const { reason, hours } = req.body;
        if (isNaN(Number(userId)))
            return res.status(400).json({ message: 'Invalid user ID' });
        if (Number(userId) === adminId)
            return res.status(400).json({ message: 'Cannot suspend yourself' });
        const suspensionUntil = hours ? new Date(Date.now() + hours * 60 * 60 * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000); // default 24h
        const result = await pool.query('UPDATE users SET is_suspended = TRUE, suspension_reason = $1, suspension_until = $2 WHERE id = $3 RETURNING id', [reason || 'Violated terms of service', suspensionUntil, userId]);
        if (result.rowCount === 0)
            return res.status(404).json({ message: 'User not found' });
        await pool.query('INSERT INTO admin_logs (admin_id, action, target_id, reason) VALUES ($1, $2, $3, $4)', [adminId, 'suspended_user', userId, reason || 'ToS Violation']);
        await notificationService.sendNotification({
            userId: Number(userId),
            type: 'ACCOUNT_SUSPENDED',
            title: 'Account Suspended',
            message: `Your account has been suspended until ${suspensionUntil.toISOString()} for: ${reason || 'ToS Violation'}.`
        });
        res.json({ message: 'User suspended successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error suspending user' });
    }
};
// 7. Warn User (POST /api/admin/warn/:userId)
export const warnUser = async (req, res) => {
    try {
        const adminId = req.user?.userId;
        const { userId } = req.params;
        const { reason } = req.body;
        if (isNaN(Number(userId)))
            return res.status(400).json({ message: 'Invalid user ID' });
        await pool.query('INSERT INTO admin_logs (admin_id, action, target_id, reason) VALUES ($1, $2, $3, $4)', [adminId, 'warned_user', userId, reason || 'ToS Warning']);
        await notificationService.sendNotification({
            userId: Number(userId),
            type: 'ACCOUNT_SUSPENDED', // could use "ACCOUNT_WARNING" type
            title: 'Account Warning',
            message: `Warning from Admin: ${reason || 'Please follow our Community Guidelines.'}`
        });
        res.json({ message: 'User warned successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error warning user' });
    }
};
