// Great Minds Daemon — Telegram Notifications
// Sends pipeline status updates to Telegram via Bot API (no npm packages).

import { log, logError } from "./logger.js";

// ─── Types ─────────────────────────────────────────────────

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export type Urgency = "info" | "warning" | "critical";

interface TelegramResponse {
  ok: boolean;
  result?: { message_id: number; [key: string]: unknown };
  description?: string;
}

interface TelegramUpdate {
  update_id: number;
  callback_query?: {
    id: string;
    data: string;
    message?: { message_id: number };
  };
}

// ─── Config ────────────────────────────────────────────────

function getConfig(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";
  return {
    botToken,
    chatId,
    enabled: botToken.length > 0 && chatId.length > 0,
  };
}

function apiUrl(token: string, method: string): string {
  return `https://api.telegram.org/bot${token}/${method}`;
}

// ─── Urgency Emoji ─────────────────────────────────────────

function urgencyPrefix(urgency: Urgency): string {
  switch (urgency) {
    case "critical":
      return "CRITICAL";
    case "warning":
      return "WARNING";
    case "info":
      return "INFO";
  }
}

// ─── Core Send ─────────────────────────────────────────────

async function sendRequest(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<TelegramResponse | null> {
  try {
    const resp = await fetch(apiUrl(token, method), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await resp.json()) as TelegramResponse;
    if (!data.ok) {
      logError(`Telegram API error (${method})`, new Error(data.description || "Unknown"));
    }
    return data;
  } catch (err) {
    logError(`Telegram request failed (${method})`, err);
    return null;
  }
}

// ─── Public API ────────────────────────────────────────────

/**
 * Send a plain-text notification to the configured Telegram chat.
 * Silently no-ops if Telegram is not configured.
 */
export async function notify(message: string, urgency: Urgency = "info"): Promise<void> {
  const cfg = getConfig();
  if (!cfg.enabled) return;

  const text = `[${urgencyPrefix(urgency)}] Great Minds Daemon\n\n${message}`;
  log(`TELEGRAM: Sending ${urgency} notification`);

  await sendRequest(cfg.botToken, "sendMessage", {
    chat_id: cfg.chatId,
    text,
    parse_mode: "Markdown",
  });
}

/**
 * Send a message with inline keyboard buttons.
 * Returns the message_id so callers can poll for button responses.
 */
export async function notifyWithButtons(
  message: string,
  buttons: string[][],
): Promise<number | null> {
  const cfg = getConfig();
  if (!cfg.enabled) return null;

  const inlineKeyboard = buttons.map((row) =>
    row.map((label) => ({ text: label, callback_data: label })),
  );

  log("TELEGRAM: Sending message with buttons");
  const resp = await sendRequest(cfg.botToken, "sendMessage", {
    chat_id: cfg.chatId,
    text: message,
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: inlineKeyboard },
  });

  return resp?.result?.message_id ?? null;
}

/**
 * Poll for a callback_query response to a specific message.
 * Waits up to `timeout` ms, polling every 2 seconds.
 * Returns the callback_data string, or null if no response within timeout.
 */
export async function pollForResponse(
  messageId: number,
  timeout: number = 60_000,
): Promise<string | null> {
  const cfg = getConfig();
  if (!cfg.enabled) return null;

  const deadline = Date.now() + timeout;
  let offset = 0;

  while (Date.now() < deadline) {
    const resp = await sendRequest(cfg.botToken, "getUpdates", {
      offset,
      timeout: 2,
      allowed_updates: ["callback_query"],
    });

    if (resp?.ok && Array.isArray(resp.result)) {
      const updates = resp.result as unknown as TelegramUpdate[];
      for (const update of updates) {
        offset = update.update_id + 1;
        if (
          update.callback_query?.message?.message_id === messageId &&
          update.callback_query?.data
        ) {
          // Acknowledge the callback
          await sendRequest(cfg.botToken, "answerCallbackQuery", {
            callback_query_id: update.callback_query.id,
          });
          return update.callback_query.data;
        }
      }
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return null;
}

/**
 * Convenience: notify about a pipeline phase transition.
 */
export async function notifyPhase(
  project: string,
  phase: string,
  status: "start" | "done" | "error",
  detail?: string,
): Promise<void> {
  const urgency: Urgency = status === "error" ? "critical" : "info";
  const statusLabel = status === "start" ? "STARTED" : status === "done" ? "COMPLETED" : "FAILED";
  const msg = `*${project}* | Phase: *${phase}* | ${statusLabel}${detail ? `\n${detail}` : ""}`;
  await notify(msg, urgency);
}
