import { reportRepository, CreateReportData } from '../repositories/reportRepository.js';

export class ReportService {
  async submitReport(data: CreateReportData) {
    if (data.reporterId === data.reportedUserId) {
      throw new Error("You cannot report yourself.");
    }

    // Rate Limiting check: max 3 reports per 24 hours
    const recentReportsCount = await reportRepository.countReportsWithinLast24Hours(data.reporterId);
    if (recentReportsCount >= 3) {
      throw new Error("Report rate limit exceeded. You can only submit 3 reports per 24 hours.");
    }

    const newReport = await reportRepository.createReport(data);
    return newReport;
  }

  async getAllReports(status?: string, date?: string, reportedUserId?: number) {
    return await reportRepository.getReports(status, date, reportedUserId);
  }

  async updateReportStatus(reportId: number, status: string) {
    const validStatuses = ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    return await reportRepository.updateReportStatus(reportId, status);
  }
}

export const reportService = new ReportService();
