// Shared Zod schemas + inferred types. The API validates request bodies with
// these and the web client derives its TypeScript types from the same schemas
// (z.infer), so frontend/backend types can't drift apart.
export * from "./auth";
