import { pool } from '../config/db.js';

export interface CreateReportData {
  reporterId: number;
  reportedUserId: number;
  reason: string;
  description?: string;
  mediaUrl?: string;
}

export class ReportRepository {
  async createReport(data: CreateReportData) {
    const query = `
      INSERT INTO reports (reporter_id, reported_user_id, reason, description, media_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [data.reporterId, data.reportedUserId, data.reason, data.description || null, data.mediaUrl || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async countReportsWithinLast24Hours(reporterId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) 
      FROM reports
      WHERE reporter_id = $1
      AND created_at > NOW() - INTERVAL '24 hours';
    `;
    const result = await pool.query(query, [reporterId]);
    return parseInt(result.rows[0].count, 10);
  }

  async getReports(status?: string, date?: string, reportedUserId?: number) {
    let query = `
      SELECT r.*,
        reporter.name as reporter_name, rp.display_name as reporter_display_name, rp.profile_image_url as reporter_images,
        reported.name as reported_name, rdp.display_name as reported_display_name, rdp.profile_image_url as reported_images_target
      FROM reports r
      LEFT JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN profiles rp ON reporter.id = rp.user_id
      LEFT JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN profiles rdp ON reported.id = rdp.user_id
      WHERE 1=1 `;
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += `AND r.status = $${paramIndex++} `;
      values.push(status);
    }
    
    if (date) {
      query += `AND DATE(r.created_at) = $${paramIndex++} `;
      values.push(date);
    }

    if (reportedUserId) {
      query += `AND r.reported_user_id = $${paramIndex++} `;
      values.push(reportedUserId);
    }

    query += `ORDER BY r.created_at DESC;`;
    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateReportStatus(reportId: number, status: string) {
    const resolvedAt = status === 'RESOLVED' || status === 'REJECTED' ? new Date() : null;
    let query = `
      UPDATE reports
      SET status = $1, resolved_at = COALESCE($2, resolved_at)
      WHERE id = $3
      RETURNING *;
    `;
    const values = [status, resolvedAt, reportId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export const reportRepository = new ReportRepository();
