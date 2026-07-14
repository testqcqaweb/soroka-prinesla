/**
 * Cloudflare Pages Function: POST /api/lead
 * Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * (токен бота Ари + ваш chat_id)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const payload = await request.json();
    const title = String(payload.title || "Новая заявка").slice(0, 200);
    const textFromClient = String(payload.text || "").trim();
    const data = payload.data && typeof payload.data === "object" ? payload.data : {};

    if (data.website) {
      return json({ ok: true }, 200);
    }

    const text =
      textFromClient ||
      [`<b>${escapeHtml(title)}</b>`, "", ...formatData(data)].join("\n");

    if (text.length < 10) {
      return json({ error: "Пустая заявка" }, 400);
    }

    const token = env.TELEGRAM_BOT_TOKEN;
    const chatId = env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return json(
        {
          error:
            "Бот ещё не настроен. Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в секреты Cloudflare Pages.",
        },
        503,
      );
    }

    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4000),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const tgBody = await tg.json();
    if (!tg.ok || !tgBody.ok) {
      return json(
        {
          error: "Telegram не принял сообщение. Проверьте токен бота Ари и chat_id.",
          details: tgBody.description || null,
        },
        502,
      );
    }

    return json({ ok: true }, 200);
  } catch {
    return json({ error: "Ошибка обработки заявки" }, 500);
  }
}

function formatData(data) {
  return Object.entries(data)
    .filter(([key, value]) => key !== "website" && String(value || "").trim())
    .map(([key, value]) => `<b>${escapeHtml(key)}:</b> ${escapeHtml(String(value).trim())}`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });
}
