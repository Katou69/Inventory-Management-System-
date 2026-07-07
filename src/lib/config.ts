/**
 * Runtime configuration for the data layer.
 *
 * The dashboard ships with an in-memory mock adapter so it runs with zero
 * backend. To point it at a real API, set the following env vars (see
 * `.env.example`):
 *
 *   NEXT_PUBLIC_USE_MOCK_API=false
 *   NEXT_PUBLIC_API_URL=https://api.your-backend.com
 *
 * Every data access goes through `src/services/*`, so these flags are the
 * only switch needed to move from mock data to live data.
 *
 * Auth is controlled separately (`useMockAuth`) so the real login flow can be
 * tested against the backend while the resource endpoints (dashboard, inventory,
 * …) are still placeholders and thus stay on mock data. It defaults to the value
 * of `useMock` unless `NEXT_PUBLIC_USE_MOCK_AUTH` is set explicitly.
 */
const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false"

export const config = {
  /** When true, data services return in-memory mock data instead of calling the API. */
  useMock,
  /** When true, auth is the client-side demo; false calls the real /auth backend. */
  useMockAuth:
    process.env.NEXT_PUBLIC_USE_MOCK_AUTH != null
      ? process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false"
      : useMock,
  /** Base URL of the backend API (used when a service is in live mode). */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
} as const
