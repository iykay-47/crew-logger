// Job entry API calls. See features/history.md and features/new-entry.md.

import type { Job, JobCreatePayload } from '@/types';
import { get, post } from './api';

/** All job records, newest first (the API sorts by record_date desc). */
export function getEntries(): Promise<Job[]> {
  return get<Job[]>('/entries');
}

export function getEntry(jobId: string): Promise<Job> {
  return get<Job>(`/entries/${jobId}`);
}

/** Create a job record. The server sets status/source, computes
 *  work_minutes, and writes the job_edits audit row. */
export function createEntry(payload: JobCreatePayload): Promise<Job> {
  return post<Job>('/entries', payload);
}
