import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
// Register
export const register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // 1. เช็คว่ามี User นี้หรือยัง
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR name = $2', [email, name]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // 2. เข้ารหัส Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // 3. บันทึกลง DB
        const newUser = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email', [name, email, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
// Login
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // 1. หา User จาก Email
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const user = userResult.rows[0];
        // Check if user is suspended
        if (user.is_suspended) {
            const suspensionUntil = new Date(user.suspension_until);
            if (suspensionUntil > new Date()) {
                return res.status(403).json({
                    message: `Account is suspended until ${suspensionUntil.toLocaleString()}`,
                    reason: user.suspension_reason
                });
            }
        }
        // 2. ตรวจสอบ Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // 3. สร้าง Token (JWT) แนบ is_admin ไปด้วย
        const token = jwt.sign({ userId: user.id, name: user.name, isAdmin: user.is_admin }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
        res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, isAdmin: user.is_admin } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
// Get current user (GET /auth/me)
export const getMe = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const userResult = await pool.query('SELECT id, name, email, is_admin FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0)
            return res.status(404).json({ message: 'User not found' });
        res.json(userResult.rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
