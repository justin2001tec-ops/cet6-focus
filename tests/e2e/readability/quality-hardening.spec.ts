import { expect, test } from '@playwright/test'
import { bootQualityHardening, seedQualityHardeningFixture } from './quality-hardening-fixtures'

test.describe('v1.5 quality hardening', () => {
  test('Weak Words renders deterministic non-empty fixture signals', async ({ page }, testInfo) => {
    test.setTimeout(90_000)
    await bootQualityHardening(page, testInfo.project.name)
    await seedQualityHardeningFixture(page, 'weak')
    await page.goto('/#/mistakes', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: '薄弱词，不让它们悄悄溜走。' })).toBeVisible({ timeout: 20_000 })
    const rows = page.locator('.weak-row')
    await expect(rows).toHaveCount(3, { timeout: 20_000 })
    const signalText = await rows.locator('.weak-row__signals').allTextContents()
    expect(signalText.join('|')).toContain('重点')
    expect(signalText.join('|')).toContain('拼写')
    expect(signalText.join('|')).toContain('近期 Again')
    await expect(rows.filter({ hasText: 'ambiguous' })).toBeVisible()
    await expect(rows.filter({ hasText: 'consecutive' })).toBeVisible()
    await expect(rows.filter({ hasText: 'withdraw' })).toBeVisible()

    await page.screenshot({ path: `audit/v1.5-quality-hardening/screenshots/weak-words-non-empty-${testInfo.project.name}.png`, fullPage: true })
  })

  test('Dictation renders deterministic non-empty encountered fixture queue', async ({ page }, testInfo) => {
    test.setTimeout(90_000)
    await bootQualityHardening(page, testInfo.project.name)
    await seedQualityHardeningFixture(page, 'dictation')
    await page.goto('/#/dictation', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: '听写，把认识变成会写。' })).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('.dictation-card__meta')).toContainText('1 / 3', { timeout: 20_000 })
    await expect(page.locator('#dictation-input')).toBeVisible()
    await expect(page.getByRole('button', { name: '再次播放发音' })).toBeVisible()

    await page.screenshot({ path: `audit/v1.5-quality-hardening/screenshots/dictation-non-empty-${testInfo.project.name}.png`, fullPage: true })
  })

  test('Settings import exposes one keyboard-accessible trigger', async ({ page }, testInfo) => {
    test.setTimeout(90_000)
    await bootQualityHardening(page, testInfo.project.name)
    await page.goto('/#/settings', { waitUntil: 'domcontentloaded' })

    const trigger = page.getByRole('button', { name: '导入 JSON 备份' })
    await expect(trigger).toBeVisible({ timeout: 20_000 })
    await trigger.focus()
    await expect(trigger).toBeFocused()

    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toHaveCount(1)
    await expect(fileInput).toHaveAttribute('aria-hidden', 'true')
    await expect(fileInput).toHaveJSProperty('tabIndex', -1)
    const independentlyExposed = await fileInput.evaluate((input) => input.getAttribute('aria-hidden') !== 'true' || (input as HTMLInputElement).tabIndex >= 0)
    expect(independentlyExposed).toBe(false)

    const [fileChooser] = await Promise.all([page.waitForEvent('filechooser'), trigger.press('Enter')])
    expect(fileChooser).toBeTruthy()
    await page.screenshot({ path: `audit/v1.5-quality-hardening/screenshots/settings-import-accessibility-${testInfo.project.name}.png`, fullPage: true })
  })
})
