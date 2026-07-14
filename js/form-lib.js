export const LABELS = {
  name: "Имя",
  contact: "Контакт",
  service: "Услуга",
  date: "Дата свадьбы",
  message: "Сообщение",
  client_name: "Имя для связи",
  client_phone: "Телефон",
  client_contact: "Telegram",
  bride_fio: "Ф.И.О. невесты, дата рождения",
  groom_fio: "Ф.И.О. жениха, дата рождения",
  bride_job: "Род занятий невесты",
  groom_job: "Род занятий жениха",
  avoid: "Чего НЕ должно быть на торжестве",
  bride_dream: "Невеста — мечта",
  bride_hobby: "Невеста — хобби",
  bride_film: "Невеста — фильм / сериал",
  bride_song: "Невеста — песня / группа",
  bride_childhood: "Невеста — воспоминание из детства",
  bride_personal_dream: "Невеста — личная мечта",
  groom_dream: "Жених — мечта",
  groom_hobby: "Жених — хобби",
  groom_film: "Жених — фильм / сериал",
  groom_song: "Жених — песня / группа",
  groom_childhood: "Жених — воспоминание из детства",
  groom_personal_dream: "Жених — личная мечта",
  shared_dream: "Общая мечта",
  howto_meet: "Как познакомились",
  pair_memory: "Яркое воспоминание пары",
  describe_bride: "Опишите её 3–5 словами",
  describe_groom: "Опишите его 3–5 словами",
  first_meeting: "Первая встреча / впечатления",
  favorite_verse: "Любимый стих",
};

export const DEFAULT_LEAD_API_URL =
  "https://soroka-prinesla-lead.testqcqaweb.workers.dev";

export function getLeadApiUrl(globalObj = globalThis) {
  return globalObj.SOROKA_LEAD_API_URL || DEFAULT_LEAD_API_URL;
}

export function formToObject(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  delete data.website;
  return data;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildTelegramText(title, data) {
  const lines = [`<b>${title}</b>`, ""];
  for (const [key, value] of Object.entries(data)) {
    const text = String(value || "").trim();
    if (!text) continue;
    const label = LABELS[key] || key;
    lines.push(`<b>${label}:</b> ${escapeHtml(text)}`);
  }
  return lines.join("\n");
}

export async function submitToApi(payload, options = {}) {
  const fetchFn = options.fetchImpl || fetch;
  const primary = options.leadApiUrl || getLeadApiUrl();
  const endpoints = [primary, "/api/lead"].filter(Boolean);
  let lastError = new Error("Не удалось отправить заявку.");

  for (const url of endpoints) {
    try {
      const response = await fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let body = {};
      try {
        body = await response.json();
      } catch {
        body = {};
      }

      if (response.ok) return body;
      lastError = new Error(
        body.error || "Не удалось отправить. Напишите напрямую @sorokaprineslaa.",
      );
    } catch (error) {
      lastError = error instanceof Error ? error : lastError;
    }
  }

  throw lastError;
}

export function bindForm(formId, statusId, title, options = {}) {
  const doc = options.document || document;
  const form = doc.getElementById(formId);
  const status = doc.getElementById(statusId);
  if (!form || !status) return null;

  const onSubmit = async (event) => {
    event.preventDefault();
    status.textContent = "";
    status.className = "form-status";

    if (!form.reportValidity()) return;

    const honeypot = form.elements.namedItem("website");
    if (honeypot && String(honeypot.value || "").trim()) {
      status.textContent = "Заявка отправлена. Спасибо!";
      status.classList.add("ok");
      form.reset();
      return;
    }

    const data = formToObject(form);
    const text = buildTelegramText(title, data);
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    status.textContent = "Отправляю…";

    try {
      await submitToApi(
        { title, data, text },
        {
          fetchImpl: options.fetchImpl,
          leadApiUrl: options.leadApiUrl,
        },
      );
      status.textContent = "Готово! Заявка уже у меня в Telegram.";
      status.classList.add("ok");
      form.reset();
    } catch (error) {
      status.textContent =
        error.message ||
        "Не получилось отправить автоматически. Напишите @sorokaprineslaa или наберите +375 29 831-25-54.";
      status.classList.add("err");
    } finally {
      if (button) button.disabled = false;
    }
  };

  form.addEventListener("submit", onSubmit);
  return { form, status, onSubmit };
}
