import { expect, test, type Page } from '@playwright/test'

async function preparePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const resetKey = 'cet6-focus:bbdcd-home-reset'
    if (!sessionStorage.getItem(resetKey)) {
      sessionStorage.setItem(resetKey, '1')
      indexedDB.deleteDatabase('cet6-focus')
    }
  })
}

async function completeOnboarding(page: Page): Promise<void> {
  await page.goto('/#/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: '每天打开，都知道下一步做什么。' })).toBeVisible({ timeout: 15_000 })
  for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /开始备考/ }).click()
  await expect(page.locator('.immersive-home__featured-word')).toBeVisible({ timeout: 15_000 })
}

async function setBackground(page: Page, mode: 'random' | 'fixed' | 'off', id?: string): Promise<void> {
  await page.evaluate(({ nextMode, nextId }) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('settings', 'readwrite')
      const store = transaction.objectStore('settings')
      const getRequest = store.get('app')
      getRequest.onerror = () => reject(getRequest.error ?? new Error('Settings read failed'))
      getRequest.onsuccess = () => store.put({ ...getRequest.result, backgroundMode: nextMode, backgroundId: nextId, lastBackgroundId: nextId, updatedAt: new Date().toISOString() })
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Settings write failed'))
    }
  }), { nextMode: mode, nextId: id })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('.immersive-home__featured-word').waitFor({ state: 'visible', timeout: 15_000 })
}

test('BBDCD home removes dashboard chrome and keeps real learning links', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The home contract is covered once in the desktop project.')
  await preparePage(page)
  await completeOnboarding(page)

  await expect(page.locator('.page--immersive-home')).toHaveAttribute('data-scene-id', /.+/)
  await expect(page.locator('.immersive-home__featured-word')).toBeVisible()
  await expect(page.locator('.immersive-home__word-link')).toHaveAttribute('href', /#\/word\//)
  await expect(page.locator('.immersive-home__featured-word')).toHaveCount(1)
  await expect(page.locator('.immersive-home__kicker, .immersive-home__word-meta, .immersive-home__scene-note')).toHaveCount(0)
  await expect(page.locator('.immersive-home__task-card--learn')).toHaveAttribute('href', '#/study')
  await expect(page.locator('.immersive-home__task-card--review')).toHaveAttribute('href', '#/review')
  await expect(page.locator('.immersive-home__task-card--learn > span')).toHaveCount(2)
  await expect(page.locator('.immersive-home__task-card--review > span')).toHaveCount(2)
  await expect(page.locator('.immersive-home__task-icon, .immersive-home__task-copy, .immersive-home__task-arrow')).toHaveCount(0)
  await expect(page.locator('.immersive-home__bottom-nav .immersive-home__nav-item')).toHaveCount(3)
  await expect(page.locator('.immersive-home__bottom-nav svg')).toHaveCount(3)
  await expect(page.locator('.sidebar, .mobile-topbar, .mobile-nav')).toHaveCount(0)
  await expect(page.locator('.dashboard-hero, .dashboard-grid--tasks, .page-header')).toHaveCount(0)

  const navStyle = await page.locator('.immersive-home__bottom-nav').evaluate((element) => {
    const style = window.getComputedStyle(element)
    return { background: style.backgroundColor, border: style.borderTopWidth, backdrop: style.backdropFilter }
  })
  expect(navStyle.background).toBe('rgba(0, 0, 0, 0)')
  expect(navStyle.border).toBe('0px')
  expect(navStyle.backdrop).toBe('none')

  await page.locator('.immersive-home__task-card--learn').click()
  await expect(page.locator('.learning-shell')).toBeVisible({ timeout: 15_000 })
  await page.goto('/#/', { waitUntil: 'domcontentloaded' })
  await page.locator('.immersive-home__task-card--review').click()
  await expect(page).toHaveURL(/#\/review$/)
  await expect(page.locator('.learning-shell, .page')).toBeVisible({ timeout: 15_000 })
})

test('BBDCD fixed and off background modes use local scene assets', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The background mode contract is covered once in the desktop project.')
  await preparePage(page)
  await completeOnboarding(page)

  await setBackground(page, 'fixed', 'aurora-01')
  await expect(page.locator('.page--immersive-home')).toHaveAttribute('data-scene-id', 'aurora-01')
  await expect(page.locator('.app-background img')).toHaveAttribute('src', /backgrounds\/v1\.2\/webp\/aurora-01\.webp$/)

  await setBackground(page, 'off')
  await expect(page.locator('.app-frame')).toHaveClass(/app-frame--plain/)
  await expect(page.locator('.immersive-home--off')).toBeVisible()
  await expect(page.locator('.app-background img')).toHaveCount(0)
})

test('BBDCD home stays inside required viewport sizes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The required sizes are covered once in the desktop project.')
  await preparePage(page)
  await completeOnboarding(page)

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 834, height: 1194 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/#/', { waitUntil: 'domcontentloaded' })
    const metrics = await page.evaluate(() => {
      const nav = document.querySelector('.immersive-home__bottom-nav')?.getBoundingClientRect()
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        navLeft: nav?.left ?? 0,
        navRight: nav?.right ?? 0,
        navBottom: nav?.bottom ?? 0,
      }
    })
    expect(metrics.scrollWidth - metrics.innerWidth).toBeLessThanOrEqual(1)
    expect(metrics.scrollHeight - metrics.innerHeight).toBeLessThanOrEqual(1)
    expect(metrics.navLeft).toBeGreaterThanOrEqual(0)
    expect(metrics.navRight).toBeLessThanOrEqual(metrics.innerWidth + 1)
    expect(metrics.navBottom).toBeLessThanOrEqual(metrics.innerHeight + 1)
  }
})
