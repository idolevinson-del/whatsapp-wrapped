// Vercel polyfills a minimal `process.env` for reading environment variables
// even inside Edge Functions (which otherwise run in a Web-standard/Worker
// runtime, not Node) — declared here since our api tsconfig deliberately
// doesn't pull in @types/node (see tsconfig.api.json's lib comment).
declare const process: { env: Record<string, string | undefined> };
