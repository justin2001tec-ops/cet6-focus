import { chromium } from '@playwright/test'
import { copyFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const baseURL = process.env.CET6_PREVIEW_URL ?? 'http://127.0.0.1:4173'
const screenshotDir = join(process.cwd(), 'audit', 'v1.3-learning')
const consoleErrors = []
const pageErrors = []
const contexts = []

async function setup(browser, viewport, resetKey) {
  const context = await browser.newContext({ viewport, colorScheme: 'light', deviceScaleFactor: 1, locale: 'zh-CN' })
  contexts.push(context)
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
  return page
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
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function setBackground(page, id) {
  await page.evaluate((backgroundId) => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('Background database open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('settings', 'readwrite')
      const store = transaction.objectStore('settings')
      const read = store.get('app')
      read.onerror = () => reject(read.error ?? new Error('Background settings read failed'))
      read.onsuccess = () => store.put({ ...read.result, backgroundMode: 'fixed', backgroundId, lastBackgroundId: backgroundId, updatedAt: new Date().toISOString() })
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Background settings write failed'))
    }
  }), id)
  await page.reload({ waitUntil: 'domcontentloaded' })
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
        for (const card of read.result) cards.put({
          ...card,
          due: now,
          fsrsCard: { ...card.fsrsCard, due: now, state: 0, reps: 0, lapses: 0, lastReview: undefined },
          spellingWrongCount: 0,
          lastSpellingAt: undefined,
          lastDictationAt: undefined,
          updatedAt: now,
        })
      }
      transaction.objectStore('reviewLogs').clear()
      transaction.objectStore('sessions').clear()
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Learning reset failed'))
    }
  }))
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function addContextFixture(page) {
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('Context database open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('words', 'readwrite')
      const store = transaction.objectStore('words')
      const read = store.get('cet6-abandon')
      read.onerror = () => reject(read.error ?? new Error('Context fixture read failed'))
      read.onsuccess = () => store.put({ ...read.result, examples: [{ en: 'We had to abandon the plan before the storm arrived.', zh: '暴风雨来临前，我们不得不放弃计划。' }] })
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Context fixture write failed'))
    }
  }))
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function patchCardDue(page, wordId) {
  await page.evaluate((id) => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('Due database open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('cards', 'readwrite')
      const store = transaction.objectStore('cards')
      const read = store.get(id)
      read.onerror = () => reject(read.error ?? new Error('Due card read failed'))
      read.onsuccess = () => {
        const card = read.result
        const due = '2000-01-01T00:00:00.000Z'
        store.put({ ...card, due, fsrsCard: { ...card.fsrsCard, due }, updatedAt: new Date().toISOString() })
      }
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Due card write failed'))
    }
  }), wordId)
}

async function gotoStudy(page, route = '/study') {
  await page.goto(`${baseURL}/#${route}`, { waitUntil: 'domcontentloaded' })
  await page.locator('.learning-shell').waitFor({ state: 'visible', timeout: 20_000 })
  await page.getByRole('region', { name: '先凭记忆想一想' }).waitFor({ state: 'visible', timeout: 20_000 })
  await page.waitForTimeout(500)
}

async function shot(page, filename) {
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(screenshotDir, filename), fullPage: false })
}

async function waitForComplete(page) {
  await page.getByRole('heading', { name: '这一组，完成了。' }).waitFor({ state: 'visible', timeout: 15_000 })
}

async function cardIdWithHistory(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('Card history database open failed'))
    request.onsuccess = () => {
      const database = request.result
      const read = database.transaction('cards', 'readonly').objectStore('cards').getAll()
      read.onerror = () => reject(read.error ?? new Error('Card history read failed'))
      read.onsuccess = () => { database.close(); resolve(read.result.find((card) => card.fsrsCard.state !== 0 || card.fsrsCard.reps > 0)?.wordId) }
    }
  }))
}

await mkdir(screenshotDir, { recursive: true })
await copyFile(join(process.cwd(), 'audit', 'bbdcd-v1.2', 'study-after-home-redesign.png'), join(screenshotDir, 'v1.2-study-baseline.png'))
const browser = await chromium.launch()

