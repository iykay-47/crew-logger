// Job entry API calls. See features/history.md.

import type { Job } from '@/types';
import { get } from './api';

/** All job records, newest first (the API sorts by record_date desc). */
export function getEntries(): Promise<Job[]> {
  return get<Job[]>('/entries');
}

export function getEntry(jobId: string): Promise<Job> {
  return get<Job>(`/entries/${jobId}`);
}
