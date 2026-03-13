import { reportService } from '../services/reportService.js';
export const createReport = async (req, res) => {
    try {
        const reporterId = req.user?.userId;
        const { reportedUserId, reason, description } = req.body;
        if (!reporterId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!reportedUserId || !reason) {
            return res.status(400).json({ message: 'Missing required report fields' });
        }
        const newReport = await reportService.submitReport({
            reporterId,
            reportedUserId,
            reason,
            description
        });
        res.status(201).json({ message: 'Report submitted successfully', report: newReport });
    }
    catch (error) {
        if (error.message === 'You cannot report yourself.' || error.message.includes('rate limit')) {
            return res.status(400).json({ message: error.message });
        }
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Internal server error while creating report' });
    }
};
