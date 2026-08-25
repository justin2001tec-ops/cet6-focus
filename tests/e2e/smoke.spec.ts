import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

type SnapshotCard = {
  wordId: string
  due: string
  fsrsCard: {
    due: string
    stability: number
    difficulty: number
    elapsedDays: number
    scheduledDays: number
    learningSteps: number
    reps: number
    lapses: number
    state: number
    lastReview?: string
  }
  starred: boolean
  personalNote?: string
  spellingWrongCount: number
  lastSpellingAt?: string
  lastDictationAt?: string
}

type SnapshotSession = {
  id: string
  type: string
  wordCount: number
  againCount: number
  durationMs: number
  attempted?: number
  correct?: number
  wrong?: number
  corrected?: number
}

type DbSnapshot = {
  words: Array<{ id: string; word: string; archived?: boolean }>
  cards: SnapshotCard[]
  reviewLogs: Array<{ wordId: string; sessionId: string; rating: number }>
  sessions: SnapshotSession[]
  settings: { onboarded: boolean; dailyNewWords: number; dataVersion: string; backgroundMode: string; backgroundId?: string } | null
}

async function preparePage(page: Page): Promise<void> {
  // Each Playwright context gets a clean first-load database. The session flag
  // prevents later reloads in the same test from deleting the data under test.
  await page.addInitScript(() => {
    const resetKey = 'cet6-focus:e2e-reset'
    if (!sessionStorage.getItem(resetKey)) {
      sessionStorage.setItem(resetKey, '1')
      indexedDB.deleteDatabase('cet6-focus')
    }
  })
}

async function gotoRoute(page: Page, route: string): Promise<void> {
  await page.goto(`/#${route}`, { waitUntil: 'domcontentloaded' })
}

async function selectOptionStable(page: Page, selector: string, value: string): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const control = page.locator(selector).first()
    await control.waitFor({ state: 'visible', timeout: 5_000 })
    try {
      await control.selectOption(value)
      return
    } catch {
      await page.waitForTimeout(150)
    }
  }
  throw new Error(`Could not select ${value} from ${selector}`)
}

async function resetLearningCardsToNew(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction(['cards', 'reviewLogs', 'sessions'], 'readwrite')
      const cards = transaction.objectStore('cards')
      const cardsRequest = cards.getAll()
      cardsRequest.onerror = () => reject(cardsRequest.error ?? new Error('Cards read failed'))
      cardsRequest.onsuccess = () => {
        const now = new Date().toISOString()
        for (const card of cardsRequest.result) {
          cards.put({
            ...card,
            due: now,
            fsrsCard: { ...card.fsrsCard, due: now, state: 0, reps: 0, lapses: 0, lastReview: undefined },
            spellingWrongCount: 0,
            lastSpellingAt: undefined,
            lastDictationAt: undefined,
            updatedAt: now,
          })
        }
      }
      transaction.objectStore('reviewLogs').clear()
      transaction.objectStore('sessions').clear()
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Learning reset failed'))
    }
  }))
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function completeOnboarding(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: '每天打开，都知道下一步做什么。' })).toBeVisible({ timeout: 15_000 })
  for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /开始备考/ }).click()
  await expect(page.locator('.immersive-home__featured-word')).toBeVisible({ timeout: 15_000 })
}

async function readDb(page: Page): Promise<DbSnapshot> {
  return page.evaluate(() => new Promise<DbSnapshot>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction(['words', 'cards', 'reviewLogs', 'sessions', 'settings'], 'readonly')
      const readStore = <T>(name: string) => new Promise<T[]>((storeResolve, storeReject) => {
        const storeRequest = transaction.objectStore(name).getAll()
        storeRequest.onsuccess = () => storeResolve(storeRequest.result as T[])
        storeRequest.onerror = () => storeReject(storeRequest.error ?? new Error(`Cannot read ${name}`))
      })
      Promise.all([
        readStore<DbSnapshot['words'][number]>('words'),
        readStore<SnapshotCard>('cards'),
        readStore<DbSnapshot['reviewLogs'][number]>('reviewLogs'),
        readStore<SnapshotSession>('sessions'),
        readStore<DbSnapshot['settings'] extends Array<infer T> ? T : NonNullable<DbSnapshot['settings']>>('settings'),
      ]).then(([words, cards, reviewLogs, sessions, settings]) => {
        database.close()
        resolve({ words, cards, reviewLogs, sessions, settings: settings[0] ?? null })
      }).catch((error: unknown) => {
        database.close()
        reject(error)
      })
    }
  }))
}

