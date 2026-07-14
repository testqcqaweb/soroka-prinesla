const LABELS = {
  name: "Имя",
  contact: "Контакт",
  service: "Услуга",
  date: "Дата свадьбы",
  message: "Сообщение",
  client_name: "Имя для связи",
  client_contact: "Контакт",
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

function formToObject(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  delete data.website;
  return data;
}

function buildTelegramText(title, data) {
  const lines = [`<b>${title}</b>`, ""];
  for (const [key, value] of Object.entries(data)) {
    const text = String(value || "").trim();
    if (!text) continue;
    const label = LABELS[key] || key;
    lines.push(`<b>${label}:</b> ${escapeHtml(text)}`);
  }
  return lines.join("\n");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function submitToApi(payload) {
  const response = await fetch("/api/lead", {
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

  if (!response.ok) {
    throw new Error(body.error || "Не удалось отправить. Попробуйте ещё раз или напишите в Telegram.");
  }

  return body;
}

function openTelegramFallback(text) {
  const plain = text.replace(/<\/?b>/g, "");
  const url = `https://t.me/sorokaprineslaa?text=${encodeURIComponent(plain.slice(0, 3500))}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function bindForm(formId, statusId, title) {
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
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
      await submitToApi({ title, data, text });
      status.textContent = "Готово! Заявка уже в Telegram.";
      status.classList.add("ok");
      form.reset();
    } catch (error) {
      try {
        openTelegramFallback(text);
        status.textContent =
          "Откройте Telegram и нажмите «Отправить» — так заявка точно дойдёт. Если вкладка не открылась, напишите @sorokaprineslaa.";
        status.classList.add("ok");
      } catch {
        status.textContent = error.message;
        status.classList.add("err");
      }
    } finally {
      if (button) button.disabled = false;
    }
  });
}

bindForm("lead-form", "lead-status", "🕊 Новая заявка — Сорока принесла");
bindForm("brief-form", "brief-status", "📋 Бриф свадебной церемонии");
