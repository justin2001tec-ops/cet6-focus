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

async function gotoStudy(page: Page): Promise<void> {
  await page.goto('/#/study', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.learning-shell')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('region', { name: '回忆判断' })).toBeVisible({ timeout: 15_000 })
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
  await expect(page.getByRole('region', { name: '回忆判断' })).toBeVisible()
  await expect(page.getByRole('region', { name: '回忆判断' }).locator('button')).toHaveCount(3)
  await expect(page.getByRole('region', { name: '回忆判断' })).not.toContainText('先凭记忆想一想')
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
    if (choice !== '认识') await page.getByRole('button', { name: '查看核心词义' }).click()
    await page.getByRole('button', { name: '继续', exact: true }).click()
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
  await gotoStudy(page)

  await page.getByRole('button', { name: /^不认识/ }).click()
  const context = page.getByRole('region', { name: '语境提示' })
  await expect(context).toBeVisible()
  await expect(context).toContainText('abandon')
  await expect(context).not.toContainText('We had to abandon the plan before the storm arrived.')
  await expect(context).not.toContainText('译文已收起')
  await expect(page.locator('.learning-core-meaning')).toHaveCount(0)

  await page.getByRole('button', { name: '查看核心词义' }).click()
  await expect(page.getByRole('region', { name: '核心词义' })).toBeVisible()
  await expect(page.locator('.learning-core-meaning')).toContainText('放弃')
    await expect(page.getByRole('button', { name: '扩展理解' })).toBeVisible()
    await expect(page.getByRole('button', { name: '继续', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '扩展理解' }).click()
    await expect(page.getByRole('region', { name: '扩展理解' })).toContainText('English definition')
  await expect(page.getByRole('button', { name: '返回核心词义' })).toBeVisible()
  await expect(page.getByRole('button', { name: '继续', exact: true })).toBeVisible()
})

test('Meaning and Detail expose one readable continuation action on mobile', async ({ page }) => {
  await preparePage(page)
  await completeOnboarding(page)
  await setDailyNewWords(page, 1)

  for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
    await page.setViewportSize(viewport)
    await resetCardsToNew(page)
    await gotoStudy(page)
    await page.getByRole('button', { name: /^不认识/ }).click()
    await page.getByRole('button', { name: '查看核心词义' }).click()

    const meaningActions = page.locator('.learning-stage--meaning .learning-stage-actions')
    await expect(meaningActions.getByRole('button', { name: '继续', exact: true })).toBeVisible()
    const meaningMetrics = await meaningActions.evaluate((element) => {
      const primary = element.querySelector('.learning-stage-actions__primary') as HTMLElement
      const style = window.getComputedStyle(primary)
      const rect = primary.getBoundingClientRect()
      return { labels: [...element.querySelectorAll('button')].map((button) => button.innerText.trim()), primaryWidth: rect.width, actionWidth: element.getBoundingClientRect().width, height: rect.height, minHeight: Number.parseFloat(style.minHeight), fontSize: Number.parseFloat(style.fontSize) }
    })
    expect(meaningMetrics.labels).toEqual(['返回', '扩展理解', '继续'])
    expect(meaningMetrics.primaryWidth).toBeGreaterThanOrEqual(meaningMetrics.actionWidth * 0.78)
    expect(meaningMetrics.minHeight).toBeGreaterThanOrEqual(48)
    expect(meaningMetrics.height).toBeGreaterThanOrEqual(47.5)
    expect(meaningMetrics.fontSize).toBeGreaterThanOrEqual(15)
    expect(await page.locator('.learning-word-header h1').evaluate((element) => window.getComputedStyle(element).fontFamily)).toContain('Inter')
    expect(await page.locator('.learning-word-header h1').evaluate((element) => window.getComputedStyle(element).fontWeight)).toBe('600')

    const meaningOverflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth - document.documentElement.clientWidth, height: document.documentElement.scrollHeight - document.documentElement.clientHeight }))
    expect(meaningOverflow.width).toBeLessThanOrEqual(1)
    expect(meaningOverflow.height).toBeLessThanOrEqual(1)

    await meaningActions.getByRole('button', { name: '扩展理解' }).click()
    const detailActions = page.locator('.learning-stage--detail .learning-stage-actions')
    await expect(detailActions.getByRole('button', { name: '返回核心词义' })).toBeVisible()
    await expect(detailActions.getByRole('button', { name: '继续', exact: true })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('确认认识并继续')
    const detailOverflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth - document.documentElement.clientWidth, height: document.documentElement.scrollHeight - document.documentElement.clientHeight }))
    expect(detailOverflow.width).toBeLessThanOrEqual(1)
    expect(detailOverflow.height).toBeGreaterThanOrEqual(0)
    await detailActions.getByRole('button', { name: '继续', exact: true }).scrollIntoViewIfNeeded()
    await expect(detailActions.getByRole('button', { name: '继续', exact: true })).toBeVisible()
  }
})

test('Home to Study uses the progressive transition bridge without changing the photo scale', async ({ page }) => {
  await preparePage(page)
  await completeOnboarding(page)
  await setDailyNewWords(page, 1)
  await resetCardsToNew(page)
  const before = await page.locator('.app-background').evaluate((element) => ({ transform: window.getComputedStyle(element).transform, src: element.querySelector('img')?.getAttribute('src') ?? null }))
  await page.locator('.immersive-home__task-card--learn').click()
  await expect(page.locator('.learning-shell')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.learning-stage')).toBeVisible({ timeout: 15_000 })
  const after = await page.locator('.app-background').evaluate((element) => ({ transform: window.getComputedStyle(element).transform, src: element.querySelector('img')?.getAttribute('src') ?? null }))
  expect(after.transform).toBe(before.transform)
  expect(after.src).toBe(before.src)
})

test('Undo restores the same word, Recall state, and removes its ReviewLog', async ({ page }) => {
  await preparePage(page)
  await completeOnboarding(page)
  await setDailyNewWords(page, 1)
  await resetCardsToNew(page)
  await gotoStudy(page)
  const word = await page.locator('.learning-word-header h1').innerText()
  await page.getByRole('button', { name: /^认识/ }).click()
  await page.getByRole('button', { name: '继续', exact: true }).click()
  await expect(page.getByRole('heading', { name: '这一组，完成了。' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /撤销上一词/ }).click()
  await expect(page.getByRole('region', { name: '回忆判断' })).toBeVisible()
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
  await page.getByRole('button', { name: '继续', exact: true }).click()
  await expect(page.getByRole('heading', { name: '这一组，完成了。' })).toBeVisible({ timeout: 15_000 })
})