async function updateSettings(page: Page, patch: { dailyNewWords?: number }): Promise<void> {
  await page.evaluate((nextPatch) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('settings', 'readwrite')
      const store = transaction.objectStore('settings')
      const getRequest = store.get('app')
      getRequest.onerror = () => reject(getRequest.error ?? new Error('Settings read failed'))
      getRequest.onsuccess = () => store.put({ ...getRequest.result, ...nextPatch, updatedAt: new Date().toISOString() })
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Settings update failed'))
    }
  }), patch)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

async function patchCardDue(page: Page, wordId: string): Promise<void> {
  await page.evaluate((id) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('cards', 'readwrite')
      const store = transaction.objectStore('cards')
      const getRequest = store.get(id)
      getRequest.onerror = () => reject(getRequest.error ?? new Error('Card read failed'))
      getRequest.onsuccess = () => {
        const card = getRequest.result
        const due = '2000-01-01T00:00:00.000Z'
        store.put({ ...card, due, fsrsCard: { ...card.fsrsCard, due }, updatedAt: new Date().toISOString() })
      }
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Card update failed'))
    }
  }), wordId)
}

async function patchDictationFixture(page: Page, count = 12): Promise<string[]> {
  return page.evaluate((fixtureCount) => new Promise<string[]>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('cards', 'readwrite')
      const store = transaction.objectStore('cards')
      const cardsRequest = store.getAll()
      cardsRequest.onerror = () => reject(cardsRequest.error ?? new Error('Cards read failed'))
      cardsRequest.onsuccess = () => {
        const due = '2099-01-01T00:00:00.000Z'
        const selected = cardsRequest.result.slice(0, fixtureCount) as SnapshotCard[]
        selected.forEach((card) => store.put({
          ...card,
          due,
          fsrsCard: { ...card.fsrsCard, due, state: 2, reps: 1, lastReview: '2026-08-20T08:00:00.000Z' },
          spellingWrongCount: 0,
          lastSpellingAt: undefined,
          lastDictationAt: undefined,
          updatedAt: new Date().toISOString(),
        }))
      }
      transaction.oncomplete = () => { database.close(); resolve((cardsRequest.result as SnapshotCard[]).slice(0, fixtureCount).map((card) => card.wordId)) }
      transaction.onerror = () => reject(transaction.error ?? new Error('Dictation fixture update failed'))
    }
  }), count)
}

async function submitWrongAndCorrect(page: Page): Promise<string> {
  const input = page.locator('#dictation-input')
  await input.fill('not-the-answer')
  await page.getByRole('button', { name: /提交/ }).click()
  await expect(page.locator('.spell-diff')).toBeVisible()
  const answer = (await page.locator('.spell-diff').textContent())?.trim()
  expect(answer).toBeTruthy()
  await input.fill(answer!)
  await page.getByRole('button', { name: /重新输入正确拼写/ }).click()
  return answer!
}

async function submitCorrect(page: Page, answer: string): Promise<void> {
  const input = page.locator('#dictation-input')
  await input.fill(answer)
  await page.getByRole('button', { name: /提交/ }).click()
  await expect(page.getByRole('button', { name: /下一词/ })).toBeVisible()
  await page.getByRole('button', { name: /下一词/ }).click()
}

