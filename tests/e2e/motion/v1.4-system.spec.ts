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
  await page.route('**/src/main.tsx*', (route) => route.abort())
  try {
    await page.goto('/?motion-seed=1', { waitUntil: 'domcontentloaded' })
    const words = await page.evaluate(async () => {
      const entryScript = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')).find((script) => script.src.includes('/src/main.tsx'))
      const vocabularyUrl = new URL(entryScript?.src ?? '/src/main.tsx', document.baseURI)
      vocabularyUrl.pathname = vocabularyUrl.pathname.replace(/\/src\/main\.tsx.*$/, '/data/cet6-vocab.v1.json')
      vocabularyUrl.search = ''
      const response = await fetch(vocabularyUrl, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Warm vocabulary fetch failed: ${response.status}`)
      return ((await response.json()) as Array<Record<string, unknown>>).slice(0, 8)
    })
    await page.evaluate(async (seedWords: Array<Record<string, unknown>>) => {
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
        for (const word of seedWords) {
          wordsStore.put({ ...word, archived: false })
          cardsStore.put(card(String(word.id)))
        }
        transaction.objectStore('settings').put({ id: 'app', theme: 'light', reducedMotion: false, backgroundMode: 'fixed', backgroundId: 'aurora-01', lastBackgroundId: 'aurora-01', dailyNewWords: 1, dailyMinutes: 30, targetRetention: 0.9, pronunciation: 'en-US', autoplayPronunciation: false, onboarded: true, dataVersion: 'cet6-vocab.v1', updatedAt: now })
        transaction.oncomplete = () => { database.close(); resolve() }
        transaction.onerror = () => reject(transaction.error ?? new Error('Warm database seed failed'))
      }
      })
    }, words)
  } finally {
    await page.unroute('**/src/main.tsx*')
  }
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

async function advanceStudyToNextRecall(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await page.locator('.learning-shell--recall').isVisible().catch(() => false)) return
    const advanced = await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>('.learning-stage-actions button.button--primary')
      if (!button || button.disabled) return false
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
      return true
    })
    if (!advanced) await page.waitForTimeout(80)
  }
  await expect(page.locator('.learning-shell--recall')).toBeVisible({ timeout: 5_000 })
}

async function readMotionReviewLogs(page: Page): Promise<Array<{ wordId: string; rating: number }>> {
  return page.evaluate(() => new Promise<Array<{ wordId: string; rating: number }>>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('Review log read failed'))
    request.onsuccess = () => {
      const transaction = request.result.transaction('reviewLogs', 'readonly')
      const read = transaction.objectStore('reviewLogs').getAll()
      read.onsuccess = () => resolve((read.result as Array<{ wordId: string; rating: number }>).map(({ wordId, rating }) => ({ wordId, rating })))
      read.onerror = () => reject(read.error ?? new Error('Review log read failed'))
    }
  }))
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
  expect(['', 'none']).toContain(routeState.transform)
})

test('App reduced-motion setting drives MotionConfig and CSS as one effective profile', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await preparePage(page)
  await bootForMotion(page, testInfo.project.name)
  await page.goto('/#/settings', { waitUntil: 'domcontentloaded' })
  const reducedMotionToggle = page.locator('label.toggle-row').filter({ hasText: '减少动效' }).locator('input[type="checkbox"]')
  await expect(reducedMotionToggle).toBeVisible()
  await reducedMotionToggle.click({ force: true })
  await expect(reducedMotionToggle).toBeChecked()
  await expect(page.locator('html')).toHaveAttribute('data-motion-profile', 'reduced')
  await expect(page.locator('html')).toHaveAttribute('data-motion-config-reduced', 'true')
  await reducedMotionToggle.click({ force: true })
  await expect(reducedMotionToggle).not.toBeChecked()
  await expect(page.locator('html')).toHaveAttribute('data-motion-profile', 'full')
  await expect(page.locator('html')).toHaveAttribute('data-motion-config-reduced', 'false')
})

test('Vocabulary to Word Detail uses one real shared identity and has a reduced fallback', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Mobile vocabulary uses the PhysicalSheet presentation.')
  await preparePage(page)
  await bootForMotion(page, testInfo.project.name)
  await page.goto('/#/words', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.word-row').first()).toBeVisible({ timeout: 15_000 })

  await page.evaluate(() => {
    const phases: string[] = []
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes' && record.attributeName === 'data-motion-phase') {
          const value = (record.target as HTMLElement).dataset.motionPhase
          if (value) phases.push(value)
        }
      }
    })
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-motion-phase'] })
    ;(window as Window & { __r1SharedObserver?: MutationObserver; __r1SharedPhases?: string[] }).__r1SharedObserver = observer
    ;(window as Window & { __r1SharedObserver?: MutationObserver; __r1SharedPhases?: string[] }).__r1SharedPhases = phases
  })

  const source = page.locator('.word-row').first().locator('[data-shared-id]')
  const sharedId = await source.getAttribute('data-shared-id')
  const sourceText = (await source.textContent())?.trim() ?? ''
  expect(sharedId).toBeTruthy()
  await page.locator('.word-row').first().click()
  const destination = page.locator('.page--word-detail [data-shared-id]')
  await expect(destination).toBeVisible({ timeout: 15_000 })
  await expect(destination).toHaveAttribute('data-shared-id', sharedId!)
  await expect(destination).toHaveAttribute('data-shared-layout', 'enabled')
  await expect(destination).toContainText(sourceText)
  await expect.poll(
    async () => page.evaluate(() => (window as Window & { __r1SharedPhases?: string[] }).__r1SharedPhases ?? []),
    { timeout: 5_000 },
  ).toContain('active')
  const sharedEvidence = await page.evaluate(() => {
    const state = window as Window & { __r1SharedObserver?: MutationObserver; __r1SharedPhases?: string[] }
    state.__r1SharedObserver?.disconnect()
    return { phases: state.__r1SharedPhases ?? [], transform: window.getComputedStyle(document.querySelector('[data-shared-id]') as Element).transform }
  })
  expect(sharedEvidence.phases).toContain('active')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/words', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.word-row').first()).toBeVisible({ timeout: 15_000 })
  const reducedSource = page.locator('.word-row').first().locator('[data-shared-id]')
  const reducedId = await reducedSource.getAttribute('data-shared-id')
  await reducedSource.click()
  const reducedDestination = page.locator('.page--word-detail [data-shared-id]')
  await expect(reducedDestination).toBeVisible({ timeout: 15_000 })
  await expect(reducedDestination).toHaveAttribute('data-shared-id', reducedId!)
  await expect(reducedDestination).toHaveAttribute('data-shared-layout', 'reduced')
  const reducedTransform = await reducedDestination.evaluate((element) => window.getComputedStyle(element).transform)
  expect(['', 'none']).toContain(reducedTransform)
})

test('Home Learn and Review use the bounded press primitive and rapid hash intent settles once', async ({ page }, testInfo) => {
  await preparePage(page)
  await bootForMotion(page, testInfo.project.name)
  const learn = page.locator('.immersive-home__task-card--learn')
  const review = page.locator('.immersive-home__task-card--review')
  await expect(learn).toHaveClass(/apple-pressable-link/)
  await expect(review).toHaveClass(/apple-pressable-link/)
  await expect(learn).toHaveAttribute('data-motion-pressable', 'true')
  const fineScale = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--system-press-scale').trim())
  expect(fineScale).toBe('.99')
  const box = await learn.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(30)
  const pressTransform = await learn.evaluate((element) => getComputedStyle(element).transform)
  expect(['', 'none']).not.toContain(pressTransform)
  await page.mouse.up()

  await page.evaluate(() => {
    window.location.hash = '#/words'
    window.location.hash = '#/learn'
    window.location.hash = '#/'
  })
  await expect(page.locator('.page--immersive-home')).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('.motion-route')).toHaveCount(1)
  await expect(page.locator('.learning-shell')).toHaveCount(0)
})

test('Background double buffer handles rapid retargeting and settles to one active layer', async ({ page }, testInfo) => {
  await preparePage(page)
  await bootForMotion(page, testInfo.project.name)
  await page.goto('/#/settings', { waitUntil: 'domcontentloaded' })
  const backgroundSelects = page.locator('.background-options select')
  await backgroundSelects.first().selectOption('fixed')
  await expect(page.locator('.background-options select')).toHaveCount(2)
  const backgroundIds = await page.locator('.background-options select').nth(1).locator('option').evaluateAll((options) => options.map((option) => option.getAttribute('value')).filter((value): value is string => Boolean(value)))
  expect(backgroundIds.length).toBeGreaterThan(2)
  const firstTarget = backgroundIds[1]
  const secondTarget = backgroundIds[2]
  await page.locator('.background-options select').nth(1).selectOption(firstTarget)
  await page.locator('.background-options select').nth(1).selectOption(secondTarget)
  await page.goto('/#/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.immersive-home__featured-word')).toBeVisible({ timeout: 15_000 })
  const layerSamples = await page.evaluate(async () => {
    const samples: number[] = []
    for (let index = 0; index < 36; index += 1) {
      samples.push(Number(document.querySelector('.app-background')?.getAttribute('data-background-layer-count') ?? 0))
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
    }
    return samples
  })
  expect(Math.max(...layerSamples)).toBeLessThanOrEqual(2)
  await expect(page.locator('.app-background')).toHaveAttribute('data-background-active-id', secondTarget, { timeout: 5_000 })
  await expect(page.locator('.app-background')).toHaveAttribute('data-background-layer-count', '1', { timeout: 5_000 })
  await expect(page.locator('.app-background')).toHaveAttribute('data-background-transition', 'settled', { timeout: 5_000 })
})

test('Study fast ratings and Undo during transition keep one queue and exact ReviewLog parity', async ({ page }, testInfo) => {
  await preparePage(page)
  await bootForMotion(page, testInfo.project.name)
  await page.goto('/#/settings', { waitUntil: 'domcontentloaded' })
  const dailyNewWords = page.locator('label.field-label').filter({ hasText: '每日新词' }).locator('select')
  await expect(dailyNewWords).toBeVisible({ timeout: 15_000 })
  await dailyNewWords.selectOption('20')
  await page.goto('/#/study', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.learning-shell--recall')).toBeVisible({ timeout: 15_000 })

  const firstWord = (await page.locator('.learning-word-header h1').textContent())?.trim() ?? ''
  await page.getByRole('button', { name: '认识', exact: true }).click()
  await advanceStudyToNextRecall(page)
  await expect(page.locator('.learning-undo')).toBeVisible()
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(page.locator('.learning-shell--recall')).toBeVisible({ timeout: 5_000 })
  await expect(page.locator('.learning-word-header h1')).toHaveText(firstWord)
  await expect.poll(async () => (await readMotionReviewLogs(page)).length).toBe(0)

  const choices = ['认识', '模糊', '不认识'] as const
  const ratedWords: string[] = []
  for (const choice of choices) {
    await expect(page.locator('.learning-shell--recall')).toBeVisible()
    ratedWords.push((await page.locator('.learning-word-header h1').textContent())?.trim() ?? '')
    await page.getByRole('button', { name: choice, exact: true }).click()
    await advanceStudyToNextRecall(page)
  }
  const logsAfterFastRatings = await readMotionReviewLogs(page)
  expect(logsAfterFastRatings).toHaveLength(3)
  expect(new Set(logsAfterFastRatings.map((log) => log.wordId)).size).toBe(3)
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await expect(page.locator('.learning-shell--recall')).toBeVisible({ timeout: 5_000 })
  await expect(page.locator('.learning-word-header h1')).toHaveText(ratedWords[2])
  await expect.poll(async () => (await readMotionReviewLogs(page)).length).toBe(2)
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
  await page.getByRole('link', { name: '词库' }).click()
  await expect(page).toHaveURL(/#\/words$/)
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

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2 + 42)
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })))
  await page.mouse.up()
  await expect(page.locator('.bottom-sheet')).toHaveAttribute('data-sheet-state', 'idle', { timeout: 2_000 })

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2 + 24)
  await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')))
  await page.mouse.up()
  await expect(page.locator('.bottom-sheet')).toHaveAttribute('data-sheet-state', 'idle', { timeout: 2_000 })

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
  await expect(page.locator('.bottom-sheet')).toHaveAttribute('data-sheet-velocity-handoff', 'active', { timeout: 500 })
  await expect(sheet).toHaveCount(0, { timeout: 2_000 })

  await page.locator('.word-row').first().click()
  await expect(sheet).toBeVisible()
  await expect(page.locator('.bottom-sheet')).toHaveAttribute('data-sheet-state', 'idle', { timeout: 2_000 })
  await page.goBack()
  await expect(sheet).toHaveCount(0, { timeout: 5_000 })
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
