import { expect, test, type Page } from "@playwright/test";

/** Block the real Meta script; the stub `fbq` keeps every call in `fbq.queue` for assertions. */
async function blockMeta(page: Page) {
  await page.route("**/connect.facebook.net/**", (route) => route.abort());
  await page.route("**/facebook.com/tr**", (route) => route.abort());
}

async function fbqCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => {
    const w = window as unknown as { fbq?: { queue?: unknown[][] } };
    return (w.fbq?.queue ?? []).map((args) => Array.from(args as ArrayLike<unknown>));
  });
}

test.beforeEach(async ({ page }) => {
  await blockMeta(page);
});

test("browse → search → filter → product → cart → COD checkout → confirmation", async ({ page }) => {
  // Home
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: /السلة/ })).toBeVisible();

  // Search (Arabic spelling variant)
  await page.goto("/shop?q=" + encodeURIComponent("اوميغا"));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("اوميغا");
  await expect(page.getByRole("link", { name: /أوميغا 3/ }).first()).toBeVisible();

  // Category filter
  await page.goto("/category/vitamins");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("فيتامينات");

  // Product page + ViewContent
  await page.goto("/product/vitamin-d3-5000");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("فيتامين د3");
  await page.getByRole("button", { name: "زيادة الكمية" }).first().click();
  await page.getByRole("button", { name: /أضف إلى السلة/ }).first().click();
  await expect(page.getByText("تمت الإضافة إلى السلة")).toBeVisible();

  const calls = await fbqCalls(page);
  expect(calls.some((c) => c[0] === "track" && c[1] === "ViewContent")).toBe(true);
  const atc = calls.find((c) => c[0] === "track" && c[1] === "AddToCart");
  expect(atc?.[3]).toMatchObject({ eventID: expect.stringMatching(/^addtocart\./) });

  // Cart: quantity change + coupon
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "سلة التسوق" })).toBeVisible();
  await page.getByRole("button", { name: "زيادة الكمية" }).first().click();
  await page.getByLabel("كود الخصم").fill("welcome10");
  await page.getByRole("button", { name: "تطبيق" }).click();
  await expect(page.getByText("WELCOME10")).toBeVisible();
  await page.getByRole("link", { name: "إتمام الطلب" }).click();

  // Checkout — guest, Iraq address, COD only
  await expect(page).toHaveURL(/\/checkout/);
  await page.getByLabel("الاسم الكامل").fill("اختبار آلي");
  await page.getByLabel("رقم الهاتف").fill("07709998877");
  await page.getByLabel("المحافظة").selectOption("BGD");
  await page.getByLabel("المنطقة / القضاء").fill("الكرادة");
  await page.getByLabel("العنوان التفصيلي").fill("شارع 62، قرب الساحة، دار 10");
  await expect(page.getByText("الدفع عند الاستلام").first()).toBeVisible();

  const orderResponse = page.waitForResponse((r) => r.url().endsWith("/api/orders") && r.request().method() === "POST");
  await page.getByRole("button", { name: /تأكيد الطلب/ }).click();
  const res = await orderResponse;
  expect(res.status()).toBe(201);
  const body = (await res.json()) as { orderNumber: string; purchaseEventId: string };

  // Confirmation
  await expect(page).toHaveURL(/\/order-success\//);
  await expect(page.getByRole("heading", { name: "تم استلام طلبك بنجاح" })).toBeVisible();
  await expect(page.getByText(body.orderNumber)).toBeVisible();

  // Browser Purchase uses the server-generated event id (dedup with CAPI), exactly once
  await expect
    .poll(async () => (await fbqCalls(page)).filter((c) => c[1] === "Purchase").length)
    .toBe(1);
  const purchase = (await fbqCalls(page)).find((c) => c[1] === "Purchase");
  expect(purchase?.[3]).toEqual({ eventID: body.purchaseEventId });

  // Reload: Purchase must not fire again
  await page.reload();
  await expect(page.getByText(body.orderNumber)).toBeVisible();
  await page.waitForTimeout(500);
  expect((await fbqCalls(page)).filter((c) => c[1] === "Purchase")).toHaveLength(0);

  // Cart is emptied after the order
  await page.goto("/cart");
  await expect(page.getByText("سلتك فارغة")).toBeVisible();
});

test("checkout validates Iraqi phone numbers and required fields", async ({ page }) => {
  await page.goto("/product/vitamin-c-1000");
  await page.getByRole("button", { name: /أضف إلى السلة/ }).first().click();
  await page.goto("/checkout");
  await page.getByLabel("رقم الهاتف").fill("12345");
  await page.getByRole("button", { name: /تأكيد الطلب/ }).click();
  await expect(page.getByText("يرجى إدخال الاسم الكامل")).toBeVisible();
  await expect(page.getByText(/رقم هاتف عراقي غير صحيح/)).toBeVisible();
  await expect(page.getByText("يرجى اختيار المحافظة")).toBeVisible();
});

test("out-of-stock products cannot be added", async ({ page }) => {
  await page.goto("/product/zinc-50");
  await expect(page.getByText("نفد من المخزون").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /نفد من المخزون/ }).first()).toBeDisabled();
});

test("unknown product shows a not-found state", async ({ page }) => {
  const res = await page.goto("/product/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("الصفحة غير موجودة")).toBeVisible();
});
