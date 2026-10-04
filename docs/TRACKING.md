# Tracking architecture (Meta Pixel + Conversions API)

```
Browser component ──trackEvent()──► fbq("track", name, params, { eventID })          (Pixel)
                         │
                         └─ ViewContent / AddToCart / InitiateCheckout
                              └─► POST /api/track {…, eventId} ──► sendServerEvent() ──► Graph API /{pixel}/events   (CAPI)

POST /api/orders ──► createOrder() (DB transaction) ──commit──► after(): sendServerEvent("Purchase", order.purchaseEventId)
        └─► response { token } ──► /order-success/[token] ──► PurchaseTracker ──► fbq("track","Purchase",…,{ eventID: order.purchaseEventId })
```

## Files
| File | Role |
|---|---|
| `src/features/tracking/events.ts` | Event names, relay whitelist, `newEventId()` |
| `src/features/tracking/client.ts` | `trackEvent()`, lazy Pixel loader, duplicate suppression, server relay |
| `src/components/tracking/meta-pixel.tsx` | Configures tracking from server config; PageView on navigation |
| `src/components/tracking/purchase-tracker.tsx` | Browser Purchase with the server event id, once per order (localStorage flag) |
| `src/server/tracking/config.ts` | Resolves config: Admin (DB, token decrypted) → env fallback; 30 s cache |
| `src/server/tracking/capi-payload.ts` | Pure payload builder + Meta normalisation/SHA-256 hashing (unit-tested) |
| `src/server/tracking/capi.ts` | Sends events (8 s timeout, never throws), logs Purchase + failures, connection test |
| `src/app/api/track/route.ts` | Accepts only ViewContent / AddToCart / InitiateCheckout (Zod-validated, rate-limited, same-origin) |

## Deduplication
Meta deduplicates a browser and a server event when **event_name + event_id** match (within 48 h).
- Funnel events: the browser creates the id, sends it to the Pixel as `eventID` and to `/api/track` as `eventId`.
- Purchase: the **server** creates `purchaseEventId` inside the order transaction (stored on `Order`), sends CAPI Purchase after commit,
  and the confirmation page fires the Pixel Purchase with that same id. Refreshing the confirmation page does not fire again.
- The browser can never trigger a server Purchase: `/api/track` rejects it.

## User data sent server-side
Hashed with SHA-256 after Meta normalisation: phone (E.164 digits `9647…`), first name, last name, city (district), state (governorate),
country (`iq`), external_id (customer id). Sent as-is (per Meta spec): client IP, user agent, `_fbp`, `_fbc`
(`_fbc` is also created first-party from `fbclid` when the Pixel is blocked).

## Secrets
- `META_CAPI_ACCESS_TOKEN` / admin-entered token never reach the browser; the admin token is AES-256-GCM encrypted with `APP_ENCRYPTION_KEY`.
- The token is sent in the request body to Graph API, never in logs.

## Testing
1. Events Manager → your dataset → **Test events** → copy the code.
2. Admin → Marketing & Tracking → paste into "Test event code", save.
3. Browse, add to cart, place a COD order — server events appear in Test events; browser events with the Meta Pixel Helper.
4. Remove the test code before going live.
