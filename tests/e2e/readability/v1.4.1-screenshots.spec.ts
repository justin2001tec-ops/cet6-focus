import { test } from '@playwright/test'
import {
  completeOnboarding,
  openContext,
  openDetail,
  openMeaning,
  openStudy,
  prepareReadabilityPage,
  seedReadabilityWord,
  writeSettings,
} from './fixtures'

const screenshotRoot = 'audit/v1.4.1-readability/screenshots'

test('capture v1.4.1 readability review matrix', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Screenshots are captured once from Chromium; WebKit is validated separately.')
  test.setTimeout(120_000)
  await prepareReadabilityPage(page)
  await completeOnboarding(page)
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

  async function save(name: string, viewport: { width: number; height: number }, stage: 'context' | 'meaning' | 'detail', settings: Record<string, unknown> = {}) {
    await page.setViewportSize(viewport)
    await writeSettings(page, { theme: 'light', backgroundMode: 'fixed', backgroundId: 'plateau-kiang-01', dailyNewWords: 1, ...settings })
    if (stage === 'detail') await openDetail(page)
    else if (stage === 'meaning') await openMeaning(page)
    else {
      await openStudy(page)
      await page.getByRole('button', { name: /^不认识/ }).click()
    }
    await page.waitForTimeout(120)
    await page.screenshot({ path: `${screenshotRoot}/${name}.png`, fullPage: true })
  }

  await save('meaning-light-bright-bg-390', { width: 390, height: 844 }, 'meaning', { theme: 'light', backgroundId: 'plateau-kiang-01' })
  await save('meaning-light-dark-bg-390', { width: 390, height: 844 }, 'meaning', { theme: 'light', backgroundId: 'stars-02' })
  await save('meaning-dark-bright-bg-390', { width: 390, height: 844 }, 'meaning', { theme: 'dark', backgroundId: 'plateau-kiang-01' })
  await save('meaning-dark-dark-bg-390', { width: 390, height: 844 }, 'meaning', { theme: 'dark', backgroundId: 'stars-02' })
  await save('context-light-390', { width: 390, height: 844 }, 'context', { theme: 'light', backgroundId: 'waterfall-02' })
  await save('detail-light-390', { width: 390, height: 844 }, 'detail', { theme: 'light', backgroundId: 'waterfall-02' })
  await save('detail-dark-390', { width: 390, height: 844 }, 'detail', { theme: 'dark', backgroundId: 'stars-02' })
  await save('meaning-430', { width: 430, height: 932 }, 'meaning', { theme: 'light', backgroundId: 'plateau-kiang-01' })
  await save('detail-ipad', { width: 834, height: 1112 }, 'detail', { theme: 'light', backgroundId: 'waterfall-02' })
  await save('detail-desktop', { width: 1440, height: 900 }, 'detail', { theme: 'light', backgroundId: 'plateau-kiang-01' })

  await page.setViewportSize({ width: 800, height: 900 })
  await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
  await openMeaning(page)
  await page.evaluate(() => { document.documentElement.style.zoom = '2' })
  await page.screenshot({ path: `${screenshotRoot}/meaning-200-zoom.png`, fullPage: true })
  await openDetail(page)
  await page.evaluate(() => { document.documentElement.style.zoom = '2' })
  await page.screenshot({ path: `${screenshotRoot}/detail-200-zoom.png`, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', forcedColors: 'active', reducedMotion: 'reduce' })
  await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
  await openMeaning(page)
  await page.screenshot({ path: `${screenshotRoot}/meaning-high-contrast.png`, fullPage: true })

  await page.emulateMedia({ colorScheme: 'light', forcedColors: 'none', reducedMotion: 'reduce' })
  await seedReadabilityWord(page, 'readabilityfixturelongword')
  await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
  await openMeaning(page)
  await page.screenshot({ path: `${screenshotRoot}/long-word-mobile.png`, fullPage: true })

  await page.setViewportSize({ width: 844, height: 390 })
  await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
  await openDetail(page)
  await page.screenshot({ path: `${screenshotRoot}/landscape-detail.png`, fullPage: true })
})

test('capture R1 visual integrity evidence', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium', 'R1 evidence screenshots are captured once from Chromium; other engines run the assertions.')
  test.setTimeout(120_000)
  await prepareReadabilityPage(page)
  await completeOnboarding(page)
  await seedReadabilityWord(page, 'readabilityfixturelongword', true)
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

  async function captureStage(name: string, stage: 'recall' | 'context' | 'meaning' | 'detail', backgroundId: string, theme: 'light' | 'dark' = 'light') {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await writeSettings(page, { theme, backgroundMode: 'fixed', backgroundId, dailyNewWords: 1 })
    if (stage === 'recall') await openStudy(page)
    else if (stage === 'context') await openContext(page)
    else if (stage === 'meaning') await openMeaning(page)
    else await openDetail(page)
    await page.waitForTimeout(120)
    await page.screenshot({ path: `${screenshotRoot}/${name}.png`, fullPage: true })
  }

  await captureStage('recall-background-bright-390', 'recall', 'plateau-kiang-01')
  await captureStage('context-background-bright-390', 'context', 'waterfall-02')
  await captureStage('meaning-background-bright-390', 'meaning', 'plateau-kiang-01')
  await captureStage('detail-background-bright-390', 'detail', 'plateau-kiang-01')
  await captureStage('recall-background-dark-390', 'recall', 'stars-02', 'dark')
  await captureStage('meaning-background-dark-390', 'meaning', 'stars-02', 'dark')
  await captureStage('detail-background-dark-390', 'detail', 'stars-02', 'dark')
  await captureStage('context-background-textured-390', 'context', 'waterfall-02')

  await page.setViewportSize({ width: 844, height: 390 })
  await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
  await openDetail(page)
  await page.evaluate(() => {
    const inner = document.querySelector('.learning-shell__inner') as HTMLElement | null
    if (!inner) throw new Error('Safe Area screenshot target missing')
    const wrapper = document.createElement('div')
    wrapper.dataset.r1SafeAreaFixture = 'true'
    wrapper.style.boxSizing = 'border-box'
    wrapper.style.display = 'flex'
    wrapper.style.flexDirection = 'column'
    wrapper.style.width = '100%'
    wrapper.style.paddingLeft = '44px'
    wrapper.style.paddingRight = '16px'
    while (inner.firstChild) wrapper.append(inner.firstChild)
    inner.append(wrapper)
  })
  await page.screenshot({ path: `${screenshotRoot}/landscape-safe-area-left.png`, fullPage: true })
  await openDetail(page)
  await page.evaluate(() => {
    const inner = document.querySelector('.learning-shell__inner') as HTMLElement | null
    if (!inner) throw new Error('Safe Area screenshot target missing')
    const previous = inner.querySelector('[data-r1-safe-area-fixture]')
    if (previous) {
      while (previous.firstChild) inner.append(previous.firstChild)
      previous.remove()
    }
    const wrapper = document.createElement('div')
    wrapper.dataset.r1SafeAreaFixture = 'true'
    wrapper.style.boxSizing = 'border-box'
    wrapper.style.display = 'flex'
    wrapper.style.flexDirection = 'column'
    wrapper.style.width = '100%'
    wrapper.style.paddingLeft = '16px'
    wrapper.style.paddingRight = '44px'
    while (inner.firstChild) wrapper.append(inner.firstChild)
    inner.append(wrapper)
  })
  await page.screenshot({ path: `${screenshotRoot}/landscape-safe-area-right.png`, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'light', forcedColors: 'none', reducedMotion: 'reduce', contrast: 'more' } as Parameters<typeof page.emulateMedia>[0])
  if (await page.evaluate(() => window.matchMedia('(prefers-contrast: more)').matches)) {
    await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
    await openMeaning(page)
    await page.screenshot({ path: `${screenshotRoot}/prefers-contrast-more.png`, fullPage: true })
  }
})
