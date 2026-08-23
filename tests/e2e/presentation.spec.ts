import { expect, test, type Page } from '@playwright/test'

async function preparePage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const resetKey = 'cet6-focus:presentation-reset'
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
  await expect(page.getByRole('button', { name: /开始今日学习/ })).toBeVisible({ timeout: 15_000 })
}

async function gotoRoute(page: Page, route: string): Promise<void> {
  await page.goto(`/#${route}`, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.mobile-topbar__title')).toBeVisible({ timeout: 15_000 })
}

test('Mobile Vocabulary presents Word Detail as a dismissible bottom sheet', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The mobile sheet presentation is covered by the mobile project.')
  await preparePage(page)
  await completeOnboarding(page)
  await gotoRoute(page, '/words')

  const row = page.locator('.word-row').first()
  await expect(row).toBeVisible({ timeout: 15_000 })
  const word = (await row.locator('.word-row__word strong').textContent())?.trim()
  expect(word).toBeTruthy()
  await row.click()

  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText(word!)
  await expect(page).toHaveURL(/#\/words$/)
  await expect(page.locator('.bottom-sheet__grabber')).toBeVisible()
  await expect(sheet.getByRole('button', { name: '进入学习' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden')

  await page.getByRole('button', { name: '关闭词条详情' }).last().click()
  await expect(sheet).toBeHidden()
  await expect(row).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.activeElement?.classList.contains('word-row'))).toBe(true)
})

test('Mobile route titles and primary tabs follow the presentation map', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The mobile navigation presentation is covered by the mobile project.')
  await preparePage(page)
  await completeOnboarding(page)
  await gotoRoute(page, '/words')
  const wordHref = await page.locator('.word-row').first().getAttribute('href')
  const wordRoute = wordHref?.replace(/^#/, '')
  expect(wordRoute).toMatch(/^\/word\//)

  const routes = [
    ['/', '今日', '今日'],
    ['/today', '今日学习', '今日'],
    ['/learn', '学习', '学习'],
    ['/study', '学习', '学习'],
    ['/review', '复习', '学习'],
    ['/dictation', '听写', '学习'],
    ['/mistakes', '薄弱词', '学习'],
    ['/mistakes/study', '薄弱词', '学习'],
    ['/words', '词库', '词库'],
    [wordRoute!, '词库', '词库'],
    [`/words/${wordRoute!.split('/').at(-1)}`, '词库', '词库'],
    ['/stats', '统计', '更多'],
    ['/settings', '设置', '更多'],
    ['/more', '更多', '更多'],
  ] as const

  for (const [route, title, tab] of routes) {
    await gotoRoute(page, route)
    await expect(page.locator('.mobile-topbar__title')).toHaveText(title)
    await expect(page.locator('.mobile-nav__item.is-active')).toContainText(tab)
  }
})

test('Mobile edge-to-edge layouts stay inside the viewport at required sizes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Responsive sizes are covered by the mobile project.')
  await preparePage(page)
  await completeOnboarding(page)

  for (const viewport of [{ width: 375, height: 812 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
    await page.setViewportSize(viewport)
    await gotoRoute(page, '/')
    const metrics = await page.evaluate(() => {
      const topbar = document.querySelector('.mobile-topbar')?.getBoundingClientRect()
      const nav = document.querySelector('.mobile-nav')?.getBoundingClientRect()
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        topbarLeft: topbar?.left ?? 0,
        topbarRight: topbar?.right ?? 0,
        navBottom: nav?.bottom ?? 0,
      }
    })
    expect(metrics.scrollWidth - metrics.innerWidth).toBeLessThanOrEqual(1)
    expect(metrics.topbarLeft).toBeGreaterThanOrEqual(0)
    expect(metrics.topbarRight).toBeLessThanOrEqual(metrics.innerWidth + 1)
    expect(metrics.navBottom).toBeLessThanOrEqual(metrics.innerHeight + 1)
  }
})
