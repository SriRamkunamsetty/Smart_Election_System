import { createServerFn } from "@tanstack/react-start";

export const getMapsKey = createServerFn({ method: "GET" }).handler(async () => {
  // Frontend-loaded JS Maps key. Restrict by HTTP referrer in Google Cloud Console.
  return { key: process.env.GOOGLE_MAPS_API_KEY ?? "" };
});
