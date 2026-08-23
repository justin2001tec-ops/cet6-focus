import { expect, test } from '@playwright/test'

test('production PWA opens from a warm service-worker cache while offline', async ({ page }) => {
  const previewUrl = process.env.CET6_PREVIEW_URL
  test.skip(!previewUrl, 'Set CET6_PREVIEW_URL to run against the production preview server.')
  const vocabularyUrl = new URL('data/cet6-vocab.v1.json', previewUrl!.endsWith('/') ? previewUrl! : `${previewUrl}/`).toString()

  await page.goto(previewUrl!, { waitUntil: 'networkidle' })
  await expect(page.getByText('每天打开，都知道下一步做什么。')).toBeVisible({ timeout: 15_000 })
  await expect.poll(async () => page.evaluate(async () => {
    await navigator.serviceWorker.ready
    return { controller: Boolean(navigator.serviceWorker.controller), cacheKeys: await caches.keys() }
  }), { timeout: 15_000 }).toMatchObject({ controller: true })

  await page.reload({ waitUntil: 'networkidle' })
  await page.context().setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByText('每天打开，都知道下一步做什么。')).toBeVisible({ timeout: 15_000 })
  const offlineState = await page.evaluate(async (cachedVocabularyUrl) => ({
    controller: Boolean(navigator.serviceWorker.controller),
    vocabularyCached: Boolean(await caches.match(cachedVocabularyUrl)),
  }), vocabularyUrl)
  expect(offlineState).toEqual({ controller: true, vocabularyCached: true })
})