async function patchMigrationState(page: Page, targetWordId: string): Promise<string> {
  return page.evaluate((targetId) => new Promise<string>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction(['cards', 'settings'], 'readwrite')
      const cardStore = transaction.objectStore('cards')
      const settingsStore = transaction.objectStore('settings')
      const cardsRequest = cardStore.getAll()
      cardsRequest.onerror = () => reject(cardsRequest.error ?? new Error('Cards read failed'))
      cardsRequest.onsuccess = () => {
        const target = cardsRequest.result.find((card: SnapshotCard) => card.wordId === targetId)
        const removed = cardsRequest.result.find((card: SnapshotCard) => card.wordId !== targetId)
        if (!target || !removed) {
          reject(new Error('Migration fixture cards not found'))
          return
        }
        cardStore.put({ ...target, starred: true, personalNote: 'migration note', spellingWrongCount: 3, lastSpellingAt: new Date().toISOString() })
        cardStore.delete(removed.wordId)
        const settingsRequest = settingsStore.get('app')
        settingsRequest.onsuccess = () => settingsStore.put({ ...settingsRequest.result, dataVersion: 'legacy.v0', updatedAt: new Date().toISOString() })
      }
      transaction.oncomplete = () => { database.close(); resolve(cardsRequest.result.find((card: SnapshotCard) => card.wordId !== targetId).wordId) }
      transaction.onerror = () => reject(transaction.error ?? new Error('Migration fixture update failed'))
    }
  }), targetWordId)
}

async function finishCurrentStudyCard(page: Page): Promise<string> {
  const word = await page.locator('.learning-word-header h1').textContent()
  expect(word).toBeTruthy()
  await page.getByRole('button', { name: /^认识/ }).click()
  await page.getByRole('button', { name: '继续', exact: true }).click()
  await expect(page.getByRole('heading', { name: '这一组，完成了。' })).toBeVisible({ timeout: 10_000 })
  return word!
}

test('Today flow orders review, new study, dictation, and reaches completion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The full flow is covered on desktop; mobile has a dedicated overflow gate.')
  await preparePage(page)
  await completeOnboarding(page)
  await updateSettings(page, { dailyNewWords: 1 })
  await gotoRoute(page, '/study')
  await expect(page.locator('.learning-word-header h1')).toBeVisible()
  await finishCurrentStudyCard(page)

  const afterStudy = await readDb(page)
  const encounteredId = afterStudy.cards.find((card) => card.fsrsCard.state !== 0 || card.fsrsCard.reps > 0)?.wordId
  expect(encounteredId).toBeTruthy()
  await patchCardDue(page, encounteredId!)
  await gotoRoute(page, '/today')

  await expect(page.locator('.learning-progress__mode')).toHaveText('到期复习', { timeout: 10_000 })
  await finishCurrentStudyCard(page)
  await page.getByRole('button', { name: '继续今日学习' }).click()
  await expect(page.locator('.learning-progress__mode')).toHaveText('今日学习', { timeout: 10_000 })
  await finishCurrentStudyCard(page)
  await page.getByRole('button', { name: '进入听写强化' }).click()
  await expect(page.getByRole('heading', { name: '听写，把认识变成会写。' })).toBeVisible({ timeout: 10_000 })

  for (let index = 0; index < 2; index += 1) {
    const input = page.locator('#dictation-input')
    await input.fill('not-the-answer')
    await page.getByRole('button', { name: /提交/ }).click()
    await expect(page.locator('.spell-diff')).toBeVisible()
    const answer = await page.locator('.spell-diff').textContent()
    expect(answer).toBeTruthy()
    await input.fill(answer!)
    await page.getByRole('button', { name: /重新输入正确拼写/ }).click()
    if (index === 0) {
      await expect(page.locator('.dictation-card__meta')).toContainText('2 / 2')
      await expect(page.getByRole('button', { name: /提交/ })).toBeVisible()
    }
  }
  await expect(page.getByRole('heading', { name: '这一组，完成了。' })).toBeVisible({ timeout: 10_000 })

  const finished = await readDb(page)
  expect(finished.sessions.map((session) => session.type)).toEqual(expect.arrayContaining(['review', 'study', 'dictation']))
  const dictation = finished.sessions.find((session) => session.type === 'dictation')
  expect(dictation).toMatchObject({ attempted: 2, correct: 0, wrong: 2, corrected: 2 })
  expect(finished.reviewLogs).toHaveLength(3)
})