try {
  const desktop = await setup(browser, { width: 1920, height: 1080 }, 'cet6-focus:v1.3-desktop-capture')
  await setBackground(desktop, 'aurora-01')
  await setDailyNewWords(desktop, 1)
  await resetCardsToNew(desktop)
  await gotoStudy(desktop)
  await shot(desktop, 'study-recall-desktop.png')

  await addContextFixture(desktop)
  await gotoStudy(desktop)
  await desktop.getByRole('button', { name: /^不认识/ }).click()
  await desktop.getByRole('region', { name: '语境提示' }).waitFor({ state: 'visible', timeout: 10_000 })
  await shot(desktop, 'study-context-desktop.png')
  await desktop.getByRole('button', { name: '查看核心词义' }).click()
  await desktop.getByRole('region', { name: '核心词义' }).waitFor({ state: 'visible', timeout: 10_000 })
  await shot(desktop, 'study-meaning-desktop.png')

  await resetCardsToNew(desktop)
  await gotoStudy(desktop)
  await desktop.getByRole('button', { name: /^认识/ }).click()
  await desktop.getByRole('button', { name: /确认认识并继续/ }).click()
  await waitForComplete(desktop)
  const reviewedWordId = await cardIdWithHistory(desktop)
  if (!reviewedWordId) throw new Error('Could not identify the reviewed card for Review capture')
  await patchCardDue(desktop, reviewedWordId)
  await gotoStudy(desktop, '/review')
  await shot(desktop, 'review-recall-desktop.png')
  await desktop.getByRole('button', { name: /^认识/ }).click()
  await desktop.getByRole('region', { name: '核心词义' }).waitFor({ state: 'visible', timeout: 10_000 })
  await shot(desktop, 'review-meaning-desktop.png')

  await resetCardsToNew(desktop)
  await gotoStudy(desktop)
  await desktop.getByRole('button', { name: /^认识/ }).click()
  await desktop.getByRole('button', { name: /确认认识并继续/ }).click()
  await waitForComplete(desktop)
  await shot(desktop, 'study-complete-desktop.png')
  await desktop.context().close()

  const iphone = await setup(browser, { width: 390, height: 844 }, 'cet6-focus:v1.3-iphone-capture')
  await setBackground(iphone, 'waterfall-02')
  await setDailyNewWords(iphone, 1)
  await resetCardsToNew(iphone)
  await gotoStudy(iphone)
  await shot(iphone, 'study-recall-iphone-390.png')
  await iphone.getByRole('button', { name: /^认识/ }).click()
  await iphone.getByRole('region', { name: '核心词义' }).waitFor({ state: 'visible', timeout: 10_000 })
  await shot(iphone, 'study-meaning-iphone-390.png')

  await resetCardsToNew(iphone)
  await addContextFixture(iphone)
  await gotoStudy(iphone)
  await iphone.getByRole('button', { name: /^不认识/ }).click()
  await iphone.getByRole('region', { name: '语境提示' }).waitFor({ state: 'visible', timeout: 10_000 })
  await shot(iphone, 'study-context-iphone-390.png')

  await resetCardsToNew(iphone)
  await gotoStudy(iphone)
  await iphone.getByRole('button', { name: /^认识/ }).click()
  await iphone.getByRole('button', { name: /确认认识并继续/ }).click()
  await waitForComplete(iphone)
  await shot(iphone, 'study-complete-iphone-390.png')
  await iphone.context().close()

  const ipad = await setup(browser, { width: 834, height: 1112 }, 'cet6-focus:v1.3-ipad-capture')
  await setBackground(ipad, 'lighthouse-02')
  await setDailyNewWords(ipad, 1)
  await resetCardsToNew(ipad)
  await gotoStudy(ipad)
  await shot(ipad, 'study-recall-ipad.png')
  await ipad.getByRole('button', { name: /^认识/ }).click()
  await ipad.getByRole('region', { name: '核心词义' }).waitFor({ state: 'visible', timeout: 10_000 })
  await shot(ipad, 'study-meaning-ipad.png')
  await ipad.context().close()

  if (consoleErrors.length || pageErrors.length) throw new Error(JSON.stringify({ consoleErrors, pageErrors }))
  console.log(JSON.stringify({ baseURL, screenshotDir, screenshots: 13, consoleErrors, pageErrors }, null, 2))
} finally {
  for (const context of contexts) await context.close().catch(() => {})
  await browser.close()
}
