import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const baseURL = process.env.CET6_PREVIEW_URL ?? 'http://127.0.0.1:4177'
const screenshotDir = join(process.cwd(), 'audit', 'bbdcd-v1.2')
const consoleErrors = []
const pageErrors = []

async function onboard(page) {
  await page.goto(`${baseURL}/#/?audit=bbdcd`, { waitUntil: 'domcontentloaded' })
  const onboarding = page.getByRole('heading', { name: '每天打开，都知道下一步做什么。' })
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 20_000 })
  if (await onboarding.isVisible().catch(() => false)) {
    for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: /继续/ }).click()
    await page.getByRole('button', { name: /开始备考/ }).click()
  }
  await page.locator('.immersive-home__featured-word').waitFor({ state: 'visible', timeout: 20_000 })
}

async function setBackground(page, mode, id) {
  await page.evaluate(({ nextMode, nextId }) => new Promise((resolve, reject) => {
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
  await page.locator('.immersive-home__featured-word').waitFor({ state: 'visible', timeout: 20_000 })
  if (mode !== 'off') await page.locator('.app-background img').evaluate((image) => new Promise((resolve) => image.complete ? resolve() : image.addEventListener('load', resolve, { once: true })))
}

async function shot(page, filename) {
  await page.screenshot({ path: join(screenshotDir, filename), fullPage: false })
}

async function setup(browser, viewport) {
  const context = await browser.newContext({ viewport, colorScheme: 'light', deviceScaleFactor: 1, locale: 'zh-CN' })
  const page = await context.newPage()
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.addInitScript(() => {
    const resetKey = 'cet6-focus:bbdcd-capture-reset'
    if (!sessionStorage.getItem(resetKey)) {
      sessionStorage.setItem(resetKey, '1')
      indexedDB.deleteDatabase('cet6-focus')
    }
  })
  await onboard(page)
  return { context, page }
}

await mkdir(screenshotDir, { recursive: true })
const browser = await chromium.launch()

try {
  const { context, page } = await setup(browser, { width: 1440, height: 900 })
  for (const [id, filename] of [
    ['aurora-01', 'home-desktop-aurora.png'],
    ['altiplano-02', 'home-desktop-plateau.png'],
    ['lighthouse-01', 'home-desktop-lighthouse.png'],
    ['waterfall-01', 'home-desktop-waterfall.png'],
    ['penguins-01', 'home-desktop-animal.png'],
  ]) {
    await setBackground(page, 'fixed', id)
    await shot(page, filename)
  }

  await setBackground(page, 'off')
  await shot(page, 'home-background-off.png')
  await page.goto(`${baseURL}/#/study`, { waitUntil: 'domcontentloaded' })
  await page.locator('.page--study').waitFor({ state: 'visible', timeout: 20_000 })
  await shot(page, 'study-after-home-redesign.png')
  await context.close()

  const mobile = await setup(browser, { width: 390, height: 844 })
  await setBackground(mobile.page, 'fixed', 'aurora-02')
  await shot(mobile.page, 'home-iphone-390.png')
  await mobile.page.setViewportSize({ width: 430, height: 932 })
  await mobile.page.goto(`${baseURL}/#/`, { waitUntil: 'domcontentloaded' })
  await mobile.page.locator('.immersive-home__featured-word').waitFor({ state: 'visible', timeout: 20_000 })
  await shot(mobile.page, 'home-iphone-430.png')
  await mobile.context.close()

  const ipad = await setup(browser, { width: 834, height: 1194 })
  await setBackground(ipad.page, 'fixed', 'waterfall-02')
  await shot(ipad.page, 'home-ipad.png')
  await ipad.context.close()

  if (consoleErrors.length || pageErrors.length) throw new Error(JSON.stringify({ consoleErrors, pageErrors }))
  console.log(JSON.stringify({ baseURL, screenshotDir, screenshots: 10, consoleErrors, pageErrors }, null, 2))
} finally {
  await browser.close()
}
