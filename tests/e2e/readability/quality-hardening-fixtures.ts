import type { Page } from '@playwright/test'
import { bootReadability, prepareReadabilityPage } from './fixtures'

export type QualityHardeningFixture = 'weak' | 'dictation'

export async function bootQualityHardening(page: Page, projectName: string): Promise<void> {
  await prepareReadabilityPage(page)
  await bootReadability(page, projectName)
}

export async function seedQualityHardeningFixture(page: Page, fixture: QualityHardeningFixture): Promise<void> {
  await page.evaluate((fixtureMode) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('Quality hardening fixture database open failed'))
    request.onsuccess = () => {
      const database = request.result
      const now = new Date().toISOString()
      const recent = new Date(Date.now() - 60_000).toISOString()
      const makeWord = (id: string, word: string, meaning: string) => ({
        id,
        word,
        phonetic: '/ˈtest/',
        pos: ['adj.'],
        meaningZh: [meaning],
        definitionEn: [`A deterministic ${fixtureMode} fixture for the v1.5 quality hardening gate.`],
        examples: [{ en: `The ${word} fixture appears in a focused practice surface.`, zh: `这是 ${word} 的隔离测试例句。` }],
        examTags: ['V1_5_QUALITY_HARDENING_FIXTURE'],
        source: 'v1.5 quality hardening test fixture',
        sourceLicense: 'Internal test fixture',
        archived: false,
      })
      const makeCard = (wordId: string, state: number, reps: number, options: Record<string, unknown> = {}) => ({
        wordId,
        due: now,
        fsrsCard: { due: now, stability: 1, difficulty: 5, elapsedDays: 0, scheduledDays: 1, learningSteps: 0, reps, lapses: 0, state, lastReview: recent },
        starred: false,
        spellingWrongCount: 0,
        createdAt: now,
        updatedAt: now,
        ...options,
      })

      const weakWords = [
        makeWord('aaa-v15-weak-01', 'ambiguous', '含义不明确的'),
        makeWord('aaa-v15-weak-02', 'consecutive', '连续的'),
        makeWord('aaa-v15-weak-03', 'withdraw', '撤回；退出'),
      ]
      const dictationWords = [
        makeWord('aaa-v15-dictation-01', 'allocate', '分配；拨给'),
        makeWord('aaa-v15-dictation-02', 'convey', '传达；表达'),
        makeWord('aaa-v15-dictation-03', 'trigger', '触发；引起'),
      ]
      const words = fixtureMode === 'weak' ? weakWords : dictationWords
      const cards = fixtureMode === 'weak'
        ? [
            makeCard('aaa-v15-weak-01', 1, 2, { starred: true }),
            makeCard('aaa-v15-weak-02', 3, 2, { spellingWrongCount: 0 }),
            makeCard('aaa-v15-weak-03', 1, 1, { spellingWrongCount: 2, lastSpellingAt: recent }),
          ]
        : [
            makeCard('aaa-v15-dictation-01', 1, 1),
            makeCard('aaa-v15-dictation-02', 2, 3),
            makeCard('aaa-v15-dictation-03', 1, 2),
          ]

      try {
        const transaction = database.transaction(['words', 'cards', 'reviewLogs'], 'readwrite')
        const wordsStore = transaction.objectStore('words')
        const cardsStore = transaction.objectStore('cards')
        const logsStore = transaction.objectStore('reviewLogs')
        words.forEach((word) => wordsStore.put(word))
        cards.forEach((card) => cardsStore.put(card))
        if (fixtureMode === 'weak') {
          const before = (cards[2].fsrsCard as Record<string, unknown>)
          logsStore.add({ wordId: 'aaa-v15-weak-03', sessionId: 'v1.5-quality-hardening-weak', rating: 1, reviewedAt: recent, durationMs: 900, before, after: before })
          logsStore.add({ wordId: 'aaa-v15-weak-03', sessionId: 'v1.5-quality-hardening-weak', rating: 1, reviewedAt: now, durationMs: 850, before, after: before })
        }
        transaction.oncomplete = () => { database.close(); resolve() }
        transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error('Quality hardening fixture write failed')) }
        transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error('Quality hardening fixture transaction aborted')) }
      } catch (error) {
        database.close()
        reject(error)
      }
    }
  }), fixture)
}
