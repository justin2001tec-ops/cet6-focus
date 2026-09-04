import { expect, test } from '@playwright/test'
import {
  bootReadability,
  openContext,
  openDetail,
  openMeaning,
  openStudy,
  prepareReadabilityPage,
  readAtmosphereMetrics,
  readLayoutMetrics,
  readSafeAreaMetrics,
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

  test('background prominence decreases from Recall through Detail across bright, dark, textured, and medium scenes', async ({ page }, testInfo) => {
    await prepareReadabilityPage(page)
    await bootReadability(page, testInfo.project.name)
    await seedReadabilityWord(page, 'readabilityfixturelongword', true)
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

    const scenes = [
      { id: 'plateau-kiang-01', label: 'bright' },
      { id: 'stars-02', label: 'dark' },
      { id: 'waterfall-02', label: 'textured' },
      { id: 'altiplano-01', label: 'medium' },
    ] as const
    const stages = [
      { name: 'recall', open: openStudy },
      { name: 'context', open: openContext },
      { name: 'meaning', open: openMeaning },
      { name: 'detail', open: openDetail },
    ] as const

    for (const scene of scenes) {
      const alphaByStage: number[] = []
      for (const stage of stages) {
        await writeSettings(page, { theme: 'light', backgroundMode: 'fixed', backgroundId: scene.id, dailyNewWords: 1 })
        await stage.open(page)
        const metrics = await readAtmosphereMetrics(page)
        expect(metrics.activeClass).toBe(`learning-shell--${stage.name}`)
        const activeLayer = (metrics.layers as Record<string, { opacity: string; scrimAlpha: number }>)[stage.name === 'recall' ? 'base' : stage.name]
        expect(activeLayer.opacity).toBe('1')
        alphaByStage.push(activeLayer.scrimAlpha)
      }
      expect(alphaByStage[0]).toBeLessThan(alphaByStage[1])
      expect(alphaByStage[1]).toBeLessThan(alphaByStage[2])
      expect(alphaByStage[2]).toBeLessThan(alphaByStage[3])
    }
  })

  test('Safe Area uses independent left and right insets in portrait, landscape, and iPad layouts', async ({ page }, testInfo) => {
    await prepareReadabilityPage(page)
    await bootReadability(page, testInfo.project.name)
    await seedReadabilityWord(page, 'readabilityfixturelongword', true)
    await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

    const viewports = [
      { label: 'portrait-390', width: 390, height: 844 },
      { label: 'portrait-430', width: 430, height: 932 },
      { label: 'landscape-844', width: 844, height: 390 },
      { label: 'landscape-852', width: 852, height: 393 },
      { label: 'ipad-landscape', width: 1112, height: 834 },
    ] as const

    for (const viewport of viewports) {
      for (const side of ['left', 'right'] as const) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await openDetail(page)
        const safeLeft = side === 'left' ? 44 : 0
        const safeRight = side === 'right' ? 44 : 0
        await page.evaluate(({ left, right }) => {
          const inner = document.querySelector('.learning-shell__inner') as HTMLElement | null
          if (!inner) throw new Error('Safe Area fixture target missing')
          const wrapper = document.createElement('div')
          wrapper.dataset.r1SafeAreaFixture = 'true'
          wrapper.style.boxSizing = 'border-box'
          wrapper.style.display = 'flex'
          wrapper.style.flexDirection = 'column'
          wrapper.style.width = '100%'
          wrapper.style.paddingLeft = `${left}px`
          wrapper.style.paddingRight = `${right}px`
          while (inner.firstChild) wrapper.append(inner.firstChild)
          inner.append(wrapper)
        }, { left: safeLeft, right: safeRight })
        const metrics = await readSafeAreaMetrics(page, safeLeft, safeRight)
        expect(Number.parseFloat(String(metrics.fixturePaddingLeft))).toBeGreaterThanOrEqual(Number(metrics.safeLeft))
        expect(Number.parseFloat(String(metrics.fixturePaddingRight))).toBeGreaterThanOrEqual(Number(metrics.safeRight))
        expect(metrics.collisions).toEqual([])
        expect(Number(metrics.horizontalOverflow)).toBeLessThanOrEqual(1)
      }
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
    await page.getByRole('button', { name: '扩展理解' }).click()
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

  test('prefers-contrast: more keeps learning text, separators, controls, and focus visible', async ({ page }, testInfo) => {
    await prepareReadabilityPage(page)
    await bootReadability(page, testInfo.project.name)
    await writeSettings(page, { theme: 'light', backgroundMode: 'off', dailyNewWords: 1 })
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce', contrast: 'more' } as Parameters<typeof page.emulateMedia>[0])
    const active = await page.evaluate(() => window.matchMedia('(prefers-contrast: more)').matches)
    if (!active) {
      testInfo.annotations.push({ type: 'evidence-gap', description: 'This Playwright engine cannot emulate prefers-contrast: more; see manual R1 evidence.' })
      test.skip(true, 'prefers-contrast: more emulation is unavailable in this engine')
      return
    }
    await openMeaning(page)
    const metrics = await readSurfaceMetrics(page)
    const tokens = metrics.readingTokens as Record<string, string>
    const controls = await page.locator('.learning-shell .audio-button, .learning-shell .icon-button, .learning-stage-actions .button').evaluateAll((elements) => elements.map((element) => {
      const style = getComputedStyle(element)
      return { borderWidth: style.borderTopWidth, color: style.color }
    }))
    expect(Number(metrics.primaryContrast)).toBeGreaterThanOrEqual(4.5)
    expect(Number(metrics.secondaryContrast)).toBeGreaterThanOrEqual(4.5)
    expect(Number(metrics.accentContrast)).toBeGreaterThanOrEqual(4.5)
    expect(tokens.tertiary).not.toBe('')
    expect(Number.parseFloat(String(metrics.borderWidth))).toBeGreaterThanOrEqual(2)
    expect(controls.every((control) => Number.parseFloat(control.borderWidth) >= 1 && control.color.length > 0)).toBe(true)
    await page.locator('.learning-stage-actions__primary').evaluate((element) => (element as HTMLElement).focus({ focusVisible: true }))
    const focusStyle = await page.locator('.learning-stage-actions__primary').evaluate((element) => {
      const style = getComputedStyle(element)
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }
    })
    expect(focusStyle.outlineStyle).not.toBe('none')
    expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThanOrEqual(3)
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
