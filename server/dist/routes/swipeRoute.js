import { Router } from 'express';
import { getCandidates, swipeUser, getMyMatches } from '../controllers/swipeController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = Router();
router.get('/candidates', authenticateToken, getCandidates);
router.post('/', authenticateToken, swipeUser);
router.get('/matches', authenticateToken, getMyMatches);
export default router;
