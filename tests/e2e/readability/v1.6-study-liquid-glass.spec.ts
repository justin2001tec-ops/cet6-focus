import { mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import {
  bootReadability,
  openMeaning,
  prepareReadabilityPage,
  seedReadabilityWord,
  writeSettings,
} from './fixtures'

const auditScreenshots = 'audit/v1.6-study-liquid-glass/screenshots'

async function openFixtureMeaning(page: Parameters<typeof openMeaning>[0], projectName: string, word = 'readabilityfixturelongword', settings: Record<string, unknown> = {}) {
  await prepareReadabilityPage(page)
  await bootReadability(page, projectName)
  await seedReadabilityWord(page, word)
  await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1, ...settings })
  await openMeaning(page)
}

test('v1.6 Study Meaning keeps Glass functional and the reading surface stable', async ({ page }, testInfo) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await openFixtureMeaning(page, testInfo.project.name)

  const surfaceMetrics = await page.evaluate(() => {
    const reading = document.querySelector('.learning-reading-surface')
    const audio = document.querySelector('.glass-audio-control')
    const primary = document.querySelector('.tinted-glass-primary')
    const rootStyle = getComputedStyle(document.documentElement)
    const readingStyle = reading ? getComputedStyle(reading) : null
    const primaryStyle = primary ? getComputedStyle(primary) : null
    return {
      readingBackdrop: readingStyle?.backdropFilter ?? '',
      readingWebkitBackdrop: readingStyle?.webkitBackdropFilter ?? '',
      readingPointerLight: reading?.style.getPropertyValue('--glass-light-x') ?? '',
      readingLayer: reading?.getAttribute('data-content-layer') ?? '',
      audioVariant: audio?.getAttribute('data-glass-variant') ?? '',
      primaryVariant: primary?.getAttribute('data-glass-variant') ?? '',
      primaryInteractive: primary?.getAttribute('data-glass-interactive') ?? '',
      readingRadius: rootStyle.getPropertyValue('--radius-reading').trim(),
      primaryRadius: primaryStyle?.borderRadius ?? '',
    }
  })

  expect(surfaceMetrics.audioVariant).toBe('clear')
  expect(surfaceMetrics.primaryVariant).toBe('regular')
  expect(surfaceMetrics.primaryInteractive).toBe('true')
  expect(surfaceMetrics.readingLayer).toBe('reading')
  expect(['', 'none']).toContain(surfaceMetrics.readingBackdrop)
  expect(['', 'none']).toContain(surfaceMetrics.readingWebkitBackdrop)
  expect(surfaceMetrics.readingPointerLight).toBe('')
  expect(surfaceMetrics.readingRadius).toBeTruthy()
  expect(surfaceMetrics.primaryRadius).toBeTruthy()

  const audio = page.getByRole('button', { name: '播放发音' })
  await audio.dispatchEvent('pointermove', { clientX: 14, clientY: 12, bubbles: true })
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
  await expect(audio).toHaveAttribute('data-glass-pointer', 'active')
  const pointerX = await audio.evaluate((node) => node.style.getPropertyValue('--glass-light-x'))
  expect(pointerX).not.toBe('50%')
  await audio.dispatchEvent('pointerdown', { clientX: 14, clientY: 12, bubbles: true })
  await expect(audio).toHaveAttribute('data-press-state', 'pressed')
  await audio.dispatchEvent('pointerup', { clientX: 14, clientY: 12, bubbles: true })
  await expect(audio).toHaveAttribute('data-press-state', 'idle')

  const more = page.getByRole('button', { name: '更多' })
  await more.click()
  const menu = page.getByRole('menu', { name: '更多学习操作' })
  await expect(menu).toBeVisible()
  await expect(menu).toHaveAttribute('data-more-morph', 'flip')
  await expect(menu).toHaveAttribute('data-popover-phase', 'settled')
  await expect(more).toHaveAttribute('aria-expanded', 'true')
  await expect(menu.locator('.glass-surface')).toHaveCount(0)
  await expect(menu.locator('[role="menuitem"]')).toBeVisible()
  await page.getByRole('menuitem', { name: /扩展理解/ }).click()
  await expect(page.getByRole('region', { name: '扩展理解' })).toBeVisible()

  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0)
  expect(pageErrors, pageErrors.join('\n')).toHaveLength(0)
})

