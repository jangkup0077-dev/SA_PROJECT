import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = Router();
// ต้องล็อกอินทุกครั้งที่จะแชท
router.get('/:matchId', authenticateToken, getMessages);
router.post('/:matchId', authenticateToken, sendMessage);
export default router;
