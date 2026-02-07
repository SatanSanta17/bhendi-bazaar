/**
 * Admin Log Service
 * Business logic for activity logging
 */

import { adminLogRepository } from "../../repositories/admin/logRepository";
import type { LogFilters, LogResult } from "../../domain/admin/log";

export class AdminLogService {
  /**
   * Get paginated logs with filters
   */
  async getLogs(filters: LogFilters): Promise<LogResult> {
    const { logs, total } = await adminLogRepository.getLogs(filters);

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

export const adminLogService = new AdminLogService();


