export type FeatureFlag = keyof typeof featureFlags;

export const featureFlags = {
  // Set via FEATURE_NEW_DASHBOARD=true in .env
  NEW_DASHBOARD: process.env.FEATURE_NEW_DASHBOARD === "true",
  // Set via FEATURE_ONBOARDING_WIZARD=true in .env
  ONBOARDING_WIZARD: process.env.FEATURE_ONBOARDING_WIZARD === "true",
  // Set via FEATURE_I18N=true in .env
  I18N: process.env.FEATURE_I18N === "true",
  // Set via FEATURE_COURSE_REVIEWS=true in .env
  COURSE_REVIEWS: process.env.FEATURE_COURSE_REVIEWS === "true",
  // Set via FEATURE_LIVE_ANALYTICS=true in .env
  LIVE_ANALYTICS: process.env.FEATURE_LIVE_ANALYTICS === "true",
} as const;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
