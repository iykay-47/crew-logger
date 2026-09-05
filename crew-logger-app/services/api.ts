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

export async function get<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`);
  } catch {
    // fetch only rejects on network-level failures — server down, DNS,
    // blocked by CORS. This is the most likely error in practice, so it
    // gets a message that points at the actual cause.
    throw new ApiError(
      `Can't reach the API at ${BASE_URL}. Is the backend running?`,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      `Request to ${path} failed (${response.status})`,
      response.status,
    );
  }

  return (await response.json()) as T;
}
