import { expect, test } from "@playwright/test";

const EMAIL = process.env.ADMIN_EMAIL ?? "";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "";

test.skip(!EMAIL || !PASSWORD, "Set ADMIN_EMAIL / ADMIN_PASSWORD (same as the seeded admin) to run admin E2E tests.");

test("admin routes are protected", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("rejects wrong credentials", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(EMAIL);
  await page.getByLabel("كلمة المرور").fill("definitely-wrong-password");
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page.getByText("البريد الإلكتروني أو كلمة المرور غير صحيحة.")).toBeVisible();
});

test("admin can log in, see the dashboard, process an order and edit stock", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("البريد الإلكتروني").fill(EMAIL);
  await page.getByLabel("كلمة المرور").fill(PASSWORD);
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.getByRole("heading", { name: "نظرة عامة" })).toBeVisible();
  await expect(page.getByText("الإيرادات").first()).toBeVisible();

  // Orders → first pending order → confirm
  await page.goto("/admin/orders?status=PENDING");
  const firstOrder = page.locator("tbody a").first();
  test.skip((await firstOrder.count()) === 0, "No pending orders in the database");
  await firstOrder.click();
  await expect(page.getByRole("heading", { name: /طلب DH-/ })).toBeVisible();
  await page.getByLabel("الحالة الجديدة").selectOption("CONFIRMED");
  await page.getByRole("button", { name: "تحديث الحالة" }).click();
  await expect(page.getByText("تم تحديث حالة الطلب")).toBeVisible();
  await expect(page.getByText("مؤكد").first()).toBeVisible();

  // Internal note
  await page.getByLabel("ملاحظة داخلية").fill("تم التأكيد هاتفياً — اختبار آلي");
  await page.getByRole("button", { name: "إضافة ملاحظة" }).click();
  await expect(page.getByText("تم التأكيد هاتفياً — اختبار آلي")).toBeVisible();

  // Inventory quick edit
  await page.goto("/admin/inventory");
  const stockInput = page.getByLabel(/الكمية الجديدة لـ/).first();
  await stockInput.fill("25");
  await page.getByRole("button", { name: "حفظ" }).first().click();
  await expect(page.getByText(/تم تحديث مخزون/)).toBeVisible();

  // Customers & analytics render real data
  await page.goto("/admin/customers");
  await expect(page.getByRole("heading", { name: "العملاء" })).toBeVisible();
  await page.goto("/admin/analytics?range=90d");
  await expect(page.getByText("مبيعات المنتجات")).toBeVisible();
});
