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

/** Falls back to `useMock` unless the domain's own flag is set explicitly. */
const flag = (value: string | undefined): boolean =>
  value != null ? value !== "false" : useMock

export const config = {
  /** When true, data services return in-memory mock data instead of calling the API. */
  useMock,
  /** When true, auth is the client-side demo; false calls the real /auth backend. */
  useMockAuth: flag(process.env.NEXT_PUBLIC_USE_MOCK_AUTH),
  /**
   * Inventory, orders and purchases have their own flags because their backend
   * routers are still stubs — the dashboard can go live while they stay mocked.
   * Drop these once /inventory, /orders and /purchase-orders exist.
   */
  useMockInventory: flag(process.env.NEXT_PUBLIC_USE_MOCK_INVENTORY),
  useMockOrders: flag(process.env.NEXT_PUBLIC_USE_MOCK_ORDERS),
  useMockPurchases: flag(process.env.NEXT_PUBLIC_USE_MOCK_PURCHASES),
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
} as const
