import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("index.html content & structure", () => {
  const html = read("index.html");

  it("has brand, contacts and services", () => {
    expect(html).toContain("Сорока принесла");
    expect(html).toContain("+375 29 831-25-54");
    expect(html).toContain("@sorokaprineslaa");
    expect(html).toContain("Церемониальные речи");
    expect(html).toContain("Корректировка поздравлений");
    expect(html).toContain("Стихи о молодожёнах");
  });

  it("has examples section with the lake house poem", () => {
    expect(html).toContain('id="examples"');
    expect(html).toContain("Дом у озера");
    expect(html).toContain("колеса обозрения");
    expect(html).toContain("Момент обетов");
  });

  it("has book section for poetry collection", () => {
    expect(html).toContain('id="book"');
    expect(html).toContain("Стих");
    expect(html).toContain("Есть");
    expect(html).toContain("images/stih-est.png");
  });

  it("has speaking section with all BRIDE'S SECRETS photos", () => {
    expect(html).toContain("BRIDE'S SECRETS");
    expect(html).toContain('id="speaking"');
    expect(html).toContain("images/brides-secrets-1.png");
    expect(html).toContain("images/brides-secrets-2.png");
    expect(html).toContain("images/brides-secrets-3.png");
  });

  it("wires lead form and script", () => {
    expect(html).toContain('id="lead-form"');
    expect(html).toContain('id="lead-status"');
    expect(html).toContain('name="website"');
    expect(html).toContain('src="js/form.js"');
    expect(html).toContain('src="js/nav.js"');
    expect(html).toContain("nav-toggle");
  });

  it("exposes skip link and lang", () => {
    expect(html).toMatch(/lang="ru"/);
    expect(html).toContain('href="#main"');
    expect(html).toContain('id="main"');
  });
});

describe("brief.html questionnaire", () => {
  const html = read("brief.html");

  it("covers key ceremony brief fields from the docx", () => {
    const requiredSnippets = [
      "Бриф для свадебной церемонии",
      "bride_fio",
      "groom_fio",
      "avoid",
      "bride_childhood",
      "groom_childhood",
      "howto_meet",
      "pair_memory",
      "shared_dream",
      "favorite_verse",
      "first_meeting",
      "client_phone",
    ];

    for (const snip of requiredSnippets) {
      expect(html, `missing ${snip}`).toContain(snip);
    }
  });

  it("asks bride and groom separately", () => {
    expect(html).toContain("Невеста");
    expect(html).toContain("Жених");
    expect(html).toContain("по отдельности");
  });
});

describe("assets exist", () => {
  it("keeps css, js modules and speaker images", () => {
    const files = [
      "css/styles.css",
      "js/form.js",
      "js/form-lib.js",
      "js/nav.js",
      "worker/lead.js",
      "images/brides-secrets-1.png",
      "images/brides-secrets-2.png",
      "images/brides-secrets-3.png",
      "images/stih-est.png",
    ];

    for (const file of files) {
      expect(existsSync(resolve(root, file)), file).toBe(true);
    }
  });
});

describe("palette & contrast safety net", () => {
  const css = read("css/styles.css");

  it("keeps user palette tokens", () => {
    expect(css).toContain("--color-1: #cb997e");
    expect(css).toContain("--main-bg: #ffe8d6");
    expect(css).toContain("--color-5: #a5a58d");
  });

  it("uses dark readable ink on light backgrounds", () => {
    expect(css).toMatch(/--ink:\s*#3a322c/i);
    expect(css).toMatch(/--feature-desc-color:\s*#5a463a/i);
  });

  it("gives CTA pill generous padding", () => {
    expect(css).toMatch(/\.nav a\.nav-cta\s*\{[^}]*padding:\s*1\.05rem 2\.4rem/s);
    expect(css).toMatch(/\.nav a\.nav-cta\s*\{[^}]*min-height:\s*3\.75rem/s);
    expect(css).toMatch(/\.nav a\.nav-cta\s*\{[^}]*border-radius:\s*999px/s);
    expect(css).toMatch(/\.nav a\.nav-cta\s*\{[^}]*background:\s*var\(--color-3\)/s);
  });
});

describe("favicon and 404", () => {
  it("links favicon assets from pages", () => {
    const index = read("index.html");
    const brief = read("brief.html");
    expect(index).toContain('href="favicon.svg"');
    expect(brief).toContain('href="favicon.svg"');
    expect(existsSync(resolve(root, "favicon.svg"))).toBe(true);
    expect(existsSync(resolve(root, "images/favicon-512.png"))).toBe(true);
  });

  it("has festive lace-themed 404 page", () => {
    const html = read("404.html");
    expect(html).toContain("404");
    expect(html).toContain("nf-lace");
    expect(html).toContain("nf-doily");
    expect(html).not.toContain("nf-ribbon");
    expect(html).toContain("На главную");
    expect(html).toContain("Заполнить бриф");
    expect(existsSync(resolve(root, "css/not-found.css"))).toBe(true);
  });
});

describe("production wiring", () => {
  const formLib = read("js/form-lib.js");
  const workerToml = read("wrangler.lead.toml");

  it("points forms at the deployed worker", () => {
    expect(formLib).toContain("https://soroka-prinesla-lead.testqcqaweb.workers.dev");
  });

  it("names the telegram worker correctly", () => {
    expect(workerToml).toContain('name = "soroka-prinesla-lead"');
  });
});
