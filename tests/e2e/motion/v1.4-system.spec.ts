import { expect, test, type Page } from '@playwright/test'

async function preparePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const resetKey = 'cet6-focus:v1.4-motion-reset'
    sessionStorage.setItem(resetKey, '1')
  })
}

async function completeOnboarding(page: Page): Promise<void> {
  await page.goto('/#/', { waitUntil: 'domcontentloaded' })
  const onboarding = page.getByRole('heading', { name: '每天打开，都知道下一步做什么。' })
  await expect(onboarding).toBeVisible({ timeout: 40_000 })
  for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /开始备考/ }).click()
  await expect(page.locator('.immersive-home__featured-word')).toBeVisible({ timeout: 40_000 })
}

async function seedWarmDatabase(page: Page): Promise<void> {
  await page.goto('/data/cet6-vocab.v1.json', { waitUntil: 'commit' })
  await page.evaluate(async () => {
    const words = (await (await fetch('/data/cet6-vocab.v1.json')).json()).slice(0, 8) as Array<Record<string, unknown>>
    const now = new Date().toISOString()
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('cet6-focus', 2)
      request.onerror = () => reject(request.error ?? new Error('Warm database open failed'))
      request.onupgradeneeded = () => {
        const database = request.result
        const wordsStore = database.createObjectStore('words', { keyPath: 'id' })
        wordsStore.createIndex('word', 'word', { unique: false })
        wordsStore.createIndex('examTags', 'examTags', { unique: false, multiEntry: true })
        const cardsStore = database.createObjectStore('cards', { keyPath: 'wordId' })
        cardsStore.createIndex('due', 'due', { unique: false })
        cardsStore.createIndex('state', 'state', { unique: false })
        cardsStore.createIndex('starred', 'starred', { unique: false })
        cardsStore.createIndex('spellingWrongCount', 'spellingWrongCount', { unique: false })
        const logsStore = database.createObjectStore('reviewLogs', { keyPath: 'id', autoIncrement: true })
        logsStore.createIndex('wordId', 'wordId', { unique: false })
        logsStore.createIndex('sessionId', 'sessionId', { unique: false })
        logsStore.createIndex('reviewedAt', 'reviewedAt', { unique: false })
        logsStore.createIndex('rating', 'rating', { unique: false })
        const sessionsStore = database.createObjectStore('sessions', { keyPath: 'id' })
        sessionsStore.createIndex('type', 'type', { unique: false })
        sessionsStore.createIndex('startedAt', 'startedAt', { unique: false })
        database.createObjectStore('settings', { keyPath: 'id' })
      }
      request.onsuccess = () => {
        const database = request.result
        const transaction = database.transaction(['words', 'cards', 'settings'], 'readwrite')
        const card = (wordId: string) => ({ wordId, due: now, fsrsCard: { due: now, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, learningSteps: 0, reps: 0, lapses: 0, state: 0 }, starred: false, spellingWrongCount: 0, createdAt: now, updatedAt: now })
        const wordsStore = transaction.objectStore('words')
        const cardsStore = transaction.objectStore('cards')
        for (const word of words) {
          wordsStore.put({ ...word, archived: false })
          cardsStore.put(card(String(word.id)))
        }
        transaction.objectStore('settings').put({ id: 'app', theme: 'light', reducedMotion: false, backgroundMode: 'fixed', backgroundId: 'aurora-01', lastBackgroundId: 'aurora-01', dailyNewWords: 1, dailyMinutes: 30, targetRetention: 0.9, pronunciation: 'en-US', autoplayPronunciation: false, onboarded: true, dataVersion: 'cet6-vocab.v1', updatedAt: now })
        transaction.oncomplete = () => { database.close(); resolve() }
        transaction.onerror = () => reject(transaction.error ?? new Error('Warm database seed failed'))
      }
    })
  })
}

async function bootForMotion(page: Page, projectName: string): Promise<void> {
  if (projectName === 'webkit-motion') {
    await seedWarmDatabase(page)
    await page.goto('/#/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.immersive-home__featured-word')).toBeVisible({ timeout: 15_000 })
    return
  }
  await completeOnboarding(page)
}

test('Motion foundation exposes a real profile and keeps background memory bounded', async ({ page }, testInfo) => {
  await preparePage(page)
  await bootForMotion(page, testInfo.project.name)

  await expect(page.locator('html')).toHaveAttribute('data-motion-profile', 'full')
  await expect(page.locator('[data-motion-pressable="true"]').first()).toBeVisible()
  const metrics = await page.locator('.app-background').evaluate((element) => ({
    layerCount: Number(element.getAttribute('data-background-layer-count') ?? 0),
    imageCount: element.querySelectorAll('img').length,
    transform: window.getComputedStyle(element).transform,
  }))
  expect(metrics.layerCount).toBeLessThanOrEqual(2)
  expect(metrics.imageCount).toBeLessThanOrEqual(2)
  expect(metrics.transform).toBe('none')

  await page.locator('.immersive-home__task-card--learn').click()
  await expect(page.locator('.learning-shell').last()).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.motion-route').last()).toHaveAttribute('data-motion-route', 'learning')
  const studyTransform = await page.locator('.app-background').evaluate((element) => window.getComputedStyle(element).transform)
  expect(studyTransform).toBe('none')
})

