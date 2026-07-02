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
 * Every data access goes through `src/services/*`, so these two flags are the
 * only switch needed to move from mock data to live data.
 */
export const config = {
  /** When true, services return in-memory mock data instead of calling the API. */
  useMock: process.env.NEXT_PUBLIC_USE_MOCK_API !== "false",
  /** Base URL of the backend API (used only when `useMock` is false). */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
} as const
