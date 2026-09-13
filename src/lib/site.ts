/**
 * Canonical public origins for flippinCalendar.
 */
export const PRODUCTION_APEX_HOST = "flippincalendar.co.za";
export const PRODUCTION_WWW_HOST = `www.${PRODUCTION_APEX_HOST}`;

export const PRODUCTION_ORIGINS = [
  `https://${PRODUCTION_APEX_HOST}`,
  `https://${PRODUCTION_WWW_HOST}`,
] as const;

/** Canonical production origin — www. */
export const PRODUCTION_APP_ORIGIN = PRODUCTION_ORIGINS[1];

/** Webhooks use the same apex domain. */
export function getWebhooksOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WEBHOOKS_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      // fall through
    }
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_ORIGIN;
  }

  return getAppOrigin();
}

/** Prefer explicit env; fall back to production apex only outside development. */
export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      // fall through
    }
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_ORIGINS[0];
  }

  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  return new URL(`${getAppOrigin()}/`);
}