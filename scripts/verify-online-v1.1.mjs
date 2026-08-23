import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const baseURL = process.env.CET6_RELEASE_URL ?? 'https://justin2001tec-ops.github.io/cet6-focus/'
const screenshotPath = join(process.cwd(), 'audit', 'screenshots', 'online-v1.1-smoke.png')
const results = []
const consoleErrors = []
const pageErrors = []
const requestFailures = []

function check(name, condition, detail = '') {
  const result = { name, status: condition ? 'PASS' : 'FAIL', detail }
  results.push(result)
  if (!condition) throw new Error(`${name}${detail ? `: ${detail}` : ''}`)
}

async function readDatabase(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const names = ['words', 'cards', 'reviewLogs', 'sessions', 'settings']
      Promise.all(names.map((name) => new Promise((storeResolve, storeReject) => {
        const storeRequest = database.transaction(name, 'readonly').objectStore(name).getAll()
        storeRequest.onsuccess = () => storeResolve(storeRequest.result)
        storeRequest.onerror = () => storeReject(storeRequest.error ?? new Error(`Cannot read ${name}`))
      }))).then(([words, cards, reviewLogs, sessions, settings]) => {
        database.close()
        resolve({ words, cards, reviewLogs, sessions, settings: settings[0] ?? null })
      }).catch((error) => {
        database.close()
        reject(error)
      })
    }
  }))
}

async function updateDailyNewWords(page, dailyNewWords) {
  await page.evaluate((value) => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('settings', 'readwrite')
      const store = transaction.objectStore('settings')
      const getRequest = store.get('app')
      getRequest.onerror = () => reject(getRequest.error ?? new Error('Settings read failed'))
      getRequest.onsuccess = () => store.put({ ...getRequest.result, dailyNewWords: value, updatedAt: new Date().toISOString() })
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Settings update failed'))
    }
  }), dailyNewWords)
}

async function patchCardDue(page, wordId) {
  await page.evaluate((id) => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('cards', 'readwrite')
      const store = transaction.objectStore('cards')
      const getRequest = store.get(id)
      getRequest.onerror = () => reject(getRequest.error ?? new Error('Card read failed'))
      getRequest.onsuccess = () => {
        const card = getRequest.result
        const due = '2000-01-01T00:00:00.000Z'
        store.put({ ...card, due, fsrsCard: { ...card.fsrsCard, due }, updatedAt: new Date().toISOString() })
      }
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Card update failed'))
    }
  }), wordId)
}

async function seedDictationCard(page) {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('cards', 'readwrite')
      const store = transaction.objectStore('cards')
      const getRequest = store.getAll()
      getRequest.onerror = () => reject(getRequest.error ?? new Error('Cards read failed'))
      getRequest.onsuccess = () => {
        const card = getRequest.result[0]
        if (!card) {
          reject(new Error('No card available for dictation fixture'))
          return
        }
        const fsrsCard = { ...card.fsrsCard, due: '2099-01-01T00:00:00.000Z', state: 2, reps: Math.max(1, card.fsrsCard.reps), lastReview: '2026-08-20T08:00:00.000Z' }
        store.put({ ...card, due: fsrsCard.due, fsrsCard, spellingWrongCount: 0, lastSpellingAt: undefined, lastDictationAt: undefined, updatedAt: new Date().toISOString() })
        transaction.oncomplete = () => { database.close(); resolve({ wordId: card.wordId, fsrsCard, due: fsrsCard.due }) }
      }
      transaction.onerror = () => reject(transaction.error ?? new Error('Dictation fixture update failed'))
    }
  }))
}

async function completeOnboarding(page) {
  await page.getByRole('heading', { name: '每天打开，都知道下一步做什么。' }).waitFor({ state: 'visible', timeout: 20_000 })
  for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /开始备考/ }).click()
  await page.getByRole('button', { name: /开始今日学习/ }).waitFor({ state: 'visible', timeout: 20_000 })
}

async function finishStudyCard(page) {
  const word = (await page.locator('h2').textContent())?.trim()
  check('Today Flow study card has a word', Boolean(word))
  await page.getByRole('button', { name: /显示释义/ }).click()
  await page.getByRole('button', { name: /良好/ }).click()
  await page.getByRole('heading', { name: '这一段，完成了。' }).waitFor({ state: 'visible', timeout: 15_000 })
  return word
}

