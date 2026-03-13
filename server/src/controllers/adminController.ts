import { Response } from 'express';
import { pool } from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { io } from '../index.js';
import { reportService } from '../services/reportService.js';
import { notificationService } from '../services/notificationService.js';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.is_admin, u.is_suspended, u.suspension_reason, u.suspension_until, u.created_at, u.last_active_at,
             p.display_name, p.birth_date, p.country,
             EXISTS(SELECT 1 FROM user_bans WHERE user_id = u.id AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)) as is_banned
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

    // Real-time Force Logout
    io.to(`user_${userId}`).emit('moderation_action', { status: 'BANNED', message: 'Your account has been banned' });

    res.json({ message: 'User has been banned successfully' });
  } catch (err: any) {
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

export const updateGame = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const { game_name, game_icon_url } = req.body;

    if (!game_name) return res.status(400).json({ message: 'Game name is required' });

    const updatedGame = await pool.query(
      'UPDATE games SET game_name = $1, game_icon_url = $2 WHERE id = $3 RETURNING *',
      [game_name, game_icon_url || '', id]
    );

    if (updatedGame.rowCount === 0) return res.status(404).json({ message: 'Game not found' });

    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id) VALUES ($1, $2, $3)',
      [adminId, 'updated_game', id]
    );

    res.json({ message: 'Game updated successfully', game: updatedGame.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteGame = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;

    const deleteResult = await pool.query(
      'DELETE FROM games WHERE id = $1 RETURNING id',
      [id]
    );

    if (deleteResult.rowCount === 0) return res.status(404).json({ message: 'Game not found' });

    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id) VALUES ($1, $2, $3)',
      [adminId, 'deleted_game', id]
    );

    res.json({ message: 'Game deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const { status, date, reportedUserId } = req.query;
    const reports = await reportService.getAllReports(
      status as string, 
      date as string, 
      reportedUserId ? Number(reportedUserId) : undefined
    );
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving reports' });
  }
};

export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const reportId = parseInt(req.params.id);
    const { status } = req.body;

    const updatedReport = await reportService.updateReportStatus(reportId, status);
    
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id, reason) VALUES ($1, $2, $3, $4)',
      [adminId, `updated_report_${status.toLowerCase()}`, reportId, 'Report moderation']
    );

    await notificationService.sendNotification({
      userId: updatedReport.reporter_id,
      type: 'REPORT_UPDATE',
      title: 'Report Status Updated',
      message: `Your report has been marked as ${status}.`,
      entityId: reportId
    });

    res.json({ message: 'Report status updated', report: updatedReport });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating report' });
  }
};

export const suspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { userId } = req.params;
    const { reason, hours } = req.body;

    if (isNaN(Number(userId))) return res.status(400).json({ message: 'Invalid user ID' });
    if (Number(userId) === adminId) return res.status(400).json({ message: 'Cannot suspend yourself' });
    
    const suspensionUntil = hours ? new Date(Date.now() + hours * 60 * 60 * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await pool.query(
      'UPDATE users SET is_suspended = TRUE, suspension_reason = $1, suspension_until = $2 WHERE id = $3 RETURNING id',
      [reason || 'Violated terms of service', suspensionUntil, userId]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });

    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id, reason) VALUES ($1, $2, $3, $4)',
      [adminId, 'suspended_user', userId, reason || 'ToS Violation']
    );

    await notificationService.sendNotification({
      userId: Number(userId),
      type: 'ACCOUNT_SUSPENDED',
      title: 'Account Suspended',
      message: `Your account has been suspended until ${suspensionUntil.toLocaleString()} for: ${reason || 'ToS Violation'}.`
    });

    // Real-time disable UI
    io.to(`user_${userId}`).emit('moderation_action', { 
        status: 'SUSPENDED', 
        suspension_until: suspensionUntil,
        reason: reason || 'ToS Violation'
    });

    res.json({ message: 'User suspended successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error suspending user' });
  }
};

export const warnUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { userId } = req.params;
    const { reason } = req.body;

    if (isNaN(Number(userId))) return res.status(400).json({ message: 'Invalid user ID' });

    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id, reason) VALUES ($1, $2, $3, $4)',
      [adminId, 'warned_user', userId, reason || 'ToS Warning']
    );

    await notificationService.sendNotification({
      userId: Number(userId),
      type: 'REPORT_UPDATE', 
      title: 'Account Warning',
      message: `Warning from Admin: ${reason || 'Please follow our Community Guidelines.'}`
    });

    res.json({ message: 'User warned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error warning user' });
  }
};

export const unsuspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { userId } = req.params;
    if (isNaN(Number(userId))) return res.status(400).json({ message: 'Invalid user ID' });
    const result = await pool.query(
      'UPDATE users SET is_suspended = FALSE, suspension_reason = NULL, suspension_until = NULL WHERE id = $1 RETURNING id',
      [userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id, reason) VALUES ($1, $2, $3, $4)',
      [adminId, 'unsuspended_user', userId, 'Administrative action']
    );
    await notificationService.sendNotification({
      userId: Number(userId),
      type: 'ACCOUNT_RESTORED',
      title: 'Account Restored',
      message: 'Your account suspension has been lifted by an administrator.'
    });

    // Real-time enable UI
    io.to(`user_${userId}`).emit('moderation_action', { status: 'ACTIVE' });

    res.json({ message: 'User unsuspended successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error unsuspending user' });
  }
};

export const updateSuspension = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { userId } = req.params;
    const { reason, hours } = req.body;
    if (isNaN(Number(userId))) return res.status(400).json({ message: 'Invalid user ID' });
    const suspensionUntil = new Date(Date.now() + (hours || 24) * 60 * 60 * 1000);
    const result = await pool.query(
      'UPDATE users SET suspension_reason = $1, suspension_until = $2 WHERE id = $3 AND is_suspended = TRUE RETURNING id',
      [reason || 'Updated suspension reason', suspensionUntil, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found or not suspended' });
    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id, reason) VALUES ($1, $2, $3, $4)',
      [adminId, 'updated_suspension', userId, reason || 'Duration/Reason update']
    );
    await notificationService.sendNotification({
      userId: Number(userId),
      type: 'ACCOUNT_SUSPENDED',
      title: 'Suspension Updated',
      message: `Your suspension has been updated. New end date: ${suspensionUntil.toLocaleString()}. Reason: ${reason}`
    });

    // Real-time update UI
    io.to(`user_${userId}`).emit('moderation_action', { 
        status: 'SUSPENDED', 
        suspension_until: suspensionUntil,
        reason: reason
    });

    res.json({ message: 'Suspension updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating suspension' });
  }
};

export const unbanUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { userId } = req.params;

    if (isNaN(Number(userId))) return res.status(400).json({ message: 'Invalid user ID' });

    await pool.query(
      'DELETE FROM user_bans WHERE user_id = $1',
      [userId]
    );

    await pool.query(
      'INSERT INTO admin_logs (admin_id, action, target_id, reason) VALUES ($1, $2, $3, $4)',
      [adminId, 'UNBANNED_USER', userId, 'Administrative action']
    );

    res.json({ message: 'User has been unbanned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error unbanning user' });
  }
};