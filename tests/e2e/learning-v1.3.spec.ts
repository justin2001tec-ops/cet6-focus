import { expect, test, type Page } from '@playwright/test'

type ReviewLog = { wordId: string; sessionId: string; rating: number }

async function preparePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const resetKey = 'cet6-focus:v1.3-learning-reset'
    if (!sessionStorage.getItem(resetKey)) {
      sessionStorage.setItem(resetKey, '1')
      indexedDB.deleteDatabase('cet6-focus')
    }
  })
}

async function completeOnboarding(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: '每天打开，都知道下一步做什么。' })).toBeVisible({ timeout: 15_000 })
  for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /开始备考/ }).click()
  await expect(page.locator('.immersive-home__featured-word')).toBeVisible({ timeout: 15_000 })
}

async function setDailyNewWords(page: Page, dailyNewWords: number): Promise<void> {
  await page.evaluate((value) => new Promise<void>((resolve, reject) => {
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
      transaction.onerror = () => reject(transaction.error ?? new Error('Settings write failed'))
    }
  }), dailyNewWords)
}

async function resetCardsToNew(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction(['cards', 'reviewLogs', 'sessions'], 'readwrite')
      const cards = transaction.objectStore('cards')
      const cardsRequest = cards.getAll()
      cardsRequest.onerror = () => reject(cardsRequest.error ?? new Error('Cards read failed'))
      cardsRequest.onsuccess = () => {
        const now = new Date().toISOString()
        for (const card of cardsRequest.result) cards.put({
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

async function addContextFixture(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('words', 'readwrite')
      const store = transaction.objectStore('words')
      const getRequest = store.get('cet6-abandon')
      getRequest.onerror = () => reject(getRequest.error ?? new Error('Context fixture read failed'))
      getRequest.onsuccess = () => store.put({
        ...getRequest.result,
        examples: [{ en: 'We had to abandon the plan before the storm arrived.', zh: '暴风雨来临前，我们不得不放弃计划。' }],
      })
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Context fixture write failed'))
    }
  }))
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function gotoStudy(page: Page): Promise<void> {
  await page.goto('/#/study', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.learning-shell')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('region', { name: '先凭记忆想一想' })).toBeVisible({ timeout: 15_000 })
  await page.waitForTimeout(250)
}

async function readReviewLogs(page: Page): Promise<ReviewLog[]> {
  return page.evaluate(() => new Promise<ReviewLog[]>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('reviewLogs', 'readonly')
      const read = transaction.objectStore('reviewLogs').getAll()
      read.onsuccess = () => { database.close(); resolve(read.result as ReviewLog[]) }
      read.onerror = () => reject(read.error ?? new Error('ReviewLog read failed'))
    }
  }))
}

test('Study Recall is a readable recognition-first canvas without FSRS vocabulary', async ({ page }) => {
  await preparePage(page)
  await completeOnboarding(page)
  await gotoStudy(page)

  await expect(page.locator('.learning-word-header h1')).toBeVisible()
  await expect(page.locator('.learning-word-header__phonetic')).toBeVisible()
  await expect(page.getByRole('region', { name: '现在的感觉' })).toBeVisible()
  const bodyText = await page.locator('body').innerText()
  for (const forbidden of ['Again', 'Hard', 'Good', 'Easy', 'FSRS', 'Stability', 'Difficulty', 'NEW WORD', 'DUE REVIEW', 'WEAK WORD', '忘记', '困难', '良好', '轻松']) expect(bodyText).not.toContain(forbidden)
})

test('Recognition adapter records unknown, fuzzy, and known as ratings 1, 2, and 3', async ({ page }) => {
  await preparePage(page)
  await completeOnboarding(page)
  await setDailyNewWords(page, 1)

  for (const [choice, rating] of [['不认识', 1], ['模糊', 2], ['认识', 3]] as const) {
    await resetCardsToNew(page)
    await gotoStudy(page)
    await page.getByRole('button', { name: new RegExp(`^${choice}`) }).click()
    await page.getByRole('button', { name: new RegExp(`确认${choice}并继续`) }).click()
    await expect(page.getByRole('heading', { name: '这一组，完成了。' })).toBeVisible({ timeout: 15_000 })
    const logs = await readReviewLogs(page)
    expect(logs).toHaveLength(1)
    expect(logs[0].rating).toBe(rating)
  }
})

test('Context appears only when a real example exists, then meaning and detail remain progressive', async ({ page }) => {
  await preparePage(page)
  await completeOnboarding(page)
  await setDailyNewWords(page, 1)
  await addContextFixture(page)
  await gotoStudy(page)

  await page.getByRole('button', { name: /^不认识/ }).click()
  const context = page.getByRole('region', { name: '语境提示' })
  await expect(context).toBeVisible()
  await expect(context).toContainText('We had to abandon the plan')
  await expect(page.locator('.learning-core-meaning')).toHaveCount(0)

  await page.getByRole('button', { name: '查看核心词义' }).click()
  await expect(page.getByRole('region', { name: '核心词义' })).toBeVisible()
  await expect(page.locator('.learning-core-meaning')).toContainText('放弃')
  await expect(page.getByRole('button', { name: '展开更多' })).toBeVisible()
  await page.getByRole('button', { name: '展开更多' }).click()
  await expect(page.getByRole('region', { name: '扩展理解' })).toContainText('English definition')
})

test('Undo restores the same word, Recall state, and removes its ReviewLog', async ({ page }) => {
  await preparePage(page)
  await completeOnboarding(page)
  await setDailyNewWords(page, 1)
  await resetCardsToNew(page)
  await gotoStudy(page)
  const word = await page.locator('.learning-word-header h1').innerText()
  await page.getByRole('button', { name: /^认识/ }).click()
  await page.getByRole('button', { name: /确认认识并继续/ }).click()
  await expect(page.getByRole('heading', { name: '这一组，完成了。' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /撤销上一词/ }).click()
  await expect(page.getByRole('region', { name: '先凭记忆想一想' })).toBeVisible()
  await expect(page.locator('.learning-word-header h1')).toHaveText(word)
  const logs = await readReviewLogs(page)
  expect(logs).toHaveLength(0)
})

test('Reduced motion remains completable and required learning sizes have no overflow', async ({ page }, testInfo) => {
  await preparePage(page)
  await completeOnboarding(page)
  await setDailyNewWords(page, 1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await resetCardsToNew(page)

  const viewports = testInfo.project.name === 'mobile'
    ? [{ width: 390, height: 844 }, { width: 430, height: 932 }]
    : [{ width: 390, height: 844 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 834, height: 1112 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await gotoStudy(page)
    const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, scrollHeight: document.documentElement.scrollHeight, clientHeight: document.documentElement.clientHeight }))
    expect(metrics.scrollWidth - metrics.clientWidth).toBeLessThanOrEqual(1)
    expect(metrics.scrollHeight - metrics.clientHeight).toBeLessThanOrEqual(1)
  }

  await page.getByRole('button', { name: /^认识/ }).click()
  await page.getByRole('button', { name: /确认认识并继续/ }).click()
  await expect(page.getByRole('heading', { name: '这一组，完成了。' })).toBeVisible({ timeout: 15_000 })
})
