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

test('v1.6 R1 Study controls use one material family while Meaning stays semantic', async ({ page }, testInfo) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await openFixtureMeaning(page, testInfo.project.name)

  const surfaceMetrics = await page.evaluate(() => {
    const reading = document.querySelector('.learning-reading-surface')
    const audio = document.querySelector('.glass-audio-control')
    const bookmark = document.querySelector('.learning-word-header__actions .glass-icon-button')
    const primary = document.querySelector('.tinted-glass-primary')
    const stage = document.querySelector('.learning-stage--meaning')
    const rootStyle = getComputedStyle(document.documentElement)
    const readingStyle = reading ? getComputedStyle(reading) : null
    const primaryStyle = primary ? getComputedStyle(primary) : null
    const audioStyle = audio ? getComputedStyle(audio) : null
    const iconGeometry = [...document.querySelectorAll('.learning-shell .glass-icon-button')].map((element) => {
      const rect = element.getBoundingClientRect()
      return { borderRadius: getComputedStyle(element).borderRadius, square: Math.abs(rect.width - rect.height) <= 1 }
    })
    return {
      readingBackdrop: readingStyle?.backdropFilter ?? '',
      readingWebkitBackdrop: readingStyle?.webkitBackdropFilter ?? '',
      readingPointerLight: reading?.style.getPropertyValue('--glass-light-x') ?? '',
      readingLayer: reading?.getAttribute('data-content-layer') ?? '',
      readingGlassVariant: reading?.getAttribute('data-glass-variant') ?? '',
      audioVariant: audio?.getAttribute('data-glass-variant') ?? '',
      bookmarkVariant: bookmark?.getAttribute('data-glass-variant') ?? '',
      primaryVariant: primary?.getAttribute('data-glass-variant') ?? '',
      primaryInteractive: primary?.getAttribute('data-glass-interactive') ?? '',
      primaryFill: primaryStyle?.getPropertyValue('--glass-fill').trim() ?? '',
      audioFill: audioStyle?.getPropertyValue('--glass-fill').trim() ?? '',
      iconGeometry,
      stageAnimation: stage ? getComputedStyle(stage).animationName : '',
      stageTransform: stage ? getComputedStyle(stage).transform : '',
      readingRadius: rootStyle.getPropertyValue('--radius-reading').trim(),
      primaryRadius: primaryStyle?.borderRadius ?? '',
    }
  })

  expect(surfaceMetrics.audioVariant).toBe('regular')
  expect(surfaceMetrics.bookmarkVariant).toBe('regular')
  expect(surfaceMetrics.primaryVariant).toBe('regular')
  expect(surfaceMetrics.primaryInteractive).toBe('true')
  expect(surfaceMetrics.readingLayer).toBe('reading')
  expect(surfaceMetrics.readingGlassVariant).toBe('')
  expect(['', 'none']).toContain(surfaceMetrics.readingBackdrop)
  expect(['', 'none']).toContain(surfaceMetrics.readingWebkitBackdrop)
  expect(surfaceMetrics.readingPointerLight).toBe('')
  expect(surfaceMetrics.primaryFill).not.toBe(surfaceMetrics.audioFill)
  expect(surfaceMetrics.iconGeometry.length).toBeGreaterThanOrEqual(3)
  expect(surfaceMetrics.iconGeometry.every(({ borderRadius, square }) => square && borderRadius.includes('50%'))).toBe(true)
  expect(['', 'none']).toContain(surfaceMetrics.stageAnimation)
  expect(['', 'none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(surfaceMetrics.stageTransform)
  expect(surfaceMetrics.readingRadius).toBeTruthy()
  expect(surfaceMetrics.primaryRadius).toBeTruthy()

  const audio = page.getByRole('button', { name: '播放发音' })
  await audio.dispatchEvent('pointermove', { pointerType: 'mouse', clientX: 14, clientY: 12, bubbles: true })
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
  await expect(audio).toHaveAttribute('data-glass-pointer', 'active')
  await expect(audio).toHaveAttribute('data-glass-input-profile', 'mouse')
  await expect(audio).toHaveCSS('--glass-input-intensity', '.55')
  const mousePointerX = await audio.evaluate((node) => node.style.getPropertyValue('--glass-light-x'))
  expect(mousePointerX).not.toBe('50%')

  await audio.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 35, clientY: 20, bubbles: true })
  await expect(audio).toHaveAttribute('data-press-state', 'pressed')
  await expect(audio).toHaveAttribute('data-glass-input-profile', 'touch')
  await expect(audio).toHaveCSS('--glass-input-intensity', '1')
  const touchOrigin = await audio.evaluate((node) => node.style.getPropertyValue('--glass-light-x'))
  await audio.dispatchEvent('pointermove', { pointerType: 'touch', clientX: 5, clientY: 5, bubbles: true })
  await expect(audio).toHaveAttribute('data-glass-input-profile', 'touch')
  expect(await audio.evaluate((node) => node.style.getPropertyValue('--glass-light-x'))).toBe(touchOrigin)
  await audio.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 35, clientY: 20, bubbles: true })
  await expect(audio).toHaveAttribute('data-press-state', 'idle')

  const meaning = page.locator('.learning-stage--meaning')
  await expect(meaning.getByRole('button', { name: '更多' })).toHaveCount(0)
  await expect(page.locator('.study-overflow-menu')).toHaveCount(0)
  const meaningDock = meaning.locator('.bottom-action-dock')
  await expect(meaningDock).toHaveAttribute('data-scroll-edge', 'conditional')
  await expect(meaningDock).toHaveAttribute('data-scroll-overlap', 'false')
  await expect(meaning.getByRole('button', { name: '扩展理解' })).toBeVisible()

  await page.getByRole('button', { name: '学习操作帮助' }).click()
  const help = page.getByRole('dialog', { name: '保持学习节奏' })
  await expect(help).toContainText('触控、鼠标和键盘都可以完成全部学习操作。')
  await expect(help).toContainText('点击 / 轻触')
  await expect(help.getByRole('button', { name: '关闭学习操作帮助' })).toBeVisible()
  await help.getByRole('button', { name: '关闭学习操作帮助' }).click()

  await meaning.getByRole('button', { name: '扩展理解' }).click()
  await expect(page.getByRole('region', { name: '扩展理解' })).toBeVisible()

  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0)
  expect(pageErrors, pageErrors.join('\n')).toHaveLength(0)
})

