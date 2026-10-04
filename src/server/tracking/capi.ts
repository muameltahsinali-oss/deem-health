import "server-only";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { buildRequestBody, buildServerEvent, type CapiCustomDataInput, type CapiUserInput } from "./capi-payload";
import { getTrackingConfig } from "./config";
import type { MetaEventName } from "@/features/tracking/events";

export type SendResult = { status: "SENT" | "FAILED" | "SKIPPED"; httpStatus?: number; error?: string };

const TIMEOUT_MS = 8000;

/**
 * Sends one event to the Meta Conversions API. Never throws.
 * Purchase events and any failure are recorded in TrackingEvent for the admin delivery log.
 */
export async function sendServerEvent(args: {
  name: MetaEventName;
  eventId: string;
  eventSourceUrl?: string | null;
  user: CapiUserInput;
  customData: CapiCustomDataInput;
  orderId?: string;
  eventTime?: Date;
}): Promise<SendResult> {
  const cfg = await getTrackingConfig();
  let result: SendResult;

  if (!cfg.enabled || !cfg.pixelId || !cfg.capiAccessToken) {
    result = { status: "SKIPPED", error: !cfg.enabled ? "tracking_disabled" : "not_configured" };
  } else {
    const event = buildServerEvent({
      name: args.name,
      eventId: args.eventId,
      eventTime: args.eventTime,
      eventSourceUrl: args.eventSourceUrl,
      user: args.user,
      customData: args.customData,
    });
    const body = { ...buildRequestBody([event], cfg.testEventCode), access_token: cfg.capiAccessToken };
    const url = `https://graph.facebook.com/${env.metaGraphApiVersion}/${encodeURIComponent(cfg.pixelId)}/events`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (res.ok) {
        result = { status: "SENT", httpStatus: res.status };
      } else {
        const text = await res.text().catch(() => "");
        result = { status: "FAILED", httpStatus: res.status, error: text.slice(0, 500) };
      }
    } catch (err) {
      result = { status: "FAILED", error: err instanceof Error ? err.message.slice(0, 500) : "network_error" };
    }
  }

  if (args.name === "Purchase" || result.status === "FAILED") {
    try {
      await db.trackingEvent.create({
        data: {
          eventName: args.name,
          eventId: args.eventId,
          status: result.status,
          orderId: args.orderId ?? null,
          httpStatus: result.httpStatus ?? null,
          error: result.error ?? null,
        },
      });
    } catch {
      // logging must never break the caller
    }
  }
  if (result.status === "FAILED") console.error(`[capi] ${args.name} ${args.eventId} failed`, result.httpStatus, result.error);
  return result;
}

/** Lightweight credential check used by the admin "Test connection" button (no event is sent). */
export async function verifyCapiConnection(): Promise<{ ok: boolean; message: string }> {
  const cfg = await getTrackingConfig();
  if (!cfg.pixelId) return { ok: false, message: "لم يتم إدخال معرف البكسل" };
  if (!cfg.capiAccessToken) return { ok: false, message: "لم يتم إدخال رمز Conversions API" };
  try {
    const url = `https://graph.facebook.com/${env.metaGraphApiVersion}/${encodeURIComponent(cfg.pixelId)}?fields=id,name`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${cfg.capiAccessToken}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (res.ok) return { ok: true, message: "تم التحقق من الاتصال بنجاح" };
    const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { ok: false, message: json?.error?.message ?? `فشل التحقق (HTTP ${res.status})` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "تعذر الاتصال بخوادم Meta" };
  }
}
