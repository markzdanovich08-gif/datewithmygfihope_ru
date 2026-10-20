// Netlify Function: keeps the Telegram bot token on the server, not in the browser.
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Netlify environment variables." })
    };
  }

  let data;
  try { data = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  if (!Array.isArray(data.places) || data.places.length !== 3 || !data.date || !data.time) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing date, time, or top-three places." }) };
  }

  const safe = (value) => String(value).replace(/[<>]/g, "");
  const message = [
    "💌 Новый план свидания!",
    "",
    "💗 Топ-3 места:",
    ...data.places.map((place, i) => `${i + 1}. ${safe(place)}`),
    "",
    `📅 Дата: ${safe(data.date)}`,
    `🕰 Время: ${safe(data.time)}`,
    `🌍 Часовой пояс: ${safe(data.timezone || "не указан")}`
  ].join("\n");

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
    const telegramData = await telegramResponse.json();
    if (!telegramResponse.ok || !telegramData.ok) {
      console.error("Telegram API error:", telegramData.description || telegramResponse.status);
      return { statusCode: 502, headers, body: JSON.stringify({ error: "Telegram API rejected the message." }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    console.error("Telegram request failed:", error.message);
    return { statusCode: 502, headers, body: JSON.stringify({ error: "Could not reach Telegram." }) };
  }
};