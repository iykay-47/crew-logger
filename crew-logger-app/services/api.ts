// HTTP client for crew-logger-api. See ../docs/deployment.md.
//
// The base URL comes from app.json `extra.apiBaseUrl` so it can change per
// environment without touching code:
//
//   - Browser on this machine: http://localhost:8000 (the default)
//   - Physical phone:          http://<this-machine's-LAN-IP>:8000, and the
//                              API must bind 0.0.0.0 instead of 127.0.0.1
//   - Behind a reverse proxy:  "/api" (same origin, so no CORS involved)
//
// React Native and browsers both provide fetch, so there's no HTTP package.

import Constants from 'expo-constants';

const BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const UNREACHABLE = `Can't reach the API at ${BASE_URL}. Is the backend running?`;

/**
 * Turn an error response body into one readable sentence.
 *
 * FastAPI returns `detail` in two different shapes and both reach us:
 *   - a plain string, from our own HTTPException(detail=str(e)) — the
 *     business rules in app/services/entries.py
 *   - a list of objects, from Pydantic's own request validation
 *
 * Rendering the list directly gives the user "[object Object]", so flatten
 * it, prefixing each message with the field it came from.
 */
async function describeError(response: Response, path: string): Promise<string> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return `Request to ${path} failed (${response.status})`;
  }

  const detail = (body as { detail?: unknown })?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        const { loc, msg } = (item ?? {}) as { loc?: unknown[]; msg?: string };
        if (!msg) return null;
        // loc looks like ["body", "run_miles"] — the last entry is the field.
        const field = Array.isArray(loc) ? loc[loc.length - 1] : undefined;
        return field && field !== 'body' ? `${field}: ${msg}` : msg;
      })
      .filter(Boolean);
    if (messages.length) return messages.join('\n');
  }

  return `Request to ${path} failed (${response.status})`;
}

export async function get<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`);
  } catch {
    // fetch only rejects on network-level failures — server down, DNS,
    // blocked by CORS. This is the most likely error in practice, so it
    // gets a message that points at the actual cause.
    throw new ApiError(UNREACHABLE);
  }

  if (!response.ok) {
    throw new ApiError(await describeError(response, path), response.status);
  }

  return (await response.json()) as T;
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(UNREACHABLE);
  }

  if (!response.ok) {
    throw new ApiError(await describeError(response, path), response.status);
  }

  return (await response.json()) as T;
}
