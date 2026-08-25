import { expect, test } from '@playwright/test'
import {
  bootReadability,
  openDetail,
  openMeaning,
  openStudy,
  prepareReadabilityPage,
  readLayoutMetrics,
  readSurfaceMetrics,
  readabilityLongWords,
  seedReadabilityWord,
  writeSettings,
} from './fixtures'

test.describe('v1.4.1 Learning Readability & Layout Integrity', () => {
  test('semantic ReadingSurface stays paired and readable across Light, Dark, and System themes', async ({ page }, testInfo) => {
    await prepareReadabilityPage(page)
    await bootReadability(page, testInfo.project.name)

    const matrix = [
      { theme: 'light', colorScheme: 'light', backgroundId: 'plateau-kiang-01' },
      { theme: 'light', colorScheme: 'light', backgroundId: 'stars-02' },
      { theme: 'dark', colorScheme: 'dark', backgroundId: 'plateau-kiang-01' },
      { theme: 'dark', colorScheme: 'dark', backgroundId: 'stars-02' },
      { theme: 'system', colorScheme: 'light', backgroundId: 'waterfall-02' },
      { theme: 'system', colorScheme: 'dark', backgroundId: 'waterfall-02' },
    ] as const

    for (const variant of matrix) {
      await page.emulateMedia({ colorScheme: variant.colorScheme })
      await writeSettings(page, { theme: variant.theme, backgroundMode: 'fixed', backgroundId: variant.backgroundId, dailyNewWords: 1 })
      await openMeaning(page)
      const metrics = await readSurfaceMetrics(page)
      expect(metrics.tone).toBe('learning')
      expect(metrics.readingTokens).toEqual(expect.objectContaining({
        bg: expect.any(String),
        primary: expect.any(String),
        secondary: expect.any(String),
        tertiary: expect.any(String),
        accent: expect.any(String),
        separator: expect.any(String),
        highlightBg: expect.any(String),
        highlightText: expect.any(String),
      }))
      expect(Number(metrics.primaryContrast)).toBeGreaterThanOrEqual(4.5)
      expect(Number(metrics.secondaryContrast)).toBeGreaterThanOrEqual(4.5)
      expect(Number(metrics.accentContrast)).toBeGreaterThanOrEqual(4.5)
      expect(Number(metrics.documentScrollWidth) - Number(metrics.documentClientWidth)).toBeLessThanOrEqual(1)
    }
  })

  test('long-word tiers keep requested words and the fixture inside the viewport', async ({ page }, testInfo) => {
    await prepareReadabilityPage(page)
    await bootReadability(page, testInfo.project.name)
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

    for (const word of readabilityLongWords) {
      await seedReadabilityWord(page, word)
      await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
      await page.setViewportSize({ width: 390, height: 844 })
      await openMeaning(page)
      const metrics = await readLayoutMetrics(page)
      expect(metrics.word).toBe(word)
      expect(String(metrics.headerClass)).toMatch(/learning-word-header--length-(short|medium|long|very-long)/)
      expect(Number(metrics.headingScrollWidth) - Number(metrics.headingClientWidth)).toBeLessThanOrEqual(1)
      expect(Number(metrics.scrollWidth) - Number(metrics.clientWidth)).toBeLessThanOrEqual(1)
      expect(metrics.overflowWrap).not.toBe('anywhere')
      expect(metrics.actionVisible).toBe(true)
    }
  })

  test('Detail uses natural page scroll and keeps the continuation CTA reachable at short height', async ({ page }, testInfo) => {
    await prepareReadabilityPage(page)
    await bootReadability(page, testInfo.project.name)
    await seedReadabilityWord(page, 'readabilityfixturelongword', true)
    await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 390, height: 667 })
    await openDetail(page)

    const beforeScroll = await readLayoutMetrics(page)
    expect(beforeScroll.surfaceOverflowY).toBe('visible')
    expect(beforeScroll.surfaceMaxHeight).toBe('none')
    expect(beforeScroll.actionVisible).toBe(true)
    expect(Number(beforeScroll.scrollHeight)).toBeGreaterThan(Number(beforeScroll.clientHeight))

    await page.locator('.learning-stage-actions__primary').scrollIntoViewIfNeeded()
    const afterScroll = await readLayoutMetrics(page)
    expect(afterScroll.actionVisible).toBe(true)
    expect(Number(afterScroll.actionBottom)).toBeLessThanOrEqual(Number(afterScroll.viewportHeight) + 1)
    expect(Number(afterScroll.actionTop)).toBeGreaterThanOrEqual(0)
    expect(Number(afterScroll.scrollWidth) - Number(afterScroll.clientWidth)).toBeLessThanOrEqual(1)
  })

  test('200% zoom preserves readable surface pairing, wrapping, and CTA reachability', async ({ page }, testInfo) => {
    await prepareReadabilityPage(page)
    await bootReadability(page, testInfo.project.name)
    await seedReadabilityWord(page, 'readabilityfixturelongword', true)
    await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 800, height: 900 })
    await openMeaning(page)
    await page.evaluate(() => { document.documentElement.style.zoom = '2' })
    const meaning = await readSurfaceMetrics(page)
    const meaningLayout = await readLayoutMetrics(page)
    expect(meaning.tone).toBe('learning')
    expect(Number(meaning.primaryContrast)).toBeGreaterThanOrEqual(4.5)
    expect(Number(meaningLayout.scrollWidth) - Number(meaningLayout.clientWidth)).toBeLessThanOrEqual(1)
    expect(meaningLayout.actionVisible).toBe(true)
    await page.getByRole('button', { name: '更多' }).click()
    const detail = await readSurfaceMetrics(page)
    const detailLayout = await readLayoutMetrics(page)
    expect(detail.tone).toBe('learning')
    expect(Number(detail.primaryContrast)).toBeGreaterThanOrEqual(4.5)
    expect(Number(detailLayout.scrollWidth) - Number(detailLayout.clientWidth)).toBeLessThanOrEqual(1)
    expect(detailLayout.actionVisible).toBe(true)
  })

  test('High Contrast strengthens surface, control, separator, and focus treatment', async ({ page }, testInfo) => {
    await prepareReadabilityPage(page)
    await bootReadability(page, testInfo.project.name)
    await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
    await page.emulateMedia({ colorScheme: 'light', forcedColors: 'active', reducedMotion: 'reduce' })
    await openMeaning(page)
    const metrics = await readSurfaceMetrics(page)
    const highContrastActive = await page.evaluate(() => window.matchMedia('(forced-colors: active)').matches)
    const controls = await page.locator('.learning-shell .audio-button, .learning-shell .icon-button, .learning-stage-actions .button').evaluateAll((elements) => elements.map((element) => {
      const style = getComputedStyle(element)
      return { borderWidth: style.borderTopWidth, borderColor: style.borderTopColor, color: style.color }
    }))
    expect(metrics.tone).toBe('learning')
    expect(Number(metrics.primaryContrast)).toBeGreaterThanOrEqual(4.5)
    expect(controls.length).toBeGreaterThan(0)
    if (highContrastActive) {
      expect(Number.parseFloat(String(metrics.borderWidth))).toBeGreaterThanOrEqual(2)
      expect(controls.every((control) => Number.parseFloat(control.borderWidth) >= 1 && control.color.length > 0)).toBe(true)
    }
    await page.locator('.learning-stage-actions__primary').evaluate((element) => (element as HTMLElement).focus({ focusVisible: true }))
    const focusStyle = await page.locator('.learning-stage-actions__primary').evaluate((element) => {
      const style = getComputedStyle(element)
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }
    })
    expect(focusStyle.outlineStyle).not.toBe('none')
    expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(2)
  })

  test('landscape and iPad/desktop layouts keep the learning surface within the page', async ({ page }, testInfo) => {
    await prepareReadabilityPage(page)
    await bootReadability(page, testInfo.project.name)
    await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

    for (const viewport of [{ width: 844, height: 390 }, { width: 834, height: 1112 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport)
      await openStudy(page)
      await page.getByRole('button', { name: /^不认识/ }).click()
      if (await page.getByRole('region', { name: '语境提示' }).isVisible().catch(() => false)) await page.getByRole('button', { name: '查看核心词义' }).click()
      const metrics = await readSurfaceMetrics(page)
      expect(Number(metrics.documentScrollWidth) - Number(metrics.documentClientWidth)).toBeLessThanOrEqual(1)
      expect(Number(metrics.surfaceHeight)).toBeGreaterThan(0)
      expect(metrics.tone).toBe('learning')
    }
  })
})
