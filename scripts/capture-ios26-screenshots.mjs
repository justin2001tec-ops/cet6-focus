import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const baseURL = process.env.CET6_PREVIEW_URL ?? 'http://127.0.0.1:4177'
const screenshotDir = join(process.cwd(), 'audit', 'ios26-ui')

async function onboard(page) {
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '每天打开，都知道下一步做什么。' }).waitFor({ state: 'visible', timeout: 15_000 })
  for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /开始备考/ }).click()
  await page.getByRole('button', { name: /开始今日学习/ }).waitFor({ state: 'visible', timeout: 15_000 })
}

async function seedAuditData(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction(['cards', 'reviewLogs', 'sessions'], 'readwrite')
      const cardStore = transaction.objectStore('cards')
      const logsStore = transaction.objectStore('reviewLogs')
      const sessionsStore = transaction.objectStore('sessions')
      const cardsRequest = cardStore.getAll()
      cardsRequest.onerror = () => reject(cardsRequest.error ?? new Error('Card fixture read failed'))
      cardsRequest.onsuccess = () => {
        const cards = cardsRequest.result
        const selected = cards.slice(0, 12)
        const now = new Date()
        const iso = (offsetMs = 0) => new Date(now.getTime() + offsetMs).toISOString()
        const due = iso(-86_400_000)
        selected.forEach((card, index) => cardStore.put({
          ...card,
          due: index < 2 ? due : iso(86_400_000 * 90),
          fsrsCard: { ...card.fsrsCard, state: 2, reps: Math.max(2, index + 1), due: index < 2 ? due : iso(86_400_000 * 90), lastReview: iso(-(index + 1) * 86_400_000) },
          spellingWrongCount: index < 2 ? index + 1 : 0,
          lastSpellingAt: index < 2 ? iso(-(index + 1) * 86_400_000) : undefined,
          lastDictationAt: index < 3 ? iso(-(index + 1) * 3_600_000) : undefined,
          updatedAt: iso(),
        }))
        logsStore.clear()
        const logCard = selected[0]
        if (logCard) {
          logsStore.add({ wordId: logCard.wordId, sessionId: 'audit-review', rating: 1, reviewedAt: iso(-3_600_000), durationMs: 8000, before: logCard.fsrsCard, after: logCard.fsrsCard })
          logsStore.add({ wordId: logCard.wordId, sessionId: 'audit-review', rating: 1, reviewedAt: iso(-1_800_000), durationMs: 7000, before: logCard.fsrsCard, after: logCard.fsrsCard })
          logsStore.add({ wordId: selected[1]?.wordId ?? logCard.wordId, sessionId: 'audit-review', rating: 3, reviewedAt: iso(-900_000), durationMs: 6000, before: selected[1]?.fsrsCard ?? logCard.fsrsCard, after: selected[1]?.fsrsCard ?? logCard.fsrsCard })
        }
        sessionsStore.clear()
        sessionsStore.put({ id: 'audit-review', type: 'review', startedAt: iso(-7_200_000), endedAt: iso(-3_600_000), wordCount: 3, againCount: 2, durationMs: 180_000, attempted: 0, correct: 0, wrong: 0, corrected: 0 })
        sessionsStore.put({ id: 'audit-study', type: 'study', startedAt: iso(-5_400_000), endedAt: iso(-3_600_000), wordCount: 6, againCount: 1, durationMs: 120_000, attempted: 0, correct: 0, wrong: 0, corrected: 0 })
        sessionsStore.put({ id: 'audit-dictation', type: 'dictation', startedAt: iso(-1_800_000), endedAt: iso(-900_000), wordCount: 4, againCount: 0, durationMs: 90_000, attempted: 5, correct: 4, wrong: 1, corrected: 1 })
      }
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Audit fixture update failed'))
    }
  }))
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function firstWordId(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('words', 'readonly')
      const getRequest = transaction.objectStore('words').getAll()
      getRequest.onsuccess = () => { database.close(); resolve(getRequest.result[0]?.id) }
      getRequest.onerror = () => reject(getRequest.error ?? new Error('Word fixture read failed'))
    }
  }))
}