test('v1.6 Study Meaning captures the required scene and accessibility evidence', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium scene capture is the audit source of truth')
  await mkdir(auditScreenshots, { recursive: true })
  let fixtureBooted = false

  async function openCaptureMeaning(settings: Record<string, unknown>) {
    if (!fixtureBooted) {
      await openFixtureMeaning(page, testInfo.project.name, 'readabilityfixturelongword', settings)
      fixtureBooted = true
      return
    }
    await seedReadabilityWord(page, 'readabilityfixturelongword')
    await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1, ...settings })
    await openMeaning(page)
  }

  async function capture(name: string, settings: Record<string, unknown>, viewport: { width: number; height: number }, media?: { reducedMotion?: boolean; contrast?: 'more' }) {
    await page.setViewportSize(viewport)
    await page.emulateMedia({
      reducedMotion: media?.reducedMotion ? 'reduce' : 'no-preference',
      contrast: media?.contrast ?? 'no-preference',
    })
    await openCaptureMeaning(settings)
    await page.waitForTimeout(120)
    await expect(page.getByRole('region', { name: '核心词义' })).toBeVisible()
    await page.screenshot({ path: `${auditScreenshots}/${name}.png`, fullPage: true })
  }

  await capture('after-meaning-bright-390', { theme: 'light', backgroundMode: 'fixed', backgroundId: 'plateau-kiang-01' }, { width: 390, height: 844 })
  await capture('after-meaning-dark-390', { theme: 'dark', backgroundMode: 'fixed', backgroundId: 'stars-02' }, { width: 390, height: 844 })
  await capture('after-meaning-textured-390', { theme: 'light', backgroundMode: 'fixed', backgroundId: 'aurora-01' }, { width: 390, height: 844 })
  await capture('after-meaning-medium-390', { theme: 'light', backgroundMode: 'fixed', backgroundId: 'waterfall-02' }, { width: 390, height: 844 })
  await capture('after-meaning-430', { theme: 'light', backgroundMode: 'off' }, { width: 430, height: 932 })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'no-preference', contrast: 'no-preference' })
  await openCaptureMeaning({ theme: 'light', backgroundMode: 'off' })
  await page.getByRole('button', { name: '更多' }).click()
  await expect(page.getByRole('menu', { name: '更多学习操作' })).toBeVisible()
  await page.screenshot({ path: `${auditScreenshots}/after-more-open-390.png`, fullPage: true })
  await page.getByRole('menuitem', { name: /扩展理解/ }).click()

  await capture('after-continue-390', { theme: 'light', backgroundMode: 'off' }, { width: 390, height: 844 })
  await capture('after-meaning-landscape-844', { theme: 'light', backgroundMode: 'off' }, { width: 844, height: 390 })
  await capture('after-meaning-ipad-1112', { theme: 'light', backgroundMode: 'off' }, { width: 1112, height: 834 })
  await capture('after-meaning-desktop-1440', { theme: 'light', backgroundMode: 'fixed', backgroundId: 'aurora-01' }, { width: 1440, height: 900 })
  await capture('after-meaning-desktop-1920', { theme: 'light', backgroundMode: 'fixed', backgroundId: 'aurora-01' }, { width: 1920, height: 1080 })
  await capture('after-meaning-reduced-motion-390', { theme: 'light', backgroundMode: 'off', reducedMotion: true }, { width: 390, height: 844 }, { reducedMotion: true })
  await capture('after-meaning-high-contrast-390', { theme: 'light', backgroundMode: 'off' }, { width: 390, height: 844 }, { contrast: 'more' })
})
