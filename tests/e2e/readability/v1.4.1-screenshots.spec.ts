import { test } from '@playwright/test'
import {
  completeOnboarding,
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