async function setup(viewport, colorScheme = 'light') {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport, colorScheme, deviceScaleFactor: 1, locale: 'zh-CN' })
  const page = await context.newPage()
  await page.addInitScript(() => {
    const resetKey = 'cet6-focus:ios26-screenshot-reset'
    if (!sessionStorage.getItem(resetKey)) {
      sessionStorage.setItem(resetKey, '1')
      indexedDB.deleteDatabase('cet6-focus')
    }
  })
  await onboard(page)
  await seedAuditData(page)
  return { browser, context, page }
}

async function route(page, path, selector) {
  await page.goto(`${baseURL}/#${path}`, { waitUntil: 'domcontentloaded' })
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: 15_000 })
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }))
}

async function shot(page, filename) {
  await page.screenshot({ path: join(screenshotDir, filename), fullPage: false })
}

await mkdir(screenshotDir, { recursive: true })

{
  const { browser, context, page } = await setup({ width: 390, height: 844 })
  await route(page, '/', '.page--dashboard')
  await shot(page, 'dashboard-iphone-light.png')
  await route(page, '/study', '.page--study')
  await shot(page, 'study-iphone.png')
  await route(page, '/dictation', '.page--dictation')
  await page.getByRole('tab', { name: /看中文写英文/ }).click()
  await page.locator('#dictation-input').focus()
  await page.waitForTimeout(250)
  await shot(page, 'dictation-iphone-keyboard.png')
  await route(page, '/words', '.page--vocabulary')
  await page.locator('.word-row').first().waitFor({ state: 'visible', timeout: 15_000 })
  await shot(page, 'vocabulary-iphone.png')
  await page.locator('.word-row').first().click()
  await page.locator('.bottom-sheet').waitFor({ state: 'visible', timeout: 15_000 })
  await page.waitForTimeout(150)
  await shot(page, 'word-detail-sheet-iphone.png')
  await page.getByRole('dialog').getByRole('button', { name: '关闭词条详情' }).click()
  await route(page, '/settings', '.page--settings')
  await shot(page, 'settings-iphone.png')
  await context.close()
  await browser.close()
}

{
  const { browser, context, page } = await setup({ width: 390, height: 844 }, 'dark')
  await route(page, '/settings', '.page--settings')
  await page.getByRole('button', { name: '深色' }).click()
  await page.waitForTimeout(150)
  await route(page, '/', '.page--dashboard')
  await shot(page, 'dashboard-iphone-dark.png')
  await context.close()
  await browser.close()
}

{
  const { browser, context, page } = await setup({ width: 430, height: 932 })
  await route(page, '/', '.page--dashboard')
  await shot(page, 'safe-area-iphone-430.png')
  await context.close()
  await browser.close()
}

{
  const { browser, context, page } = await setup({ width: 375, height: 812 })
  await route(page, '/', '.page--dashboard')
  await shot(page, 'safe-area-iphone-375.png')
  await context.close()
  await browser.close()
}

{
  const { browser, context, page } = await setup({ width: 834, height: 1194 })
  await route(page, '/', '.page--dashboard')
  await shot(page, 'homepage-ipad.png')
  const wordId = await firstWordId(page)
  await route(page, `/word/${wordId}`, '.page--word-detail')
  await shot(page, 'vocabulary-ipad-inspector.png')
  await context.close()
  await browser.close()
}

{
  const { browser, context, page } = await setup({ width: 1440, height: 900 })
  await route(page, '/', '.page--dashboard')
  await shot(page, 'homepage-desktop.png')
  await route(page, '/study', '.page--study')
  await shot(page, 'study-desktop.png')
  await route(page, '/stats', '.page--stats')
  await shot(page, 'stats-desktop.png')
  await route(page, '/settings', '.page--settings')
  await shot(page, 'settings-desktop.png')
  await context.close()
  await browser.close()
}

console.log(`Captured iOS 26 UI audit screenshots to ${screenshotDir}`)