test('Undo from the final-card completion state restores that same card', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The flow is covered on desktop; mobile has a dedicated overflow gate.')
  await preparePage(page)
  await completeOnboarding(page)
  await updateSettings(page, { dailyNewWords: 1 })
  await gotoRoute(page, '/study')
  const word = await finishCurrentStudyCard(page)
  await page.getByRole('button', { name: /撤销上一词/ }).click()
  await expect(page.locator('.learning-word-header h1')).toHaveText(word)
  await expect(page.getByRole('button', { name: /^认识/ })).toBeVisible()

  const restored = await readDb(page)
  expect(restored.reviewLogs).toHaveLength(0)
  expect(restored.sessions.at(-1)).toMatchObject({ type: 'study', wordCount: 0 })
  const card = restored.cards.find((candidate) => candidate.fsrsCard.state !== 0 || candidate.fsrsCard.reps > 0)
  expect(card).toBeUndefined()
})

test('Dictation spelling error changes spelling signals but not FSRS or ReviewLog', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The flow is covered on desktop; mobile has a dedicated overflow gate.')
  await preparePage(page)
  await completeOnboarding(page)
  await updateSettings(page, { dailyNewWords: 1 })
  await gotoRoute(page, '/study')
  await finishCurrentStudyCard(page)
  const before = await readDb(page)
  const target = before.cards.find((card) => card.fsrsCard.state !== 0 || card.fsrsCard.reps > 0)
  expect(target).toBeTruthy()
  await gotoRoute(page, '/dictation')
  await expect(page.getByRole('heading', { name: '听写，把认识变成会写。' })).toBeVisible({ timeout: 10_000 })
  const input = page.locator('#dictation-input')
  await input.fill('not-the-answer')
  await page.getByRole('button', { name: /提交/ }).click()
  await expect(page.locator('.spell-diff')).toBeVisible()
  const answer = await page.locator('.spell-diff').textContent()
  await input.fill(answer!)
  await page.getByRole('button', { name: /重新输入正确拼写/ }).click()
  await expect(page.getByRole('heading', { name: /统计，为了看见节奏/ })).toBeVisible({ timeout: 10_000 })

  const after = await readDb(page)
  const targetAfter = after.cards.find((card) => card.wordId === target!.wordId)
  expect(targetAfter).toBeTruthy()
  expect(targetAfter!.fsrsCard).toEqual(target!.fsrsCard)
  expect(targetAfter!.due).toBe(target!.due)
  expect(targetAfter!.spellingWrongCount).toBe(target!.spellingWrongCount + 1)
  expect(after.reviewLogs).toHaveLength(1)
  expect(after.sessions.find((session) => session.type === 'dictation')).toMatchObject({ attempted: 1, correct: 0, wrong: 1, corrected: 1 })
})

test('Dictation has no fallback to untouched New cards', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The flow is covered on desktop; mobile has a dedicated overflow gate.')
  await preparePage(page)
  await completeOnboarding(page)
  await resetLearningCardsToNew(page)
  await gotoRoute(page, '/dictation')
  await expect(page.getByRole('heading', { name: '还没有可听写的词。' })).toBeVisible({ timeout: 10_000 })
  const snapshot = await readDb(page)
  expect(snapshot.sessions).toHaveLength(0)
  expect(snapshot.reviewLogs).toHaveLength(0)
  expect(snapshot.cards.every((card) => card.fsrsCard.state === 0 && card.fsrsCard.reps === 0 && card.spellingWrongCount === 0)).toBe(true)
})

