import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const baseURL = process.env.CET6_BASE_URL ?? 'http://127.0.0.1:4173'
const outputDir = join(process.cwd(), 'audit', 'v1.4-motion', 'screenshots')

async function boot(page) {
  await page.goto('/#/', { waitUntil: 'domcontentloaded' })
  const onboarding = page.getByRole('heading', { name: '每天打开，都知道下一步做什么。' })
  await onboarding.waitFor({ state: 'visible', timeout: 40_000 })
  for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /开始备考/ }).click()
  await page.locator('.immersive-home__featured-word').waitFor({ state: 'visible', timeout: 40_000 })
}

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch()

const desktop = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
const desktopPage = await desktop.newPage()
await boot(desktopPage)
await desktopPage.screenshot({ path: join(outputDir, 'motion-home-desktop.png'), fullPage: true })
await desktopPage.locator('.immersive-home__task-card--learn').click()
await desktopPage.locator('.learning-stage--recall').waitFor({ state: 'visible', timeout: 15_000 })
await desktopPage.screenshot({ path: join(outputDir, 'motion-study-recall-desktop.png'), fullPage: true })
await desktopPage.getByRole('button', { name: /不认识/ }).click()
await desktopPage.locator('.learning-stage--context').waitFor({ state: 'visible', timeout: 15_000 })
await desktopPage.screenshot({ path: join(outputDir, 'motion-study-context-desktop.png'), fullPage: true })
await desktop.close()

const mobile = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
const mobilePage = await mobile.newPage()
await boot(mobilePage)
await mobilePage.getByRole('link', { name: '词库' }).click()
await mobilePage.waitForURL(/#\/words$/, { timeout: 40_000 })
await mobilePage.locator('.word-row').first().waitFor({ state: 'visible', timeout: 40_000 })
await mobilePage.locator('.word-row').first().click()
await mobilePage.locator('[data-physical-sheet="true"]').waitFor({ state: 'visible', timeout: 5_000 })
await mobilePage.screenshot({ path: join(outputDir, 'motion-physical-sheet-mobile.png'), fullPage: true })
await mobile.close()

const reduced = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
const reducedPage = await reduced.newPage()
await boot(reducedPage)
await reducedPage.locator('.immersive-home__task-card--learn').click()
await reducedPage.locator('.learning-stage--recall').waitFor({ state: 'visible', timeout: 15_000 })
await reducedPage.screenshot({ path: join(outputDir, 'motion-reduced-study-mobile.png'), fullPage: true })
await reduced.close()

await browser.close()
console.log(`Captured v1.4 motion screenshots in ${outputDir}`)