test('Reduced motion is an actual route and interaction profile', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await preparePage(page)
  await bootForMotion(page, testInfo.project.name)
  await expect(page.locator('html')).toHaveAttribute('data-motion-profile', 'reduced')

  await page.locator('.immersive-home__task-card--learn').click()
  await expect(page.locator('.learning-shell').last()).toBeVisible({ timeout: 15_000 })
  const routeState = await page.locator('.motion-route').last().evaluate((element) => ({
    transform: window.getComputedStyle(element).transform,
    profile: document.documentElement.dataset.motionProfile,
  }))
  expect(routeState.profile).toBe('reduced')
  expect(routeState.transform).toBe('none')
})

test('Input modality, focus visibility, and effective 200% zoom preserve the layout contract', async ({ page }, testInfo) => {
  await preparePage(page)
  await bootForMotion(page, testInfo.project.name)
  await page.setViewportSize({ width: 800, height: 900 })

  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true })))
  await expect(page.locator('html')).toHaveAttribute('data-input-modality', 'coarse')
  await page.keyboard.press('Tab')
  await page.locator('.immersive-home__task-card--learn').focus()
  const focused = await page.evaluate(() => ({ tag: document.activeElement?.tagName ?? 'BODY', isFocused: document.activeElement !== document.body }))
  expect(focused.isFocused).toBe(true)
  expect(focused.tag).not.toBe('BODY')

  await page.evaluate(() => { document.documentElement.style.zoom = '2' })
  await page.waitForTimeout(100)
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  }))
  expect(overflow.width).toBeLessThanOrEqual(1)
})

test('PhysicalSheet is interruptible, velocity-aware, and browser-back dismissible', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await preparePage(page)
  await bootForMotion(page, testInfo.project.name)
  await page.goto('/#/words', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.word-row').first()).toBeVisible({ timeout: 15_000 })

  await page.locator('.word-row').first().click()
  const sheet = page.locator('[data-physical-sheet="true"]')
  await expect(sheet).toBeVisible()
  await expect(page.locator('.bottom-sheet__close')).toBeFocused()

  const grabber = page.locator('.bottom-sheet__grabber')
  const box = await grabber.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  for (const delta of [7, 14, 21, 28]) {
    await page.waitForTimeout(80)
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2 + delta)
  }
  await page.mouse.up()
  await expect(page.locator('.bottom-sheet')).toHaveAttribute('data-sheet-state', 'idle', { timeout: 1_000 })

  await page.locator('.bottom-sheet__close').click()
  await expect(sheet).toHaveCount(0)
  await page.locator('.word-row').first().click()
  await expect(sheet).toBeVisible()
  await expect(page.locator('.bottom-sheet__close')).toBeFocused()
  await expect(page.locator('.sheet-word-heading')).toBeVisible({ timeout: 5_000 })
  const sheetBox = await page.locator('.bottom-sheet').boundingBox()
  expect(sheetBox).not.toBeNull()
  const secondBox = await grabber.boundingBox()
  expect(secondBox).not.toBeNull()
  await page.mouse.move(secondBox!.x + secondBox!.width / 2, secondBox!.y + secondBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(secondBox!.x + secondBox!.width / 2, secondBox!.y + secondBox!.height / 2 + sheetBox!.height * 0.45, { steps: 4 })
  await page.mouse.up()
  await expect(sheet).toHaveCount(0, { timeout: 2_000 })

  await page.locator('.word-row').first().click()
  await expect(sheet).toBeVisible()
  await page.goBack()
  await expect(sheet).toHaveCount(0, { timeout: 2_000 })
})

test('Motion run records long-task and background budgets during route motion', async ({ page }, testInfo) => {
  await preparePage(page)
  await bootForMotion(page, testInfo.project.name)
  await page.evaluate(() => {
    const state = { supported: false, longTasks: [] as Array<{ duration: number; startTime: number }> }
    ;(window as Window & { __v14Perf?: typeof state }).__v14Perf = state
    try {
      const observer = new PerformanceObserver((list) => {
        state.longTasks.push(...list.getEntries().map((entry) => ({ duration: entry.duration, startTime: entry.startTime })))
      })
      observer.observe({ type: 'longtask', buffered: true })
      state.supported = true
    } catch {
      state.supported = false
    }
  })
  const start = await page.evaluate(() => performance.now())
  await page.locator('.immersive-home__task-card--learn').click()
  await expect(page.locator('.learning-shell').last()).toBeVisible({ timeout: 15_000 })
  await page.waitForTimeout(500)
  const result = await page.evaluate((motionStart) => {
    const state = (window as Window & { __v14Perf?: { supported: boolean; longTasks: Array<{ duration: number; startTime: number }> } }).__v14Perf
    return {
      observerSupported: state?.supported ?? false,
      longTasksDuringMotion: state?.longTasks.filter((task) => task.startTime >= motionStart && task.duration > 50) ?? [],
      decodedBackgroundLayers: Number(document.querySelector('.app-background')?.getAttribute('data-background-layer-count') ?? 0),
    }
  }, start)
  expect(result.decodedBackgroundLayers).toBeLessThanOrEqual(2)
  expect(result.longTasksDuringMotion).toHaveLength(0)
})