test('Dictation records timestamps and rotates beyond the completed batch', async ({ page }) => {
  test.setTimeout(60_000)
  await preparePage(page)
  await completeOnboarding(page)
  const fixtureIds = await patchDictationFixture(page)
  const fixtureSnapshot = await readDb(page)
  const orderedFixtureIds = [...fixtureIds].sort((a, b) => a.localeCompare(b))
  await gotoRoute(page, '/dictation')
  await expect(page.getByRole('heading', { name: '听写，把认识变成会写。' })).toBeVisible({ timeout: 10_000 })

  const firstBatchIds = orderedFixtureIds.slice(0, 10)
  for (let index = 0; index < 10; index += 1) {
    const answer = fixtureSnapshot.words.find((word) => word.id === firstBatchIds[index])?.word
    expect(answer).toBeTruthy()
    await submitCorrect(page, answer!)
    if (index < 9) await expect(page.locator('.dictation-card__meta')).toContainText(`${index + 2} / 10`)
  }
  await expect(page.getByRole('heading', { name: /统计，为了看见节奏/ })).toBeVisible({ timeout: 10_000 })

  const afterFirst = await readDb(page)
  expect(firstBatchIds.every((id) => Boolean(afterFirst.cards.find((card) => card.wordId === id)?.lastDictationAt))).toBe(true)
  const untouchedIds = fixtureIds.filter((id) => !firstBatchIds.includes(id))
  expect(untouchedIds).toHaveLength(2)

  await gotoRoute(page, '/dictation')
  await expect(page.getByRole('heading', { name: '听写，把认识变成会写。' })).toBeVisible({ timeout: 10_000 })
  const nextAnswer = await submitWrongAndCorrect(page)
  const nextId = afterFirst.words.find((word) => word.word.toLocaleLowerCase() === nextAnswer.toLocaleLowerCase())?.id
  expect(nextId).toBeTruthy()
  expect(untouchedIds).toContain(nextId)
  await gotoRoute(page, '/stats')
  await expect(page.getByRole('heading', { name: /统计，为了看见节奏/ })).toBeVisible({ timeout: 10_000 })
})

test('Word Detail action copy matches its study navigation behavior', async ({ page }) => {
  await preparePage(page)
  await completeOnboarding(page)
  const snapshot = await readDb(page)
  const word = snapshot.words.find((candidate) => !candidate.archived)
  expect(word).toBeTruthy()
  await gotoRoute(page, `/word/${word!.id}`)
  await expect(page.getByRole('heading', { name: word!.word })).toBeVisible({ timeout: 10_000 })
  const enterStudy = page.getByRole('button', { name: '进入学习' })
  await expect(enterStudy).toBeVisible()
  await enterStudy.click()
  await expect(page.locator('.learning-shell')).toBeVisible({ timeout: 10_000 })
})

test('Vocabulary migration preserves learning data and repairs only the missing card', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The migration flow is covered on desktop; mobile has a dedicated overflow gate.')
  await preparePage(page)
  await completeOnboarding(page)
  await updateSettings(page, { dailyNewWords: 1 })
  await gotoRoute(page, '/study')
  await finishCurrentStudyCard(page)
  const before = await readDb(page)
  const target = before.cards.find((card) => card.fsrsCard.state !== 0 || card.fsrsCard.reps > 0)
  expect(target).toBeTruthy()
  const removedId = await patchMigrationState(page, target!.wordId)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await gotoRoute(page, '/')
  await expect(page.locator('.immersive-home__featured-word')).toBeVisible({ timeout: 15_000 })

  const after = await readDb(page)
  const preserved = after.cards.find((card) => card.wordId === target!.wordId)
  const repaired = after.cards.find((card) => card.wordId === removedId)
  expect(preserved).toMatchObject({ starred: true, personalNote: 'migration note', spellingWrongCount: 3 })
  expect(preserved!.fsrsCard).toEqual(target!.fsrsCard)
  expect(after.reviewLogs).toHaveLength(1)
  expect(after.sessions.find((session) => session.type === 'study')).toMatchObject({ wordCount: 1 })
  expect(repaired).toBeTruthy()
  expect(repaired!.fsrsCard.state).toBe(0)
  expect(after.settings?.dataVersion).toBe('cet6-vocab.v1')
})

