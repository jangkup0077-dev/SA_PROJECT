import { Router } from 'express';
import { getMyProfile, updateProfile, updateMyGames, getAllGames, removeMyGame, getUserProfile } from '../controllers/profileController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = Router();
// Route สำหรับดึงรายชื่อเกมทั้งหมด (ไม่ต้องมี Token ก็ดูได้)
router.get('/all-games', getAllGames);
// Route จัดการโปรไฟล์ของตัวเอง
router.get('/', authenticateToken, getMyProfile);
router.put('/', authenticateToken, updateProfile);
router.post('/games', authenticateToken, updateMyGames);
router.delete('/games/:gameId', authenticateToken, removeMyGame);
// Route สำหรับดูโปรไฟล์คนอื่น
router.get('/:userId', authenticateToken, getUserProfile);
export default router;
