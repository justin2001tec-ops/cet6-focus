import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const baseURL = process.env.CET6_PREVIEW_URL ?? 'http://127.0.0.1:4173'
const screenshotDir = join(process.cwd(), 'audit', 'v1.3-context-quality')
const consoleErrors = []
const pageErrors = []

async function setup(browser, viewport, resetKey) {
  const context = await browser.newContext({ viewport, colorScheme: 'light', deviceScaleFactor: 1, locale: 'zh-CN' })
  const page = await context.newPage()
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.addInitScript((key) => {
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      indexedDB.deleteDatabase('cet6-focus')
    }
  }, resetKey)
  await page.goto(`${baseURL}/#/`, { waitUntil: 'domcontentloaded' })
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 20_000 })
  const onboarding = page.getByRole('heading', { name: '每天打开，都知道下一步做什么。' })
  if (await onboarding.isVisible().catch(() => false)) {
    for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: /继续/ }).click()
    await page.getByRole('button', { name: /开始备考/ }).click()
  }
  await page.locator('.immersive-home__featured-word').waitFor({ state: 'visible', timeout: 20_000 })
  return { context, page }
}

async function setDailyNewWords(page, value) {
  await page.evaluate((nextValue) => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('Settings database open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('settings', 'readwrite')
      const store = transaction.objectStore('settings')
      const read = store.get('app')
      read.onerror = () => reject(read.error ?? new Error('Settings read failed'))
      read.onsuccess = () => store.put({ ...read.result, dailyNewWords: nextValue, updatedAt: new Date().toISOString() })
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Settings write failed'))
    }
  }), value)
}

async function resetCardsToNew(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('Learning database open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction(['cards', 'reviewLogs', 'sessions'], 'readwrite')
      const cards = transaction.objectStore('cards')
      const read = cards.getAll()
      read.onerror = () => reject(read.error ?? new Error('Cards read failed'))
      read.onsuccess = () => {
        const now = new Date().toISOString()
        for (const card of read.result) cards.put({ ...card, due: now, fsrsCard: { ...card.fsrsCard, due: now, state: 0, reps: 0, lapses: 0, lastReview: undefined }, updatedAt: now })
      }
      transaction.objectStore('reviewLogs').clear()
      transaction.objectStore('sessions').clear()
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Learning reset failed'))
    }
  }))
}

async function focusUncoveredWord(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('Uncovered-word database open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction(['words', 'cards', 'reviewLogs', 'sessions'], 'readwrite')
      const words = transaction.objectStore('words')
      const cards = transaction.objectStore('cards')
      const readWords = words.getAll()
      readWords.onerror = () => reject(readWords.error ?? new Error('Words read failed'))
      readWords.onsuccess = () => {
        const target = readWords.result.find((word) => !word.examples?.length)
        if (!target) return reject(new Error('No uncovered word available for fallback capture'))
        const readCards = cards.getAll()
        readCards.onerror = () => reject(readCards.error ?? new Error('Cards read failed'))
        readCards.onsuccess = () => {
          const future = '2999-01-01T00:00:00.000Z'
          const due = '2000-01-01T00:00:00.000Z'
          for (const card of readCards.result) {
            const isTarget = card.wordId === target.id
            cards.put({
              ...card,
              due: isTarget ? due : future,
              fsrsCard: {
                ...card.fsrsCard,
                due: isTarget ? due : future,
                state: isTarget ? 0 : 2,
                stability: isTarget ? 0 : 1,
                difficulty: isTarget ? 0 : 5,
                scheduledDays: isTarget ? 0 : 1,
                reps: isTarget ? 0 : 1,
                lastReview: isTarget ? undefined : new Date().toISOString(),
              },
            })
          }
        }
      }
      transaction.objectStore('reviewLogs').clear()
      transaction.objectStore('sessions').clear()
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Uncovered-word focus failed'))
    }
  }))
}

async function gotoStudy(page) {
  await page.goto(`${baseURL}/#/study`, { waitUntil: 'domcontentloaded' })
  await page.locator('.learning-shell').waitFor({ state: 'visible', timeout: 20_000 })
  await page.getByRole('region', { name: '回忆判断' }).waitFor({ state: 'visible', timeout: 20_000 })
  await page.waitForTimeout(450)
}

async function capture(page, filename) {
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(screenshotDir, filename), fullPage: false })
}

await mkdir(screenshotDir, { recursive: true })
const browser = await chromium.launch()
const contexts = []

try {
  const desktop = await setup(browser, { width: 1920, height: 1080 }, 'cet6-focus:v1.3-context-quality-desktop')
  contexts.push(desktop.context)
  await setDailyNewWords(desktop.page, 1)
  await resetCardsToNew(desktop.page)
  await gotoStudy(desktop.page)
  await desktop.page.getByRole('button', { name: /^不认识/ }).click()
  await desktop.page.getByRole('region', { name: '语境提示' }).waitFor({ state: 'visible', timeout: 10_000 })
  await capture(desktop.page, 'context-desktop.png')

  const iphone = await setup(browser, { width: 390, height: 844 }, 'cet6-focus:v1.3-context-quality-iphone')
  contexts.push(iphone.context)
  await setDailyNewWords(iphone.page, 1)
  await resetCardsToNew(iphone.page)
  await gotoStudy(iphone.page)
  await iphone.page.getByRole('button', { name: /^不认识/ }).click()
  await iphone.page.getByRole('region', { name: '语境提示' }).waitFor({ state: 'visible', timeout: 10_000 })
  await capture(iphone.page, 'context-iphone-390.png')

  const fallback = await setup(browser, { width: 390, height: 844 }, 'cet6-focus:v1.3-context-quality-fallback')
  contexts.push(fallback.context)
  await setDailyNewWords(fallback.page, 1)
  await resetCardsToNew(fallback.page)
  await focusUncoveredWord(fallback.page)
  await gotoStudy(fallback.page)
  await fallback.page.getByRole('button', { name: /^不认识/ }).click()
  await fallback.page.getByRole('region', { name: '核心词义' }).waitFor({ state: 'visible', timeout: 10_000 })
  await capture(fallback.page, 'meaning-fallback-iphone-390.png')

  if (consoleErrors.length || pageErrors.length) throw new Error(JSON.stringify({ consoleErrors, pageErrors }))
  console.log(JSON.stringify({ baseURL, screenshotDir, screenshots: 3, consoleErrors, pageErrors }, null, 2))
} finally {
  for (const context of contexts) await context.close().catch(() => {})
  await browser.close()
}
