import { describe, expect, it, vi } from "vitest";
import {
  LABELS,
  bindForm,
  buildTelegramText,
  escapeHtml,
  formToObject,
  getLeadApiUrl,
  submitToApi,
} from "../js/form-lib.js";

describe("escapeHtml", () => {
  it("escapes dangerous characters", () => {
    expect(escapeHtml(`<b>a&b</b>`)).toBe("&lt;b&gt;a&amp;b&lt;/b&gt;");
  });
});

describe("buildTelegramText", () => {
  it("formats labeled fields and skips empties", () => {
    const text = buildTelegramText("Заявка", {
      name: "Анна",
      contact: " @anna ",
      message: "",
      website: undefined,
    });

    expect(text).toContain("<b>Заявка</b>");
    expect(text).toContain("<b>Имя:</b> Анна");
    expect(text).toContain("<b>Контакт:</b> @anna");
    expect(text).not.toContain("Сообщение");
  });

  it("escapes values so HTML injection is neutralized", () => {
    const text = buildTelegramText("T", { name: "<script>x</script>" });
    expect(text).toContain("&lt;script&gt;x&lt;/script&gt;");
    expect(text).not.toContain("<script>");
  });

  it("covers brief labels for ceremony questionnaire", () => {
    expect(LABELS.bride_fio).toMatch(/невесты/i);
    expect(LABELS.howto_meet).toMatch(/познакомились/i);
    expect(LABELS.avoid).toMatch(/НЕ должно быть/i);
  });
});

describe("formToObject", () => {
  it("drops honeypot website field", () => {
    document.body.innerHTML = `
      <form id="f">
        <input name="name" value="Кирилл" />
        <input name="website" value="spam" />
      </form>
    `;
    const form = document.getElementById("f");
    expect(formToObject(form)).toEqual({ name: "Кирилл" });
  });
});

describe("getLeadApiUrl", () => {
  it("uses override when present", () => {
    expect(getLeadApiUrl({ SOROKA_LEAD_API_URL: "https://example.test/lead" })).toBe(
      "https://example.test/lead",
    );
  });

  it("falls back to production worker", () => {
    expect(getLeadApiUrl({})).toContain("soroka-prinesla-lead");
  });
});

describe("submitToApi", () => {
  it("returns on first successful endpoint", async function () {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const result = await submitToApi(
      { title: "t", text: "hello world" },
      { fetchImpl, leadApiUrl: "https://primary.test" },
    );

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe("https://primary.test");
  });

  it("falls back to /api/lead when primary fails", async function () {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "down" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, via: "pages" }),
      });

    const result = await submitToApi(
      { title: "t", text: "hello world" },
      { fetchImpl, leadApiUrl: "https://primary.test" },
    );

    expect(result).toEqual({ ok: true, via: "pages" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][0]).toBe("/api/lead");
  });

  it("throws when all endpoints fail", async function () {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network"));

    await expect(
      submitToApi({ title: "t", text: "hello world" }, { fetchImpl, leadApiUrl: "https://x" }),
    ).rejects.toThrow(/network|отправить/i);
  });
});

describe("bindForm", () => {
  it("silently accepts honeypot spam", async function () {
    document.body.innerHTML = `
      <form id="lead-form">
        <input name="name" value="Bot" required />
        <input name="website" value="http://spam" />
        <button type="submit">Go</button>
      </form>
      <p id="lead-status" class="form-status"></p>
    `;

    const form = document.getElementById("lead-form");
    form.reportValidity = () => true;

    const fetchImpl = vi.fn();
    bindForm("lead-form", "lead-status", "T", { fetchImpl });

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(document.getElementById("lead-status").textContent).toMatch(/Спасибо/);
    expect(document.getElementById("lead-status").classList.contains("ok")).toBe(true);
  });

  it("shows success after API accepts lead", async function () {
    document.body.innerHTML = `
      <form id="lead-form">
        <input name="name" value="Анна" required />
        <input name="contact" value="+375" required />
        <textarea name="message">Нужна речь</textarea>
        <input name="website" value="" />
        <button type="submit">Go</button>
      </form>
      <p id="lead-status" class="form-status"></p>
    `;

    const form = document.getElementById("lead-form");
    form.reportValidity = () => true;

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    bindForm("lead-form", "lead-status", "Заявка", {
      fetchImpl,
      leadApiUrl: "https://lead.test",
    });

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(document.getElementById("lead-status").textContent).toMatch(/Готово/);
    });

    expect(fetchImpl).toHaveBeenCalled();
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.data.name).toBe("Анна");
    expect(body.text).toContain("Анна");
  });

  it("shows error without opening telegram when API fails", async function () {
    document.body.innerHTML = `
      <form id="lead-form">
        <input name="name" value="Анна" required />
        <input name="contact" value="+375" required />
        <textarea name="message">Нужна речь</textarea>
        <button type="submit">Go</button>
      </form>
      <p id="lead-status" class="form-status"></p>
    `;

    const form = document.getElementById("lead-form");
    form.reportValidity = () => true;

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Сервис недоступен" }),
    });

    bindForm("lead-form", "lead-status", "Заявка", {
      fetchImpl,
      leadApiUrl: "https://lead.test",
    });

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(document.getElementById("lead-status").classList.contains("err")).toBe(true);
    });

    expect(document.getElementById("lead-status").textContent).toContain("Сервис недоступен");
  });
});