test('Backup restore preserves fields and reloads through vocabulary reconciliation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The flow is covered on desktop; mobile has a dedicated overflow gate.')
  await preparePage(page)
  await completeOnboarding(page)
  await updateSettings(page, { dailyNewWords: 1 })
  await gotoRoute(page, '/study')
  await finishCurrentStudyCard(page)
  let snapshot = await readDb(page)
  const target = snapshot.cards.find((card) => card.fsrsCard.state !== 0 || card.fsrsCard.reps > 0)
  expect(target).toBeTruthy()

  await page.evaluate((wordId) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('cards', 'readwrite')
      const store = transaction.objectStore('cards')
      const getRequest = store.get(wordId)
      getRequest.onsuccess = () => store.put({ ...getRequest.result, starred: true, personalNote: 'backup note' })
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Backup fixture update failed'))
    }
  }), target!.wordId)

  await gotoRoute(page, '/settings')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /导出学习数据/ }).click(),
  ])
  const downloadedPath = await download.path()
  expect(downloadedPath).toBeTruthy()
  const backup = JSON.parse(await readFile(downloadedPath!, 'utf8')) as { settings: { dataVersion: string }; cards: SnapshotCard[] }
  backup.settings.dataVersion = 'legacy.v0'
  await mkdir(testInfo.outputDir, { recursive: true })
  const restorePath = join(testInfo.outputDir, 'cet6-focus-restore.json')
  await writeFile(restorePath, JSON.stringify(backup), 'utf8')

  await page.getByRole('button', { name: /重置进度/ }).click()
  await page.getByPlaceholder('输入 RESET').fill('RESET')
  await Promise.all([
    page.waitForEvent('load'),
    page.getByRole('button', { name: '确认清空进度' }).click(),
  ])
  await expect.poll(async () => (await readDb(page)).reviewLogs.length, { timeout: 15_000 }).toBe(0)

  await page.locator('input[type="file"]').setInputFiles(restorePath)
  await expect(page.getByRole('heading', { name: '确认恢复备份' })).toBeVisible()
  await Promise.all([
    page.waitForEvent('load'),
    page.getByRole('button', { name: /确认恢复/ }).click(),
  ])
  await expect.poll(async () => (await readDb(page)).reviewLogs.length, { timeout: 20_000 }).toBe(1)
  snapshot = await readDb(page)
  const restored = snapshot.cards.find((card) => card.wordId === target!.wordId)
  expect(restored).toMatchObject({ starred: true, personalNote: 'backup note' })
  expect(restored!.fsrsCard).toEqual(target!.fsrsCard)
  expect(snapshot.settings?.dataVersion).toBe('cet6-vocab.v1')
})

test('Fixed-current background persists across reload', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The persistence check is covered on desktop; mobile has a dedicated overflow gate.')
  await preparePage(page)
  await completeOnboarding(page)
  await gotoRoute(page, '/settings')
  await expect(page.locator('.page--settings')).toBeVisible({ timeout: 15_000 })
  await selectOptionStable(page, '.background-options select', 'fixed')
  await expect(page.locator('.background-options select')).toHaveCount(2)
  const fixed = await readDb(page)
  expect(fixed.settings?.backgroundMode).toBe('fixed')
  expect(fixed.settings?.backgroundId).toBeTruthy()
  expect(fixed.settings?.backgroundId).not.toMatch(/^study-/)
  const fixedId = fixed.settings!.backgroundId!
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('.app-frame--with-background .app-background img')).toHaveAttribute('src', new RegExp(`backgrounds/v1\\.2/webp/${fixedId}\\.webp$`))
  expect((await readDb(page)).settings?.backgroundId).toBe(fixedId)
})

test('Mobile layout stays within the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'This is the mobile-specific responsive gate.')
  await preparePage(page)
  await completeOnboarding(page)
  for (const route of ['/', '/settings', '/stats']) {
    await gotoRoute(page, route)
    await expect(page.locator('.page, .page--dashboard')).toBeVisible({ timeout: 10_000 })
    const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
    expect(metrics.scrollWidth - metrics.clientWidth).toBeLessThanOrEqual(1)
  }
})
