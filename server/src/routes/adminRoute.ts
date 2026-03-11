import { Router } from 'express';
import { getAllUsers, banUser, addGame, updateGame, deleteGame, getReports, updateReportStatus, suspendUser, warnUser, unsuspendUser, updateSuspension, unbanUser } from '../controllers/adminController.js';
import { authenticateToken, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// (ต้องมี Token และ Token นั้นต้องมี isAdmin = true)
router.use(authenticateToken, authorizeAdmin);

router.get('/users', getAllUsers);
router.post('/ban/:userId', banUser);
router.post('/unban/:userId', unbanUser);
router.post('/suspend/:userId', suspendUser);
router.patch('/suspend/:userId', updateSuspension);
router.post('/unsuspend/:userId', unsuspendUser);
router.post('/warn/:userId', warnUser);
router.post('/games', addGame);
router.put('/games/:id', updateGame);
router.delete('/games/:id', deleteGame);

router.get('/reports', getReports);
router.patch('/reports/:id/status', updateReportStatus);

export default router;