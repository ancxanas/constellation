import { chromium } from "playwright"

const BASE = "http://localhost:3000"
const DEMO = { email: "demo@constellation.app", password: "password123" }
const QA_EMAIL = "qa.audit@test.dev"

let pass = 0
let fail = 0
const fails: string[] = []
const errs: string[] = []

async function step(name: string, fn: () => Promise<void>) {
  const start = Date.now()
  try {
    await fn()
    pass++
    console.log(`PASS  ${name} (${Date.now() - start}ms)`)
  } catch (e) {
    fail++
    fails.push(`${name} :: ${String(e).slice(0, 500)}`)
    console.log(`FAIL  ${name} :: ${String(e).slice(0, 250)}`)
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function login(page: any, email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" })
  await page.locator("#email").fill(email)
  await page.locator("#password").fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(`${BASE}/`, { timeout: 15000 })
  await wait(800)
}

async function signOut(page: any) {
  await page.goto(`${BASE}/boards`, { waitUntil: "networkidle" })
  await wait(600)
  await page.locator("aside [data-slot='dropdown-menu-trigger']").first().click()
  await wait(500)
  await page.getByRole("menuitem", { name: "Sign out" }).click()
  await page.waitForURL(`${BASE}/login`, { timeout: 15000 })
  await wait(500)
}

async function selectByLabel(page: any, dialogScope: any, label: string, option: string) {
  const box = dialogScope.locator(".space-y-2").filter({ has: page.locator(`label:text-is("${label}")`) }).first()
  await box.locator('[data-slot="select-trigger"]').click()
  await wait(400)
  await page.locator('[data-slot="select-item"]').filter({ hasText: option }).click()
  await wait(400)
}

function column(page: any, colTitle: string) {
  return page
    .locator("div.w-72")
    .filter({ has: page.locator("span.truncate", { hasText: colTitle }) })
    .first()
}

async function reveal(page: any, loc: any) {
  await loc.scrollIntoViewIfNeeded()
  await wait(200)
}

async function openColumnMenu(page: any, colTitle: string) {
  const col = column(page, colTitle)
  await reveal(page, col)
  await col.locator('button[data-slot="dropdown-menu-trigger"]').first().click()
  await wait(500)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.on("pageerror", (e) => errs.push("[PAGEERROR] " + (e.stack || e.message).slice(0, 300)))
  page.on("console", (m) => {
    if (m.type() === "error") errs.push("[CONSOLE] " + m.text().slice(0, 300))
  })

  // ============ AUTH ============
  await step("anonymous / redirects to /login", async () => {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
    await page.waitForURL(`${BASE}/login`, { timeout: 10000 })
  })

  await step("invalid login shows error", async () => {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" })
    await page.locator("#email").fill(DEMO.email)
    await page.locator("#password").fill("wrong-password")
    await page.locator('button[type="submit"]').click()
    await wait(1500)
    const body = await page.locator("body").innerText()
    if (!body.includes("Invalid email or password")) throw new Error("no error text shown")
  })

  await step("register password mismatch shows error", async () => {
    await page.goto(`${BASE}/register`, { waitUntil: "networkidle" })
    await page.locator("#name").fill("QA Mismatch")
    await page.locator("#email").fill("qa.mismatch@test.dev")
    await page.locator("#password").fill("password456")
    await page.locator("#confirmPassword").fill("different")
    await page.locator('button[type="submit"]').click()
    await wait(1200)
    const body = await page.locator("body").innerText()
    if (!body.includes("Passwords do not match")) throw new Error("mismatch error not shown: " + body.slice(0, 200))
  })

  await step("register new user works and signs in", async () => {
    await page.goto(`${BASE}/register`, { waitUntil: "networkidle" })
    await page.locator("#name").fill("QA Audit User")
    await page.locator("#email").fill(QA_EMAIL)
    await page.locator("#password").fill("password456")
    await page.locator("#confirmPassword").fill("password456")
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(`${BASE}/`, { timeout: 15000 })
    await wait(1000)
    const body = await page.locator("body").innerText()
    if (!body.includes("QA Audit User")) throw new Error("signed-in user not shown")
  })

  await step("sign out works", async () => {
    await signOut(page)
  })

  await step("login as demo lands on dashboard with seeded data", async () => {
    await login(page, DEMO.email, DEMO.password)
    const body = await page.locator("body").innerText()
    for (const s of ["Your boards", "Today", "Assigned to you", "Getting Started"]) {
      if (!body.includes(s)) throw new Error(`dashboard missing: ${s}`)
    }
  })

  // ============ BOARDS ============
  await step("login again + /boards lists Getting Started", async () => {
    await page.goto(`${BASE}/boards`, { waitUntil: "networkidle" })
    await wait(800)
    const body = await page.locator("body").innerText()
    if (!body.includes("Getting Started")) throw new Error("board card missing")
    if (!body.includes("New board")) throw new Error("New board button missing")
  })

  let boardUrl = ""
  await step("create new board redirects and shows 3 default columns", async () => {
    await page.getByRole("button", { name: "New board" }).first().click()
    await wait(500)
    await page.locator("#board-title").fill("QA Audit Board")
    await page.locator("#board-description").fill("Created by automated audit")
    await page.getByRole("button", { name: "Create board" }).click()
    await page.waitForURL(/\/boards\/[a-z0-9]+$/, { timeout: 15000 })
    await wait(1500)
    boardUrl = page.url()
    const body = await page.locator("body").innerText()
    for (const c of ["To Do", "In Progress", "Done"]) {
      if (!body.includes(c)) throw new Error(`column ${c} missing`)
    }
  })

  // ============ KANBAN / COLUMNS ============
  await step("add column appends New column", async () => {
    await page.getByRole("button", { name: "Add column" }).click()
    await wait(1500)
    const body = await page.locator("body").innerText()
    if (!body.includes("New column")) throw new Error("New column not added")
  })

  await step("rename column via menu", async () => {
    await openColumnMenu(page, "New column")
    await page.getByRole("menuitem", { name: "Rename" }).click()
    await wait(500)
    await page.locator("#rename-column").fill("QA Column")
    await page.getByRole("button", { name: "Save" }).click()
    await wait(1500)
    const body = await page.locator("body").innerText()
    if (!body.includes("QA Column")) throw new Error("renamed column missing")
    if (body.includes("New column")) throw new Error("old title still present")
  })

  // ============ TASKS ============
  await step("add task via New task dialog", async () => {
    const todo = column(page, "To Do")
    await reveal(page, todo)
    await todo.getByText("Add task").click()
    await wait(500)
    await page.locator("#task-title").fill("QA Drag Task")
    await page.locator("#task-description").fill("Used to test drag and drop")
    await page.getByRole("button", { name: "Create task" }).click()
    await wait(1500)
    const body = await page.locator("body").innerText()
    if (!body.includes("QA Drag Task")) throw new Error("task not created")
  })

  await step("drag task To Do -> Done persists", async () => {
    const src = column(page, "To Do")
    const dst = column(page, "Done")
    await reveal(page, src)
    const card = src.getByText("QA Drag Task")
    const sb = await card.boundingBox()
    await reveal(page, dst)
    const db = await dst.boundingBox()
    if (!sb || !db) throw new Error("no bounding box")
    await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2)
    await page.mouse.down()
    await page.mouse.move(db.x + db.width / 2, db.y + 80, { steps: 40 })
    await wait(400)
    await page.mouse.up()
    await wait(1800)
    const body = await page.locator("body").innerText()
    if (!body.includes("QA Drag Task")) throw new Error("task disappeared during drag")
    await page.reload({ waitUntil: "networkidle" })
    await wait(1200)
    const doneCol = column(page, "Done")
    const todoCol = column(page, "To Do")
    if ((await doneCol.getByText("QA Drag Task").count()) !== 1) throw new Error("task not in Done after reload")
    if ((await todoCol.getByText("QA Drag Task").count()) !== 0) throw new Error("task still in To Do after reload")
  })

  // ============ TASK DETAIL EDITING ============
  const dlg = () => page.locator('[data-slot="dialog-content"]')

  await step("open task detail dialog", async () => {
    await column(page, "Done").getByText("QA Drag Task").click()
    await wait(800)
    if ((await dlg().count()) !== 1) throw new Error("dialog not open")
  })

  await step("edit title via blur persists", async () => {
    const input = dlg().locator("input").first()
    await input.fill("QA Renamed Task")
    await input.blur()
    await wait(1200)
    await page.reload({ waitUntil: "networkidle" })
    await wait(1200)
    if ((await column(page, "Done").getByText("QA Renamed Task").count()) !== 1) throw new Error("title not persisted")
    await column(page, "Done").getByText("QA Renamed Task").click()
    await wait(800)
  })

  await step("edit description persists", async () => {
    const ta = page.locator("#task-detail-description")
    await ta.fill("Edited by audit - new description")
    await ta.blur()
    await wait(1200)
    await page.reload({ waitUntil: "networkidle" })
    await wait(1000)
    await column(page, "Done").getByText("QA Renamed Task").click()
    await wait(800)
    const val = await page.locator("#task-detail-description").inputValue()
    if (val !== "Edited by audit - new description") throw new Error("description not saved")
  })

  await step("change status via select", async () => {
    await selectByLabel(page, dlg(), "Status", "In Progress")
    await wait(1500)
    const doneCol = column(page, "Done")
    if ((await doneCol.getByText("QA Renamed Task").count()) !== 0) throw new Error("task still in Done")
    const ipCol = column(page, "In Progress")
    if ((await ipCol.getByText("QA Renamed Task").count()) !== 1) throw new Error("task not in In Progress")
  })

  await step("change priority via select", async () => {
    await selectByLabel(page, dlg(), "Priority", "Urgent")
    await wait(1200)
    const body = await page.locator("body").innerText()
    if (!body.includes("URGENT")) throw new Error("priority badge not urgent")
  })

  await step("set + clear due date", async () => {
    await page.getByRole("button", { name: /No due date/i }).first().click()
    await wait(600)
    const day = page.locator('[data-slot="calendar"] button:not([disabled])').nth(10)
    await day.click()
    await wait(1000)
    if ((await page.getByRole("button", { name: /No due date/i }).count()) !== 0) throw new Error("due date not set")
    await page.getByRole("button", { name: "Clear due date" }).click()
    await wait(1000)
    if ((await page.getByRole("button", { name: /No due date/i }).count()) !== 1) throw new Error("due date not cleared")
    await dlg().locator("h4", { hasText: "Comments" }).click()
    await wait(500)
  })

  await step("add tag and remove it", async () => {
    const tagInput = page.getByPlaceholder("Add a tag")
    await tagInput.fill("audit")
    await tagInput.press("Enter")
    await wait(1500)
    const removeBtn = page.getByRole("button", { name: "Remove audit" })
    if ((await removeBtn.count()) !== 1) throw new Error("tag not added")
    await wait(500)
    await removeBtn.click()
    await wait(1500)
    const after = await page.locator("body").innerText()
    if (after.includes("Remove audit")) throw new Error("tag not removed")
  })

  await step("add comment + delete comment", async () => {
    await page.getByPlaceholder("Add a comment…").fill("A comment from the audit")
    await page.getByRole("button", { name: "Comment" }).click()
    await wait(1500)
    const body = await page.locator("body").innerText()
    if (!body.includes("A comment from the audit")) throw new Error("comment not added")
    await dlg().getByRole("button", { name: "Delete", exact: true }).click()
    await wait(1500)
    const after = await page.locator("body").innerText()
    if (after.includes("A comment from the audit")) throw new Error("comment not deleted")
  })

  // close dialog
  await page.keyboard.press("Escape")
  await wait(500)

  // ============ FILTERS ============
  await step("filters: query filter hides + clear shows", async () => {
    const filterInput = page.getByPlaceholder("Filter tasks…")
    await filterInput.fill("zzznomatch")
    await wait(800)
    const hidden = await column(page, "In Progress").getByText("QA Renamed Task").count()
    if (hidden !== 0) throw new Error("task still visible when filtered out")
    await page.getByRole("button", { name: "Clear" }).click()
    await wait(800)
    if ((await column(page, "In Progress").getByText("QA Renamed Task").count()) !== 1) throw new Error("task not restored after clear")
  })

  await step("filters: status select filters tasks", async () => {
    await page.locator('[data-slot="select-trigger"]').nth(0).click()
    await wait(400)
    await page.locator('[data-slot="select-item"]').filter({ hasText: "Done" }).click()
    await wait(800)
    if ((await column(page, "In Progress").getByText("QA Renamed Task").count()) !== 0) throw new Error("task shown for wrong status")
    await page.getByRole("button", { name: "Clear" }).click()
    await wait(800)
    if ((await column(page, "In Progress").getByText("QA Renamed Task").count()) !== 1) throw new Error("task not restored")
  })

  // ============ TASK DELETE ============
  await step("delete task via dialog", async () => {
    await column(page, "In Progress").getByText("QA Renamed Task").click()
    await wait(800)
    await dlg().getByRole("button", { name: "Delete task" }).click()
    await wait(500)
    await page.getByRole("button", { name: "Delete", exact: true }).click()
    await wait(1500)
    const body = await page.locator("body").innerText()
    if (body.includes("QA Renamed Task")) throw new Error("task not deleted")
  })

  // ============ COLUMN DELETE ============
  await step("delete added column", async () => {
    await openColumnMenu(page, "QA Column")
    await page.getByRole("menuitem", { name: "Delete" }).click()
    await wait(500)
    await page.getByRole("button", { name: "Delete", exact: true }).click()
    await wait(1500)
    const body = await page.locator("body").innerText()
    if (body.includes("QA Column")) throw new Error("column not deleted")
  })

  // ============ MEMBERS ============
  await step("invite member via members dialog", async () => {
    await page.getByRole("button", { name: "Members" }).click()
    await wait(600)
    await page.locator("#invite-email").fill(QA_EMAIL)
    await page.getByRole("button", { name: "Invite" }).click()
    await wait(1500)
    const body = await page.locator("body").innerText()
    if (!body.includes("QA Audit User")) throw new Error("invited member not listed")
  })

  await step("change member role", async () => {
    const row = page.locator('[data-slot="dialog-content"]').locator("div.rounded-lg").filter({ hasText: "QA Audit User" }).first()
    const sel = row.locator('[data-slot="select-trigger"]')
    const current = (await sel.innerText()).trim().toUpperCase()
    const target = current === "ADMIN" ? "MEMBER" : "ADMIN"
    await sel.click()
    await wait(400)
    await page.locator('[data-slot="select-item"]').filter({ hasText: target }).click()
    await wait(1200)
    const txt = (await row.locator('[data-slot="select-trigger"]').innerText()).trim().toUpperCase()
    if (txt !== target) throw new Error(`role not changed to ${target}`)
  })

  await step("remove member", async () => {
    const remove = page.locator('[data-slot="dialog-content"] button').filter({ has: page.locator("svg.lucide-trash2") }).first()
    await remove.click()
    await wait(1500)
    const body = await page.locator("body").innerText()
    if (body.includes("QA Audit User")) throw new Error("member not removed")
  })
  await page.keyboard.press("Escape")
  await wait(400)

  // ============ EDIT + DELETE BOARD ============
  await step("edit board details", async () => {
    await page.getByRole("button", { name: "Board settings" }).click()
    await wait(400)
    await page.getByRole("menuitem", { name: "Edit details" }).click()
    await wait(500)
    await page.locator("#edit-board-title").fill("QA Audit Board v2")
    await page.getByRole("button", { name: "Save" }).click()
    await wait(1500)
    const body = await page.locator("body").innerText()
    if (!body.includes("QA Audit Board v2")) throw new Error("board title not updated")
  })

  await step("delete board", async () => {
    await page.getByRole("button", { name: "Board settings" }).click()
    await wait(400)
    await page.getByRole("menuitem", { name: "Delete board" }).click()
    await wait(500)
    await page.getByRole("button", { name: "Delete", exact: true }).click()
    await page.waitForURL(`${BASE}/boards`, { timeout: 15000 })
    await wait(1000)
    const body = await page.locator("body").innerText()
    if (body.includes("QA Audit Board")) throw new Error("board not deleted")
  })

  // ============ SEARCH ============
  await step("search via Ctrl+K finds tasks and navigates", async () => {
    await page.goto(`${BASE}/boards`, { waitUntil: "networkidle" })
    await wait(800)
    await page.keyboard.press("Control+k")
    await wait(600)
    await page.locator('[data-slot="command-input"]').fill("drag and drop")
    await wait(2000)
    const items = await page.locator('[data-slot="command-item"]').count()
    if (items === 0) throw new Error("no search results")
    await page.locator('[data-slot="command-item"]').first().click()
    await wait(1500)
    if (!page.url().includes("/boards/")) throw new Error("did not navigate to board")
  })

  // ============ THEME ============
  await step("theme toggle via sidebar dropdown", async () => {
    await page.goto(`${BASE}/boards`, { waitUntil: "networkidle" })
    await wait(800)
    const before = await page.locator("html").getAttribute("class")
    await page.locator("aside [data-slot='dropdown-menu-trigger']").first().click()
    await wait(500)
    const item = await page.getByRole("menuitem", { name: /Light mode|Dark mode/ }).count()
    if (item === 0) throw new Error("theme menu item missing")
    await page.getByRole("menuitem", { name: /Light mode|Dark mode/ }).click()
    await wait(700)
    const after = await page.locator("html").getAttribute("class")
    if (before === after) throw new Error("theme did not change")
  })

  await step("theme hotkey 'd' toggles", async () => {
    const before = await page.locator("html").getAttribute("class")
    await page.keyboard.press("d")
    await wait(700)
    const after = await page.locator("html").getAttribute("class")
    if (before === after) throw new Error("hotkey did not toggle theme")
  })

  // ============ SETTINGS ============
  await step("settings page shows profile", async () => {
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" })
    await wait(800)
    const body = await page.locator("body").innerText()
    if (!body.includes("Demo User")) throw new Error("profile name missing")
    if (!body.includes(DEMO.email)) throw new Error("profile email missing")
  })

  // ============ MOBILE ============
  await step("mobile bottom nav + account sheet works", async () => {
    const mob = await ctx.newPage()
    mob.setViewportSize({ width: 390, height: 844 })
    mob.on("pageerror", (e) => errs.push("[M][PAGEERROR] " + (e.stack || e.message).slice(0, 300)))
    await mob.goto(`${BASE}/`, { waitUntil: "networkidle" })
    await wait(1000)
    const body = await mob.locator("body").innerText()
    if (!body.includes("Home")) throw new Error("bottom nav missing")
    await mob.getByRole("button", { name: /account/i }).click()
    await wait(700)
    const sheetText = await mob.locator('[data-slot="sheet-content"]').innerText().catch(() => "")
    if (!sheetText.includes("Light mode") && !sheetText.includes("Dark mode")) throw new Error("theme toggle missing in sheet")
    await mob.close()
  })

  // ============ CONSOLE ERRORS ============
  console.log("\n===== SUMMARY =====")
  console.log(`PASS: ${pass}  FAIL: ${fail}`)
  console.log(`Total console/page errors captured: ${errs.length}`)
  const unique = [...new Set(errs)]
  for (const e of unique.slice(0, 40)) console.log("  " + e)
  if (fails.length) {
    console.log("\n===== FAILURES =====")
    for (const f of fails) console.log("- " + f)
  }

  await browser.close()
  process.exit(fail > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(2)
})
