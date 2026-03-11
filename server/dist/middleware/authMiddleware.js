import jwt from 'jsonwebtoken';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Access Token Required' });
    jwt.verify(token, process.env.JWT_SECRET || 'secret123', (err, user) => {
        if (err)
            return res.status(403).json({ message: 'Invalid Token' });
        req.user = user;
        next();
    });
};
export const authorizeAdmin = (req, res, next) => {
    // ต้องผ่าน authenticateToken มาก่อนถึงจะมี req.user
    if (req.user && req.user.isAdmin) {
        next(); // ให้ผ่านไปทำคำสั่งต่อไปได้
    }
    else {
        res.status(403).json({ message: 'Access denied: Admin only' }); // ไม่ใช่แอดมิน เตะออก!
    }
};
