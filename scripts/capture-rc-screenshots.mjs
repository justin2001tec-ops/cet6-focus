import { chromium } from '@playwright/test'
import { join } from 'node:path'

const baseURL = process.env.CET6_PREVIEW_URL ?? 'http://127.0.0.1:4177'
const screenshotDir = join(process.cwd(), 'audit', 'screenshots')

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

async function waitFor(page, selector) {
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: 15_000 })
}

async function capture(viewport, names) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  const page = await context.newPage()
  await page.addInitScript(() => {
    const resetKey = 'cet6-focus:rc-screenshot-reset'
    if (!sessionStorage.getItem(resetKey)) {
      sessionStorage.setItem(resetKey, '1')
      indexedDB.deleteDatabase('cet6-focus')
    }
  })
  await onboard(page)
  await seedAuditData(page)

  await page.goto(`${baseURL}/#/`, { waitUntil: 'domcontentloaded' })
  await waitFor(page, '.page--dashboard')
  if (names.dashboard) await page.screenshot({ path: join(screenshotDir, names.dashboard) })

  await page.goto(`${baseURL}/#/today`, { waitUntil: 'domcontentloaded' })
  await waitFor(page, '.study-toolbar')
  if (names.today) await page.screenshot({ path: join(screenshotDir, names.today) })

  await page.goto(`${baseURL}/#/study`, { waitUntil: 'domcontentloaded' })
  await waitFor(page, '.page--study')
  if (names.study) await page.screenshot({ path: join(screenshotDir, names.study) })

  await page.goto(`${baseURL}/#/dictation`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '听写，把认识变成会写。' }).waitFor({ state: 'visible', timeout: 15_000 })
  await page.getByRole('tab', { name: /看中文写英文/ }).click()
  if (names.dictation) await page.screenshot({ path: join(screenshotDir, names.dictation) })

  await page.goto(`${baseURL}/#/mistakes`, { waitUntil: 'domcontentloaded' })
  await waitFor(page, '.page--mistakes')
  if (names.mistakes) await page.screenshot({ path: join(screenshotDir, names.mistakes) })

  await page.goto(`${baseURL}/#/stats`, { waitUntil: 'domcontentloaded' })
  await waitFor(page, '.page--stats')
  if (names.stats) await page.screenshot({ path: join(screenshotDir, names.stats) })

  await page.goto(`${baseURL}/#/settings`, { waitUntil: 'domcontentloaded' })
  await waitFor(page, '.page--settings')
  if (names.settings) await page.screenshot({ path: join(screenshotDir, names.settings) })

  await context.close()
  await browser.close()
}

await capture({ width: 1440, height: 900 }, {
  dashboard: 'dashboard-desktop.png',
  today: 'today-review-desktop.png',
  study: 'study-desktop.png',
  dictation: 'dictation-desktop.png',
  mistakes: 'mistakes-desktop.png',
  stats: 'stats-desktop.png',
  settings: 'settings-desktop.png',
})

await capture({ width: 375, height: 812 }, {
  dashboard: 'dashboard-mobile-375.png',
  study: 'study-mobile-375.png',
  dictation: 'dictation-mobile-375.png',
})
