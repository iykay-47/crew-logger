// Shapes returned by crew-logger-api. See ../docs/data-model.md.
//
// All timestamps arrive as ISO strings, not Date objects — JSON has no date
// type. Parse at the point of use; don't assume these are Dates.

export type JobStatus =
  | 'draft'
  | 'submitted'
  | 'pending_confirmation'
  | 'confirmed'
  | 'disputed'
  | 'expired';

export type JobSource = 'app_entry' | 'historic_import';

/** One person's row on a job. `claims` is the only per-person data — run
 *  data (miles, times, stations) is shared on the job itself. */
export interface Participation {
  id: string;
  job_id: string;
  employee_number: string;
  claims: Record<string, unknown> | null;
}

/** The shared run record, co-owned by the crew. */
export interface Job {
  job_id: string;

  // Identity. train_id is NOT unique — the same designator recurs on
  // different dates. job_id is the only key.
  train_id: string;
  original_train_id: string | null;
  record_date: string; // YYYY-MM-DD

  // Route
  origin_station: string | null;
  final_station: string | null;

  // Times. start_time is distinct from on_duty — typically 15 min apart.
  start_time: string | null;
  on_duty: string | null;
  initial_os: string | null;
  final_os: string | null;
  off_duty: string | null;

  // Measurements
  run_miles: number | null;
  train_length: number | null;
  cars: number | null;

  /** Computed by the database from on_duty/off_duty. Read-only — the API
   *  rejects any attempt to write it. */
  work_minutes: number | null;

  status: JobStatus;
  source: JobSource;
  last_edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  updated_at: string;

  participation: Participation[];
}

/**
 * Body for POST /entries — exactly the fields the API's JobCreate accepts.
 *
 * Do not add anything else. The API **silently discards** unknown fields
 * rather than rejecting them (verified: posting `axles` returns 201 and the
 * value vanishes), so a stray key fails invisibly. In particular never send
 * `work_minutes` (computed by the database), `status`, or `source` (both set
 * by the server).
 *
 * `edited_by` exists only because there is no auth yet; Phase 2 replaces it
 * with the identity from the JWT.
 */
export interface JobCreatePayload {
  train_id: string;
  record_date: string; // YYYY-MM-DD
  edited_by: string;

  original_train_id: string | null;
  origin_station: string | null;
  final_station: string | null;

  start_time: string | null;
  on_duty: string | null;
  initial_os: string | null;
  final_os: string | null;
  off_duty: string | null;

  run_miles: number | null;
  train_length: number | null;
  cars: number | null;
}

/** One period's totals from the reports endpoints.
 *  Minutes are raw — formatting to "7h 30m" is this app's job. */
export interface ReportPeriod {
  period: string; // "all-time", a date range, or "2026-01"
  job_count: number;
  total_work_minutes: number;
  total_miles: number;
  average_work_minutes_per_job: number;
}