function observeRuntimeErrors(page) {
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }))
}

async function runOnlineTodayFlow(browser) {
  const flowContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'zh-CN' })
  const flowPage = await flowContext.newPage()
  observeRuntimeErrors(flowPage)
  try {
    const response = await flowPage.goto(baseURL, { waitUntil: 'domcontentloaded' })
    check('Today Flow first load HTTP', response?.status() === 200, String(response?.status() ?? 'no response'))
    await completeOnboarding(flowPage)
    await updateDailyNewWords(flowPage, 1)
    await flowPage.reload({ waitUntil: 'domcontentloaded' })

    await flowPage.goto(`${baseURL}#/study`, { waitUntil: 'domcontentloaded' })
    await flowPage.locator('.page--study').waitFor({ state: 'visible', timeout: 20_000 })
    await finishStudyCard(flowPage)
    const afterInitialStudy = await readDatabase(flowPage)
    const encounteredId = afterInitialStudy.cards.find((card) => card.fsrsCard.state !== 0 || card.fsrsCard.reps > 0)?.wordId
    check('Today Flow creates a reviewable card', Boolean(encounteredId))
    await patchCardDue(flowPage, encounteredId)

    await flowPage.goto(`${baseURL}#/`, { waitUntil: 'domcontentloaded' })
    await flowPage.getByRole('button', { name: /开始今日学习/ }).waitFor({ state: 'visible', timeout: 20_000 })
    await flowPage.getByRole('button', { name: /开始今日学习/ }).click()
    await flowPage.locator('.study-toolbar .eyebrow').waitFor({ state: 'visible', timeout: 15_000 })
    check('Today Flow starts with Review', (await flowPage.locator('.study-toolbar .eyebrow').textContent())?.trim() === '到期复习')
    await finishStudyCard(flowPage)

    await flowPage.getByRole('button', { name: '继续今日学习' }).click()
    await flowPage.locator('.study-toolbar .eyebrow').waitFor({ state: 'visible', timeout: 15_000 })
    check('Today Flow continues with New Study', (await flowPage.locator('.study-toolbar .eyebrow').textContent())?.trim() === '今日学习')
    await finishStudyCard(flowPage)

    await flowPage.getByRole('button', { name: '进入听写强化' }).click()
    await flowPage.getByRole('heading', { name: '听写，把认识变成会写。' }).waitFor({ state: 'visible', timeout: 20_000 })
    for (let index = 0; index < 2; index += 1) {
      const input = flowPage.locator('#dictation-input')
      await input.fill('not-the-answer')
      await flowPage.getByRole('button', { name: /提交/ }).click()
      await flowPage.locator('.spell-diff').waitFor({ state: 'visible', timeout: 15_000 })
      const answer = (await flowPage.locator('.spell-diff').textContent())?.trim()
      check(`Today Flow dictation correction ${index + 1}`, Boolean(answer))
      await input.fill(answer ?? '')
      await flowPage.getByRole('button', { name: /重新输入正确拼写/ }).click()
      if (index === 0) {
        await flowPage.waitForFunction(() => document.querySelector('.dictation-card__meta')?.textContent?.includes('2 / 2'), undefined, { timeout: 15_000 })
        const dictationMeta = (await flowPage.locator('.dictation-card__meta').textContent())?.trim() ?? ''
        check('Today Flow dictation advances to card 2', dictationMeta.includes('2 / 2'), dictationMeta)
      }
    }
    await flowPage.getByRole('heading', { name: '今日学习完成。' }).waitFor({ state: 'visible', timeout: 20_000 })
    const finished = await readDatabase(flowPage)
    check('Today Flow writes Review, Study, and Dictation sessions', ['review', 'study', 'dictation'].every((type) => finished.sessions.some((session) => session.type === type)))
    const dictationSession = finished.sessions.find((session) => session.type === 'dictation')
    check('Today Flow records two corrected dictation attempts', dictationSession?.attempted === 2 && dictationSession?.correct === 0 && dictationSession?.wrong === 2 && dictationSession?.corrected === 2, JSON.stringify(dictationSession))
    check('Today Flow writes three ReviewLogs', finished.reviewLogs.length === 3, String(finished.reviewLogs.length))
  } finally {
    await flowContext.close()
  }
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'zh-CN' })
  const page = await context.newPage()
  observeRuntimeErrors(page)

  try {
    const rootResponse = await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
    check('First load HTTP', rootResponse?.status() === 200, String(rootResponse?.status() ?? 'no response'))
    await completeOnboarding(page)
    check('Dashboard renders after onboarding', await page.locator('.page--dashboard').isVisible())

    const assets = ['manifest.webmanifest', 'sw.js', 'data/cet6-vocab.v1.json', 'backgrounds/study-05.webp', 'icon.svg']
    const assetResults = await page.evaluate(async (paths) => Promise.all(paths.map(async (path) => {
      const response = await fetch(new URL(path, document.baseURI))
      return { path, status: response.status, ok: response.ok, url: response.url }
    })), assets)
    for (const asset of assetResults) check(`Asset ${asset.path}`, asset.ok, `${asset.status} ${asset.url}`)
    check('Pages assets use /cet6-focus/ base', assetResults.every((asset) => new URL(asset.url).pathname.startsWith('/cet6-focus/')))

    await updateDailyNewWords(page, 1)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.goto(`${baseURL}#/study`, { waitUntil: 'domcontentloaded' })
    await page.locator('.page--study').waitFor({ state: 'visible', timeout: 20_000 })
    const studyWord = (await page.locator('h2').textContent())?.trim()
    check('Study loads a word', Boolean(studyWord))
    await page.getByRole('button', { name: /显示释义/ }).click()
    await page.getByRole('button', { name: /良好/ }).click()
    await page.getByRole('heading', { name: '这一段，完成了。' }).waitFor({ state: 'visible', timeout: 15_000 })
    const afterStudy = await readDatabase(page)
    check('Study writes ReviewLog', afterStudy.reviewLogs.length >= 1)
    check('Study writes StudySession', afterStudy.sessions.some((session) => session.type === 'study'))
    const persistencePage = await context.newPage()
    await persistencePage.goto(`${baseURL}#/study`, { waitUntil: 'domcontentloaded' })
    const afterReload = await readDatabase(persistencePage)
    check('Learning data survives production reload', afterReload.reviewLogs.length === afterStudy.reviewLogs.length && afterReload.sessions.length === afterStudy.sessions.length)
    await persistencePage.close()

    await page.getByRole('button', { name: /撤销上一张/ }).click()
    await page.locator('h2').filter({ hasText: studyWord ?? '' }).waitFor({ state: 'visible', timeout: 15_000 })
    const afterUndo = await readDatabase(page)
    check('Undo restores the same study word', (await page.locator('h2').textContent())?.trim() === studyWord)
    check('Undo removes the last ReviewLog', afterUndo.reviewLogs.length === Math.max(0, afterStudy.reviewLogs.length - 1))

    const dictationFixture = await seedDictationCard(page)
    const beforeDictation = await readDatabase(page)
    const beforeDictationCard = beforeDictation.cards.find((card) => card.wordId === dictationFixture.wordId)
    await page.goto(`${baseURL}#/dictation`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: '听写，把认识变成会写。' }).waitFor({ state: 'visible', timeout: 20_000 })
    await page.locator('#dictation-input').fill('not-the-answer')
    await page.getByRole('button', { name: /提交/ }).click()
    await page.locator('.spell-diff').waitFor({ state: 'visible', timeout: 15_000 })
    const answer = (await page.locator('.spell-diff').textContent())?.trim()
    check('Dictation returns a correction', Boolean(answer))
    await page.locator('#dictation-input').fill(answer ?? '')
    await page.getByRole('button', { name: /重新输入正确拼写/ }).click()
    await page.getByRole('heading', { name: /统计，为了看见节奏/ }).waitFor({ state: 'visible', timeout: 20_000 })
    const afterDictation = await readDatabase(page)
    const afterDictationCard = afterDictation.cards.find((card) => card.wordId === dictationFixture.wordId)
    const dictationSession = afterDictation.sessions.find((session) => session.type === 'dictation')
    check('Dictation writes a Dictation session', Boolean(dictationSession))
    check('Dictation spelling signal increments', (afterDictationCard?.spellingWrongCount ?? 0) >= 1)
    check('Dictation leaves FSRS unchanged', JSON.stringify(afterDictationCard?.fsrsCard) === JSON.stringify(beforeDictationCard?.fsrsCard) && afterDictationCard?.due === beforeDictationCard?.due)
    check('Dictation does not add a ReviewLog', afterDictation.reviewLogs.length === beforeDictation.reviewLogs.length)

    for (const [route, selector] of [['/mistakes', '.page--mistakes'], ['/stats', '.page--stats'], ['/settings', '.page--settings']] ) {
      await page.goto(`${baseURL}#${route}`, { waitUntil: 'domcontentloaded' })
      await page.locator(selector).waitFor({ state: 'visible', timeout: 20_000 })
      check(`${route} renders`, await page.locator(selector).isVisible())
    }

    await page.goto(`${baseURL}#/settings`, { waitUntil: 'domcontentloaded' })
    await page.locator('.page--settings').waitFor({ state: 'visible', timeout: 20_000 })
    await page.locator('label.field-label').filter({ hasText: '每日新词' }).locator('select').selectOption('20')
    await page.locator('label.field-label').filter({ hasText: '预计学习时间' }).locator('select').selectOption('20')
    await page.locator('label.field-label').filter({ hasText: '目标记忆保持率' }).locator('select').selectOption('0.9')
    await page.locator('label.field-label').filter({ hasText: '默认发音' }).locator('select').selectOption('en-GB')
    await page.waitForTimeout(500)
    const updatedSettings = (await readDatabase(page)).settings
    check('Learning settings persist in IndexedDB', updatedSettings?.dailyNewWords === 20 && updatedSettings?.dailyMinutes === 20 && updatedSettings?.targetRetention === 0.9 && updatedSettings?.pronunciation === 'en-GB', JSON.stringify(updatedSettings))
    await page.getByRole('button', { name: '深色' }).click()
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark')
    check('Dark theme applies', await page.evaluate(() => document.documentElement.dataset.theme === 'dark'))
    await page.getByRole('button', { name: '浅色' }).click()
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light')
    check('Light theme applies', await page.evaluate(() => document.documentElement.dataset.theme === 'light'))
    await page.getByRole('button', { name: '跟随系统' }).click()
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'system')
    check('System theme applies', await page.evaluate(() => document.documentElement.dataset.theme === 'system'))
    const reducedMotionToggle = page.locator('label.toggle-row').filter({ hasText: '减少动效' }).locator('input[type="checkbox"]')
    await reducedMotionToggle.click()
    await page.waitForFunction(() => document.documentElement.dataset.reducedMotion === 'true')
    check('Reduced motion applies', await page.evaluate(() => document.documentElement.dataset.reducedMotion === 'true') && await reducedMotionToggle.isChecked())
    await reducedMotionToggle.click()
    await page.waitForFunction(() => document.documentElement.dataset.reducedMotion === 'false')
    check('Reduced motion can be disabled', await page.evaluate(() => document.documentElement.dataset.reducedMotion === 'false') && !(await reducedMotionToggle.isChecked()))
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /导出学习数据/ }).click(),
    ])
    check('Settings backup export starts', Boolean(await download.suggestedFilename()))
    const backgroundSelect = page.locator('.background-options select').first()
    if (await backgroundSelect.count()) {
      await backgroundSelect.selectOption('fixed')
      await page.waitForTimeout(400)
      const settingsAfterBackground = await readDatabase(page)
      const fixedId = settingsAfterBackground.settings?.backgroundId
      check('Fixed background persists in IndexedDB', settingsAfterBackground.settings?.backgroundMode === 'fixed' && Boolean(fixedId))
      await page.reload({ waitUntil: 'domcontentloaded' })
      check('Fixed background survives reload', await page.locator('.app-background img').getAttribute('src').then((src) => Boolean(src && fixedId && src.includes(fixedId))))
    } else {
      check('Background controls present', false, 'No .background-options select found')
    }

    await runOnlineTodayFlow(browser)

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${baseURL}#/words`, { waitUntil: 'domcontentloaded' })
    const desktopRow = page.locator('.word-row').first()
    await desktopRow.waitFor({ state: 'visible', timeout: 20_000 })
    const href = await desktopRow.getAttribute('href')
    const wordRoute = href?.replace(/^#/, '') ?? ''
    const wordId = wordRoute.split('/').at(-1)
    check('Vocabulary desktop row has deep link', /^\/word\//.test(wordRoute) && Boolean(wordId))
    await page.goto(`${baseURL}#${wordRoute}`, { waitUntil: 'domcontentloaded' })
    await page.locator('.page--word-detail').waitFor({ state: 'visible', timeout: 20_000 })
    check('Desktop Word Detail route renders', await page.locator('.page--word-detail').isVisible())
    await page.goto(`${baseURL}#/words/${wordId}`, { waitUntil: 'domcontentloaded' })
    await page.locator('.page--word-detail').waitFor({ state: 'visible', timeout: 20_000 })
    check('Words alias route renders', await page.locator('.page--word-detail').isVisible())

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${baseURL}#/words`, { waitUntil: 'domcontentloaded' })
    const mobileRow = page.locator('.word-row').first()
    await mobileRow.waitFor({ state: 'visible', timeout: 20_000 })
    const mobileWord = (await mobileRow.locator('.word-row__word strong').textContent())?.trim()
    await mobileRow.click()
    const sheet = page.getByRole('dialog')
    await sheet.waitFor({ state: 'visible', timeout: 20_000 })
    await sheet.locator('.sheet-word-heading strong').waitFor({ state: 'visible', timeout: 20_000 })
    const sheetText = await sheet.textContent()
    check('Mobile Word Detail Bottom Sheet opens', await sheet.isVisible() && sheetText?.includes(mobileWord ?? ''), JSON.stringify({ mobileWord, sheetText }))
    check('Bottom Sheet keeps vocabulary URL', page.url().endsWith('#/words'))
    await page.getByRole('button', { name: '关闭词条详情' }).last().click()
    await sheet.waitFor({ state: 'hidden', timeout: 10_000 })
    check('Bottom Sheet restores focus', await page.evaluate(() => document.activeElement?.classList.contains('word-row')))

    for (const viewport of [{ width: 375, height: 812 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
      await page.setViewportSize(viewport)
      await page.goto(`${baseURL}#/`, { waitUntil: 'domcontentloaded' })
      const metrics = await page.evaluate(() => {
        const topbar = document.querySelector('.mobile-topbar')?.getBoundingClientRect()
        const nav = document.querySelector('.mobile-nav')?.getBoundingClientRect()
        return { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, topbarLeft: topbar?.left ?? 0, topbarRight: topbar?.right ?? 0, navBottom: nav?.bottom ?? 0, innerHeight: window.innerHeight }
      })
      check(`Mobile safe-area layout ${viewport.width}x${viewport.height}`, metrics.scrollWidth - metrics.innerWidth <= 1 && metrics.topbarLeft >= 0 && metrics.topbarRight <= metrics.innerWidth + 1 && metrics.navBottom <= metrics.innerHeight + 1, JSON.stringify(metrics))
    }

    await page.goto(`${baseURL}#/`, { waitUntil: 'networkidle' })
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload({ waitUntil: 'networkidle' })
    const pwaState = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready
      const cacheNames = await caches.keys()
      return { controller: Boolean(navigator.serviceWorker.controller), scope: registration.scope, cacheNames }
    })
    const cacheVocabulary = await page.evaluate(async () => {
      const names = await caches.keys()
      for (const name of names) if (await (await caches.open(name)).match(new URL('data/cet6-vocab.v1.json', document.baseURI))) return true
      return false
    })
    check('Service Worker controls production reload', pwaState.controller && pwaState.scope.startsWith(baseURL), JSON.stringify(pwaState))
    check('Service Worker caches vocabulary', cacheVocabulary)
    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('.page--dashboard').waitFor({ state: 'visible', timeout: 20_000 })
    check('Warm-cache offline reload renders app', await page.locator('.page--dashboard').isVisible())
    await context.setOffline(false)

    await mkdir(join(process.cwd(), 'audit', 'screenshots'), { recursive: true })
    await page.screenshot({ path: screenshotPath, fullPage: false })
    check('Online smoke screenshot captured', true, screenshotPath)
    check('Online console errors', consoleErrors.length === 0, JSON.stringify(consoleErrors))
    check('Online page errors', pageErrors.length === 0, JSON.stringify(pageErrors))
    check('Online failed network requests', requestFailures.length === 0, JSON.stringify(requestFailures))
    console.log(JSON.stringify({ url: baseURL, checks: results, pwaState, assetResults, onlineErrors: { consoleErrors, pageErrors, requestFailures }, screenshotPath }, null, 2))
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error.stack ?? error)
  console.log(JSON.stringify({ checks: results, onlineErrors: { consoleErrors, pageErrors, requestFailures } }, null, 2))
  process.exitCode = 1
})
