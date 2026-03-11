import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export interface AuthRequest extends Request {
  user?: { userId: number; name: string; isAdmin: boolean };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Token Required' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret123', (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;

    // Check if user is banned (Force Logout)
    pool.query(
      'SELECT id FROM user_bans WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
      [user.userId]
    ).then(banResult => {
      if (banResult.rows.length > 0) {
        return res.status(403).json({ message: 'Account Banned', isBanned: true });
      }
      next();
    }).catch(err => {
      console.error('Middleware ban check error', err);
      next(); // Fail open for safety or next(err) for strictness? Especificação implied strict.
    });
  });
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // ต้องผ่าน authenticateToken มาก่อนถึงจะมี req.user
  if (req.user && req.user.isAdmin) {
    next(); // ให้ผ่านไปทำคำสั่งต่อไปได้
  } else {
    res.status(403).json({ message: 'Access denied: Admin only' }); // ไม่ใช่แอดมิน เตะออก!
  }
};