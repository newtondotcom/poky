// Bun's type declarations (pulled in transitively through @poky/db -> drizzle-orm/bun-sql)
// augment the global `typeof fetch` with a `preconnect` method that browser fetch
// implementations don't have. The cast keeps connect-web's `fetch` option happy.
export const fetchWithCredentials = ((input, init) =>
  fetch(input, { ...init, credentials: "include" })) as typeof fetch;
