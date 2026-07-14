// Re-export types from api-types.ts for backward compatibility.
// All mock data has been removed — real API data is used instead.
export type { DashboardChartData } from "./api-types";

// Deprecated — always false, kept only for backward compat
export const MOCK_ENABLED = false;
export const MOCK_DASHBOARD_CHARTS = null as any;
