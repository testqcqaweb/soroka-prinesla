import { describe, expect, it, vi } from "vitest";
import {
  corsHeaders,
  escapeHtml,
  formatData,
  handleLeadRequest,
} from "../worker/lead.js";

function postJson(body) {
  return new Request("https://lead.test/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("worker helpers", () => {
  it("escapes html", () => {
    expect(escapeHtml("<x>&")).toBe("&lt;x&gt;&amp;");
  });

  it("formats data and skips empties/honeypot", () => {
    const lines = formatData({ name: "Аня", message: "  ", website: "x" });
    expect(lines).toEqual(["<b>name:</b> Аня"]);
  });
});

describe("handleLeadRequest", () => {
  it("answers OPTIONS with CORS", async function () {
    const res = await handleLeadRequest(
      new Request("https://lead.test/", { method: "OPTIONS" }),
      {},
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      corsHeaders["Access-Control-Allow-Origin"],
    );
  });

  it("rejects non-POST", async function () {
    const res = await handleLeadRequest(new Request("https://lead.test/", { method: "GET" }), {});
    expect(res.status).toBe(405);
  });

  it("silently accepts honeypot", async function () {
    const fetchImpl = vi.fn();
    const res = await handleLeadRequest(
      postJson({ title: "t", data: { website: "bot", name: "x" }, text: "long enough" }),
      { TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1" },
      fetchImpl,
    );
    expect(res.status).toBe(200);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects empty payload", async function () {
    const res = await handleLeadRequest(
      postJson({ title: "t", text: "short", data: {} }),
      { TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1" },
      vi.fn(),
    );
    expect(res.status).toBe(400);
  });

  it("returns 503 when secrets missing", async function () {
    const res = await handleLeadRequest(
      postJson({ title: "t", text: "long enough text here", data: { name: "A" } }),
      {},
      vi.fn(),
    );
    expect(res.status).toBe(503);
  });

  it("forwards message to Telegram API", async function () {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const res = await handleLeadRequest(
      postJson({
        title: "Новая заявка",
        text: "<b>Новая заявка</b>\nИмя: Анна",
        data: { name: "Анна" },
      }),
      { TELEGRAM_BOT_TOKEN: "123:ABC", TELEGRAM_CHAT_ID: "228791147" },
      fetchImpl,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://api.telegram.org/bot123:ABC/sendMessage",
    );
    const tgBody = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(tgBody.chat_id).toBe("228791147");
    expect(tgBody.parse_mode).toBe("HTML");
    expect(tgBody.text).toContain("Анна");
  });

  it("returns 502 when Telegram rejects", async function () {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false, description: "Forbidden" }),
    });

    const res = await handleLeadRequest(
      postJson({ title: "t", text: "long enough text here", data: {} }),
      { TELEGRAM_BOT_TOKEN: "123:ABC", TELEGRAM_CHAT_ID: "1" },
      fetchImpl,
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.details).toBe("Forbidden");
  });

  it("builds text from data when client text absent", async function () {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const res = await handleLeadRequest(
      postJson({
        title: "Бриф",
        data: { bride_fio: "Иванова Анна", howto_meet: "В университете" },
      }),
      { TELEGRAM_BOT_TOKEN: "123:ABC", TELEGRAM_CHAT_ID: "1" },
      fetchImpl,
    );

    expect(res.status).toBe(200);
    const tgBody = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(tgBody.text).toContain("Иванова Анна");
    expect(tgBody.text).toContain("В университете");
  });
});
