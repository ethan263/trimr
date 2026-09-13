import { describe, expect, it, afterEach, vi } from "vitest";

import {
  PRODUCTION_APP_ORIGIN,
  PRODUCTION_ORIGINS,
  getAppOrigin,
  getWebhooksOrigin,
} from "@/lib/site";

describe("site canonical helpers", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    vi.unstubAllEnvs();
  });

  it("uses NEXT_PUBLIC_APP_URL when set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://flippincalendar.co.za";
    expect(getAppOrigin()).toBe("https://flippincalendar.co.za");
  });

  it("returns production origin when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getAppOrigin()).toBe("https://flippincalendar.co.za");
  });

  it("uses canonical www origin for webhooks in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getWebhooksOrigin()).toBe("https://www.flippincalendar.co.za");
    expect(PRODUCTION_APP_ORIGIN).toBe("https://www.flippincalendar.co.za");
  });

  it("falls back to localhost in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });
});