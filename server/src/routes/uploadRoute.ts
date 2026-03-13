import { Router } from 'express';
import { upload } from '../config/cloudinary.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// ล็อกอินก่อนถึงจะอัปโหลดได้ (ป้องกันคนแกล้งยิง API)
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // ส่ง URL กลับไปให้หน้าบ้าน (รองรับทั้งรูปและวิดีโอ)
    res.json({ url: req.file.path });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

export default router;