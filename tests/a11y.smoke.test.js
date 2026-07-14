import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

function loadPage(file) {
  const html = readFileSync(resolve(root, file), "utf8");
  const window = new Window({ url: `https://example.test/${file}` });
  const document = window.document;
  document.write(html);
  return { window, document };
}

describe("accessibility smoke", () => {
  it("index: labeled form controls and aria live status", () => {
    const { document } = loadPage("index.html");

    expect(document.querySelector('html[lang="ru"]')).toBeTruthy();
    expect(document.querySelector(".skip-link")?.getAttribute("href")).toBe("#main");
    expect(document.getElementById("main")).toBeTruthy();

    const form = document.getElementById("lead-form");
    expect(form).toBeTruthy();

    for (const id of ["name", "contact", "service", "message"]) {
      const control = document.getElementById(id);
      const label = document.querySelector(`label[for="${id}"]`);
      expect(control, id).toBeTruthy();
      expect(label, `label for ${id}`).toBeTruthy();
    }

    const status = document.getElementById("lead-status");
    expect(status?.getAttribute("role")).toBe("status");
    expect(status?.getAttribute("aria-live")).toBe("polite");

    const nav = document.querySelector('nav[aria-label="Основная навигация"]');
    expect(nav).toBeTruthy();
    expect(document.querySelector(".nav-toggle")).toBeTruthy();
    expect(document.getElementById("site-nav")).toBeTruthy();
  });

  it("brief: required childhood memories and contacts labeled", () => {
    const { document } = loadPage("brief.html");

    expect(document.getElementById("bride_childhood")?.hasAttribute("required")).toBe(true);
    expect(document.getElementById("groom_childhood")?.hasAttribute("required")).toBe(true);
    expect(document.querySelector('label[for="bride_childhood"]')).toBeTruthy();
    expect(document.querySelector('label[for="client_phone"]')).toBeTruthy();
    expect(document.getElementById("client_phone")?.getAttribute("type")).toBe("tel");
    expect(document.querySelector('label[for="client_contact"]')).toBeTruthy();

    const status = document.getElementById("brief-status");
    expect(status?.getAttribute("aria-live")).toBe("polite");
  });

  it("speaking photos have descriptive alt text", () => {
    const { document } = loadPage("index.html");
    const images = [...document.querySelectorAll("#speaking img")];
    expect(images.length).toBe(3);
    for (const img of images) {
      expect(img.getAttribute("alt")?.length ?? 0).toBeGreaterThan(10);
      expect(img.getAttribute("loading")).toBe("lazy");
    }
  });
});
