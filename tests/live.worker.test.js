import { describe, expect, it } from "vitest";
import { DEFAULT_LEAD_API_URL } from "../js/form-lib.js";

const RUN_LIVE = process.env.SOROKA_LIVE_TEST === "1";

describe.runIf(RUN_LIVE)("live worker smoke", () => {
  it("accepts a probe payload", async function () {
    const res = await fetch(DEFAULT_LEAD_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Vitest live probe",
        text: "<b>Vitest live probe</b>\nАвтопроверка доставки.",
        data: { name: "vitest", contact: "ci" },
      }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  }, 20000);
});
