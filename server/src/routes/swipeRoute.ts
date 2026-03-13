import { Router } from 'express';
import { getCandidates, swipeUser, getMyMatches, unmatchUser } from '../controllers/swipeController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/candidates', authenticateToken, getCandidates);
router.post('/', authenticateToken, swipeUser);
router.get('/matches', authenticateToken, getMyMatches);
router.delete('/unmatch/:matchId', authenticateToken, unmatchUser);

router.put('/unmatch/:matchId', authenticateToken, unmatchUser);

export default router;