test('v1.6 R1 Study Meaning captures the scene, input, and accessibility matrix', async ({ page }, testInfo) => {
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
    await expect(page.locator('.app-background')).toHaveAttribute('data-background-transition', 'settled', { timeout: 5_000 })
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
  await expect(page.locator('.learning-stage--meaning .learning-stage-actions__expand')).toBeVisible()
  await page.screenshot({ path: `${auditScreenshots}/after-direct-expand-390.png`, fullPage: true })
  await page.getByRole('button', { name: '标记重点' }).click()
  await expect(page.getByRole('button', { name: '取消重点标记' })).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({ path: `${auditScreenshots}/after-bookmark-selected-390.png`, fullPage: true })
  await page.screenshot({ path: `${auditScreenshots}/after-scroll-edge-inactive-390.png`, fullPage: true })

  await capture('after-continue-390', { theme: 'light', backgroundMode: 'off' }, { width: 390, height: 844 })
  await capture('after-meaning-landscape-844', { theme: 'light', backgroundMode: 'off' }, { width: 844, height: 390 })
  await capture('after-meaning-ipad-1112', { theme: 'light', backgroundMode: 'off' }, { width: 1112, height: 834 })
  await capture('after-meaning-desktop-1440', { theme: 'light', backgroundMode: 'fixed', backgroundId: 'aurora-01' }, { width: 1440, height: 900 })
  await capture('after-meaning-desktop-1920', { theme: 'light', backgroundMode: 'fixed', backgroundId: 'aurora-01' }, { width: 1920, height: 1080 })
  await capture('after-meaning-reduced-motion-390', { theme: 'light', backgroundMode: 'off', reducedMotion: true }, { width: 390, height: 844 }, { reducedMotion: true })
  await capture('after-meaning-high-contrast-390', { theme: 'light', backgroundMode: 'off' }, { width: 390, height: 844 }, { contrast: 'more' })

  await page.setViewportSize({ width: 1112, height: 834 })
  await page.emulateMedia({ reducedMotion: 'no-preference', contrast: 'no-preference' })
  await seedReadabilityWord(page, 'readabilityfixturelongword', true)
  await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
  await openMeaning(page)
  await page.getByRole('button', { name: '扩展理解' }).click()
  const detail = page.getByRole('region', { name: '扩展理解' })
  await expect(detail).toBeVisible()
  await page.evaluate(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: Math.max(0, maxScroll - 120), behavior: 'auto' })
  })
  await expect.poll(async () => detail.locator('.bottom-action-dock').getAttribute('data-scroll-overlap'), { timeout: 5_000 }).toBe('true')
  await page.screenshot({ path: `${auditScreenshots}/after-scroll-edge-active-1112.png`, fullPage: true })
})
