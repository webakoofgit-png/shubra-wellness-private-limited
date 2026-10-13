import { test, expect, type Page } from "@playwright/test";

async function demo(page: Page, role: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Demo Role Switcher", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: role, exact: true }).click();
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
}
async function nav(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name, exact: true })
    .click();
}

test("every admin navigation page renders and downloads a real report", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await demo(page, "Super Admin");
  for (const name of [
    "Health workers",
    "Patients",
    "Sales representatives",
    "Health surveys",
    "Patient assignments",
    "Incentives",
    "Medicines",
    "Cart & checkout",
    "Orders",
    "Payments",
    "Reports",
    "Notifications",
    "My profile",
    "Settings",
    "Help & support",
    "Account recovery",
    "Privacy policy",
    "Terms & conditions",
  ]) {
    await nav(page, name);
    await expect(page.locator("main h1")).toBeVisible();
  }
  await nav(page, "Reports");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("worker-performance.csv");
  await nav(page, "Overview");
  await page.screenshot({ path: "artifacts/admin-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("worker survey retains details through steps and reload", async ({ page }) => {
  await demo(page, "Health Worker");
  await nav(page, "Patients");
  await expect(page.getByRole("cell", { name: "Amit Patil", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Kavita Pawar", exact: true })).toHaveCount(0);
  await nav(page, "Health surveys");
  await page.getByRole("button", { name: "New patient survey", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Patient consent is required");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByRole("checkbox", { name: "Diabetes", exact: true }).check();
  await dialog.getByLabel("Current medication", { exact: true }).fill("Fictional medication note");
  await dialog
    .getByLabel("Additional notes", { exact: true })
    .fill("Fictional retained survey detail");
  await dialog.getByRole("button", { name: "Review", exact: true }).click();
  await expect(dialog).toContainText("Fictional retained survey detail");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toContainText("Saved successfully");
  await dialog.getByRole("button", { name: "Close", exact: true }).first().click();
  await page.reload();
  await expect(page.getByRole("cell", { name: "In review", exact: true })).toBeVisible();
  await page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "In review", exact: true }) })
    .getByRole("button", { name: "View details" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Fictional retained survey detail");
});

test("registration verifies attribution and restores the same patient after logout", async ({
  page,
}) => {
  await page.goto("/?ref=REF-HW1002");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await page.getByLabel("Mobile number", { exact: true }).fill("9876543220");
  await page.getByRole("button", { name: "Continue to demo OTP" }).click();
  await page.getByLabel("OTP verification", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Verify demo code" }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Fictional Neha");
  await page.getByLabel("Date of birth", { exact: true }).fill("1994-04-01");
  await page.getByLabel("Gender", { exact: true }).selectOption("Female");
  await page.getByLabel("Address", { exact: true }).fill("Fictional Demo Street");
  await page.getByLabel("District", { exact: true }).fill("Nashik");
  await page.getByLabel("PIN code", { exact: true }).fill("422001");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Register patient", exact: true }).click();
  await expect(page.locator("main")).toContainText("PT10006");
  await expect(page.locator("main")).toContainText("HW1002");
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await page.getByLabel("Mobile number", { exact: true }).fill("9876543220");
  await page.getByRole("button", { name: "Continue to demo OTP" }).click();
  await page.getByLabel("OTP verification", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Verify demo code" }).click();
  await expect(page.locator("main")).toContainText("PT10006");
  await expect(page.locator("main")).toContainText("HW1002");
  const count = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("ssw-demo-v1")!).patients.filter(
        (p: { mobile: string }) => p.mobile === "9876543220",
      ).length,
  );
  expect(count).toBe(1);
});

test("sales checkout honors customer, quantity and payment method", async ({ page }) => {
  await demo(page, "Sales Representative");
  await nav(page, "Medicines");
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Triphala Churna", exact: true }) })
    .getByRole("button", { name: "Add to cart", exact: true })
    .click();
  await nav(page, "Cart & checkout");
  await page.getByLabel("Customer", { exact: true }).selectOption("PT10002");
  await page.getByLabel("Quantity Triphala Churna", { exact: true }).fill("3");
  await page.getByLabel("Address", { exact: true }).fill("Fictional Satara delivery");
  await page.getByLabel("Payment method", { exact: true }).selectOption("UPI");
  await page.getByRole("button", { name: "Place demo order", exact: true }).click();
  await expect(page.locator("main")).toContainText("₹675");
  await expect(page.locator("main")).toContainText("Simulated paid");
  const order = await page.evaluate(
    () => JSON.parse(localStorage.getItem("ssw-demo-v1")!).orders[0],
  );
  expect(order.patientId).toBe("PT10002");
  expect(order.items[0].quantity).toBe(3);
  expect(order.method).toBe("UPI");
});

test("admin reassignment records a reason and incentive payout reference", async ({ page }) => {
  await demo(page, "Super Admin");
  await nav(page, "Patient assignments");
  await page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "PT10001", exact: true }) })
    .getByRole("button", { name: "Reassign" })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Health worker", { exact: true }).selectOption("HW1002");
  await dialog.getByLabel("Reason", { exact: true }).fill("Fictional local care request");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("main")).toContainText("Fictional local care request");
  await nav(page, "Incentives");
  await page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: /PT10001/ }) })
    .getByRole("button", { name: "Mark paid" })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Payment reference", { exact: true }).fill("DEMO-TRANSFER-001");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("main")).toContainText("DEMO-TRANSFER-001");
  await page.reload();
  await expect(page.locator("main")).toContainText("DEMO-TRANSFER-001");
});

test("patient guards, language preference and mobile layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await demo(page, "Patient");
  await page.getByLabel("Language", { exact: true }).selectOption("mr");
  await expect(page.locator("main h1")).toContainText("पुन्हा स्वागत");
  await page.reload();
  await expect(page.getByLabel("भाषा", { exact: true })).toHaveValue("mr");
  await page.getByLabel("भाषा", { exact: true }).selectOption("en");
  await page.evaluate(() => {
    window.location.hash = "Assignments";
  });
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Medicines", exact: true })
    .click();
  await expect(page.locator("main h1")).toHaveText("Medicines");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "artifacts/patient-mobile.png", fullPage: true });
});

test("medicine add, edit, image-free detail and delete are functional", async ({ page }) => {
  await demo(page, "Super Admin");
  await nav(page, "Medicines");
  await page.getByRole("button", { name: "Add medicine", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name", { exact: true }).fill("Fictional Wellness Oil");
  await dialog.getByLabel("Price", { exact: true }).fill("399");
  await dialog.getByLabel("Stock", { exact: true }).fill("12");
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("Fictional botanical wellness product");
  await dialog.getByLabel("Ingredients", { exact: true }).fill("Fictional herbs");
  await dialog.getByLabel("Usage information", { exact: true }).fill("Follow the product label");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Fictional Wellness Oil", exact: true }) });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await dialog.getByLabel("Price", { exact: true }).fill("425");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(card).toContainText("₹425");
  await card.getByRole("button", { name: "Delete", exact: true }).click();
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(card).toHaveCount(0);
});
