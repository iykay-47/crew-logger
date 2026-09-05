// Summary API calls. See features/dashboard.md.
//
// These return totals already computed by the backend. Do not add
// aggregation here — that logic lives in the API so every client agrees on
// the numbers. This file only fetches.

import type { ReportPeriod } from '@/types';
import { get } from './api';

/** All-time totals. */
export function getSummary(): Promise<ReportPeriod> {
  return get<ReportPeriod>('/reports/summary');
}

/** Current week, Monday–Sunday. */
export function getWeekly(): Promise<ReportPeriod> {
  return get<ReportPeriod>('/reports/weekly');
}

/** One row per month with records, oldest first. */
export function getMonthly(): Promise<ReportPeriod[]> {
  return get<ReportPeriod[]>('/reports/monthly');
}
