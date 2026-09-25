import { expect, type Page } from '@playwright/test'

export const readabilityLongWords = ['abnormal', 'characteristic', 'extraordinary', 'acknowledgement', 'environmentally', 'readabilityfixturelongword']

export async function prepareReadabilityPage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const resetKey = 'cet6-focus:v1.4.1-readability-reset'
    if (!sessionStorage.getItem(resetKey)) {
      sessionStorage.setItem(resetKey, '1')
      indexedDB.deleteDatabase('cet6-focus')
    }
  })
}

export async function completeOnboarding(page: Page): Promise<void> {
  await page.goto('/#/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: '每天打开，都知道下一步做什么。' })).toBeVisible({ timeout: 30_000 })
  for (let step = 0; step < 3; step += 1) await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /开始备考/ }).click()
  await expect(page.locator('.immersive-home__featured-word')).toBeVisible({ timeout: 30_000 })
}

async function seedWarmDatabase(page: Page): Promise<void> {
  await page.route('**/src/main.tsx*', (route) => route.abort())
  try {
    await page.goto('/?readability-seed=1', { waitUntil: 'domcontentloaded' })
    const words = await page.evaluate(async () => {
      const entryScript = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')).find((script) => script.src.includes('/src/main.tsx'))
      const vocabularyUrl = new URL(entryScript?.src ?? '/src/main.tsx', document.baseURI)
      vocabularyUrl.pathname = vocabularyUrl.pathname.replace(/\/src\/main\.tsx.*$/, '/data/cet6-vocab.v1.json')
      vocabularyUrl.search = ''
      const response = await fetch(vocabularyUrl, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Readability warm vocabulary fetch failed: ${response.status}`)
      return ((await response.json()) as Array<Record<string, unknown>>).slice(0, 8)
    })
    await page.evaluate(async (seedWords: Array<Record<string, unknown>>) => {
      const now = new Date().toISOString()
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('cet6-focus', 2)
        request.onerror = () => reject(request.error ?? new Error('Readability warm database open failed'))
        request.onupgradeneeded = () => {
          const database = request.result
          const wordsStore = database.createObjectStore('words', { keyPath: 'id' })
          wordsStore.createIndex('word', 'word', { unique: false })
          wordsStore.createIndex('examTags', 'examTags', { unique: false, multiEntry: true })
          const cardsStore = database.createObjectStore('cards', { keyPath: 'wordId' })
          cardsStore.createIndex('due', 'due', { unique: false })
          cardsStore.createIndex('state', 'state', { unique: false })
          cardsStore.createIndex('starred', 'starred', { unique: false })
          cardsStore.createIndex('spellingWrongCount', 'spellingWrongCount', { unique: false })
          const logsStore = database.createObjectStore('reviewLogs', { keyPath: 'id', autoIncrement: true })
          logsStore.createIndex('wordId', 'wordId', { unique: false })
          logsStore.createIndex('sessionId', 'sessionId', { unique: false })
          logsStore.createIndex('reviewedAt', 'reviewedAt', { unique: false })
          logsStore.createIndex('rating', 'rating', { unique: false })
          const sessionsStore = database.createObjectStore('sessions', { keyPath: 'id' })
          sessionsStore.createIndex('type', 'type', { unique: false })
          sessionsStore.createIndex('startedAt', 'startedAt', { unique: false })
          database.createObjectStore('settings', { keyPath: 'id' })
        }
        request.onsuccess = () => {
          const database = request.result
          const transaction = database.transaction(['words', 'cards', 'settings'], 'readwrite')
          const wordsStore = transaction.objectStore('words')
          const cardsStore = transaction.objectStore('cards')
          const card = (wordId: string) => ({ wordId, due: now, fsrsCard: { due: now, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, learningSteps: 0, reps: 0, lapses: 0, state: 0 }, starred: false, spellingWrongCount: 0, createdAt: now, updatedAt: now })
          for (const word of seedWords) {
            wordsStore.put({ ...word, archived: false })
            cardsStore.put(card(String(word.id)))
          }
          transaction.objectStore('settings').put({ id: 'app', theme: 'light', reducedMotion: false, backgroundMode: 'fixed', backgroundId: 'aurora-01', lastBackgroundId: 'aurora-01', dailyNewWords: 1, dailyMinutes: 30, targetRetention: 0.9, pronunciation: 'en-US', autoplayPronunciation: false, onboarded: true, dataVersion: 'cet6-vocab.v1', updatedAt: now })
          transaction.oncomplete = () => { database.close(); resolve() }
          transaction.onerror = () => reject(transaction.error ?? new Error('Readability warm database seed failed'))
        }
      })
    }, words)
  } finally {
    await page.unroute('**/src/main.tsx*')
  }
}

export async function bootReadability(page: Page, projectName: string): Promise<void> {
  if (projectName === 'webkit-readability') {
    await seedWarmDatabase(page)
    await page.goto('/#/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.immersive-home__featured-word')).toBeVisible({ timeout: 20_000 })
    return
  }
  await completeOnboarding(page)
}

export async function writeSettings(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.evaluate((settingsPatch) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('Readability settings database open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('settings', 'readwrite')
      const store = transaction.objectStore('settings')
      const read = store.get('app')
      read.onerror = () => reject(read.error ?? new Error('Readability settings read failed'))
      read.onsuccess = () => store.put({ ...read.result, ...settingsPatch, updatedAt: new Date().toISOString() })
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Readability settings write failed'))
    }
  }), patch)
}

export async function seedReadabilityWord(page: Page, word: string, detailHeavy = false): Promise<void> {
  await page.evaluate(({ targetWord, isDetailHeavy }) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('cet6-focus')
    request.onerror = () => reject(request.error ?? new Error('Readability fixture database open failed'))
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction(['words', 'cards', 'settings'], 'readwrite')
      const words = transaction.objectStore('words')
      const cards = transaction.objectStore('cards')
      const settings = transaction.objectStore('settings')
      const now = new Date().toISOString()
      const future = '2099-01-01T00:00:00.000Z'
      const wordId = 'aaa-readability-current'
      const meanings = isDetailHeavy
        ? ['可读性修复测试词', '用于验证自然页面滚动', '用于验证 CTA 可达']
        : ['可读性测试词']
      const examples = isDetailHeavy
        ? [1, 2, 3, 4, 5].map((index) => ({ en: `The ${targetWord} example sentence ${index} keeps the target word in a readable learning context.`, zh: `这是第 ${index} 条测试例句。` }))
        : [{ en: `A clear sentence places ${targetWord} in an everyday learning context.`, zh: '这是一条可读的测试例句。' }]
      const fixture = {
        id: wordId,
        word: targetWord,
        phonetic: '/ˈtest/',
        pos: ['adj.'],
        meaningZh: meanings,
        definitionEn: isDetailHeavy ? ['A fixture used to verify readable learning surfaces and page scrolling.'] : ['A fixture used to verify readable learning surfaces.'],
        collocations: isDetailHeavy ? ['readable learning surface', 'semantic token pairing', 'natural page scroll'] : ['readable learning surface'],
        examples,
        wordForms: isDetailHeavy ? { noun: `${targetWord}ness`, adverb: `${targetWord}ly`, note: 'fixture form' } : undefined,
        examTags: ['READABILITY_FIXTURE'],
        source: 'v1.4.1 readability fixture',
        sourceLicense: 'Internal test fixture',
        archived: false,
      }
      const customCard = {
        wordId,
        due: now,
        fsrsCard: { due: now, stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, learningSteps: 0, reps: 0, lapses: 0, state: 0 },
        starred: false,
        spellingWrongCount: 0,
        createdAt: now,
        updatedAt: now,
      }
      const allCards = cards.getAll()
      allCards.onerror = () => reject(allCards.error ?? new Error('Readability cards read failed'))
      allCards.onsuccess = () => {
        for (const card of allCards.result as Array<Record<string, unknown>>) {
          const fsrsCard = card.fsrsCard as Record<string, unknown>
          cards.put({ ...card, due: future, fsrsCard: { ...fsrsCard, due: future, state: 0, reps: 0, lapses: 0, stability: 0, difficulty: 0 }, updatedAt: now })
        }
        words.put(fixture)
        cards.put(customCard)
        const currentSettings = settings.get('app')
        currentSettings.onerror = () => reject(currentSettings.error ?? new Error('Readability settings read failed'))
        currentSettings.onsuccess = () => settings.put({ ...currentSettings.result, dailyNewWords: 1, backgroundMode: 'off', updatedAt: now })
      }
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => reject(transaction.error ?? new Error('Readability fixture write failed'))
    }
  }), { targetWord: word, isDetailHeavy: detailHeavy })
}

export async function openStudy(page: Page): Promise<void> {
  if (page.url().includes('#/study')) await page.reload({ waitUntil: 'domcontentloaded' })
  else await page.goto('/#/study', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.learning-shell')).toBeVisible({ timeout: 20_000 })
  try {
    await expect(page.getByRole('region', { name: '回忆判断' })).toBeVisible({ timeout: 20_000 })
  } catch (error) {
    const diagnostics = await page.evaluate(() => new Promise<Record<string, unknown>>((resolve) => {
      const request = indexedDB.open('cet6-focus')
      request.onerror = () => resolve({ error: request.error?.message ?? 'indexedDB open failed' })
      request.onsuccess = () => {
        const database = request.result
        const transaction = database.transaction(['words', 'cards', 'settings'], 'readonly')
        const words = transaction.objectStore('words').getAll()
        const cards = transaction.objectStore('cards').getAll()
        const settings = transaction.objectStore('settings').get('app')
        transaction.oncomplete = () => {
          const targetWord = (words.result as Array<{ id: string; word: string }>).find((word) => word.id.startsWith('aaa-readability-'))
          const targetCard = (cards.result as Array<{ wordId: string; due: string; fsrsCard: { state: number } }>).find((card) => card.wordId.startsWith('aaa-readability-'))
          database.close()
          resolve({ wordCount: words.result.length, cardCount: cards.result.length, targetWord, targetCard, settings: settings.result })
        }
      }
    }))
    throw new Error(`Learning queue failed; diagnostics=${JSON.stringify(diagnostics)}; original=${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function openMeaning(page: Page): Promise<void> {
  await openStudy(page)
  await page.getByRole('button', { name: /^不认识/ }).click()
  if (await page.getByRole('region', { name: '语境提示' }).isVisible().catch(() => false)) {
    await page.getByRole('button', { name: '查看核心词义' }).click()
  }
  await expect(page.getByRole('region', { name: '核心词义' })).toBeVisible()
}

export async function openContext(page: Page): Promise<void> {
  await openStudy(page)
  await page.getByRole('button', { name: /^不认识/ }).click()
  await expect(page.getByRole('region', { name: '语境提示' })).toBeVisible()
}

export async function openDetail(page: Page): Promise<void> {
  await openMeaning(page)
  await page.getByRole('button', { name: '扩展理解' }).click()
  await expect(page.getByRole('region', { name: '扩展理解' })).toBeVisible()
}

export async function readAtmosphereMetrics(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const shell = document.querySelector('.learning-shell')
    const stageNames = ['base', 'context', 'meaning', 'detail'] as const
    function alphaValues(backgroundImage: string): number[] {
      return Array.from(backgroundImage.matchAll(/rgba?\(([^)]+)\)/g)).flatMap((match) => {
        const channels = match[1].split(/[\s,]+/).filter(Boolean)
        const slashIndex = channels.indexOf('/')
        const alpha = slashIndex >= 0 ? Number.parseFloat(channels[slashIndex + 1]) : channels.length >= 4 ? Number.parseFloat(channels[3]) : 1
        return Number.isFinite(alpha) ? [alpha] : []
      })
    }
    return {
      state: shell?.getAttribute('data-learning-state') ?? '',
      activeClass: Array.from(shell?.classList ?? []).find((name) => name.startsWith('learning-shell--')) ?? '',
      layers: Object.fromEntries(stageNames.map((name) => {
        const layer = document.querySelector(`.learning-shell__atmosphere-layer--${name}`)
        const style = layer ? getComputedStyle(layer) : null
        const backgroundImage = style?.backgroundImage ?? ''
        return [name, { opacity: style?.opacity ?? '', backgroundImage, scrimAlpha: Math.max(...alphaValues(backgroundImage), 0) }]
      })),
    }
  })
}

export async function readSafeAreaMetrics(page: Page, expectedSafeLeft = 0, expectedSafeRight = 0): Promise<Record<string, unknown>> {
  return page.evaluate(({ safeLeft, safeRight }) => {
    const inner = document.querySelector('.learning-shell__inner')
    const selectors = [
      '.learning-topbar',
      '.learning-word-header',
      '.learning-word-header h1',
      '.learning-word-header .audio-button',
      '.learning-word-header .icon-button',
      '.learning-reading-surface',
      '.learning-stage-actions__primary',
    ]
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const innerStyle = inner ? getComputedStyle(inner) : null
    const fixture = document.querySelector('[data-r1-safe-area-fixture]')
    const fixtureStyle = fixture ? getComputedStyle(fixture) : null
    const rects = selectors.flatMap((selector) => {
      const element = document.querySelector(selector)
      if (!element) return []
      const rect = element.getBoundingClientRect()
      return [{ selector, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }]
    })
    const collisions = rects.filter((rect) => rect.left < safeLeft - 1 || rect.right > viewport.width - safeRight + 1)
    return {
      viewport,
      safeLeft,
      safeRight,
      fixturePaddingLeft: fixtureStyle?.paddingLeft ?? '',
      fixturePaddingRight: fixtureStyle?.paddingRight ?? '',
      paddingInlineStart: innerStyle?.paddingLeft ?? '',
      paddingInlineEnd: innerStyle?.paddingRight ?? '',
      rects,
      collisions,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  }, { safeLeft: expectedSafeLeft, safeRight: expectedSafeRight })
}

export async function readSurfaceMetrics(page: Page): Promise<Record<string, unknown>> {
  return page.locator('.learning-reading-surface').evaluate((surface) => {
    function parseColor(value: string): [number, number, number, number] | null {
      const rgb = value.match(/rgba?\(([^)]+)\)/i)
      if (rgb) {
        const values = rgb[1].split(',').map((part) => Number.parseFloat(part.trim()))
        return [values[0], values[1], values[2], values[3] ?? 1]
      }
      const hex = value.trim().match(/^#([0-9a-f]{3,8})$/i)
      if (!hex) return null
      const raw = hex[1]
      const expanded = raw.length <= 4 ? raw.split('').map((part) => `${part}${part}`).join('') : raw
      return [Number.parseInt(expanded.slice(0, 2), 16), Number.parseInt(expanded.slice(2, 4), 16), Number.parseInt(expanded.slice(4, 6), 16), expanded.length >= 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1]
    }
    function composite(foreground: [number, number, number, number] | null, background: [number, number, number, number] | null): [number, number, number] | null {
      if (!foreground || !background) return null
      const alpha = foreground[3] + background[3] * (1 - foreground[3])
      if (!alpha) return null
      return [
        (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
      ]
    }
    function luminance(color: [number, number, number] | null): number | null {
      if (!color) return null
      const channels = color.map((channel) => channel / 255).map((channel) => channel <= .03928 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
      return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2]
    }
    function contrast(text: string, background: string): number | null {
      const bg = parseColor(background)
      const fg = composite(parseColor(text), bg)
      const bgRgb = bg ? [bg[0], bg[1], bg[2]] as [number, number, number] : null
      const foregroundLum = luminance(fg)
      const backgroundLum = luminance(bgRgb)
      if (foregroundLum === null || backgroundLum === null) return null
      return (Math.max(foregroundLum, backgroundLum) + .05) / (Math.min(foregroundLum, backgroundLum) + .05)
    }
    const style = getComputedStyle(surface)
    const primaryElement = surface.querySelector('.learning-core-meaning, .learning-example') as HTMLElement | null
    const secondaryElement = surface.querySelector('.learning-example-block p, .learning-context-surface__note, .learning-detail-block p, .learning-detail-block li, .learning-detail-block dd') as HTMLElement | null
    const accentElement = surface.querySelector('.learning-section-kicker, .learning-pos, .learning-detail-block > span') as HTMLElement | null
    const primaryStyle = primaryElement ? getComputedStyle(primaryElement) : style
    const secondaryStyle = secondaryElement ? getComputedStyle(secondaryElement) : style
    const accentStyle = accentElement ? getComputedStyle(accentElement) : style
    const rect = surface.getBoundingClientRect()
    return {
      tone: surface.getAttribute('data-reading-tone'),
      readingTokens: {
        bg: style.getPropertyValue('--reading-bg').trim(),
        primary: style.getPropertyValue('--reading-primary').trim(),
        secondary: style.getPropertyValue('--reading-secondary').trim(),
        tertiary: style.getPropertyValue('--reading-tertiary').trim(),
        accent: style.getPropertyValue('--reading-accent').trim(),
        separator: style.getPropertyValue('--reading-separator').trim(),
        highlightBg: style.getPropertyValue('--reading-highlight-bg').trim(),
        highlightText: style.getPropertyValue('--reading-highlight-text').trim(),
      },
      background: style.backgroundColor,
      primary: primaryStyle.color,
      secondary: secondaryStyle.color,
      accent: accentStyle.color,
      primaryContrast: contrast(primaryStyle.color, style.backgroundColor),
      secondaryContrast: contrast(secondaryStyle.color, style.backgroundColor),
      accentContrast: contrast(accentStyle.color, style.backgroundColor),
      primaryFontSize: primaryStyle.fontSize,
      secondaryFontSize: secondaryStyle.fontSize,
      accentFontSize: accentStyle.fontSize,
      borderColor: style.borderTopColor,
      borderWidth: style.borderTopWidth,
      overflowY: style.overflowY,
      maxHeight: style.maxHeight,
      surfaceHeight: rect.height,
      surfaceScrollHeight: surface.scrollHeight,
      surfaceClientHeight: surface.clientHeight,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollHeight: document.documentElement.scrollHeight,
      documentClientHeight: document.documentElement.clientHeight,
    }
  })
}

export async function readLayoutMetrics(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const heading = document.querySelector('.learning-word-header h1') as HTMLElement | null
    const stage = document.querySelector('.learning-stage') as HTMLElement | null
    const surface = document.querySelector('.learning-reading-surface') as HTMLElement | null
    const action = document.querySelector('.learning-stage-actions__primary') as HTMLElement | null
    const headingStyle = heading ? getComputedStyle(heading) : null
    const stageStyle = stage ? getComputedStyle(stage) : null
    const surfaceStyle = surface ? getComputedStyle(surface) : null
    const rect = heading?.getBoundingClientRect()
    return {
      word: heading?.textContent?.trim() ?? '',
      headerClass: heading?.closest('.learning-word-header')?.className ?? '',
      fontSize: headingStyle?.fontSize ?? '',
      letterSpacing: headingStyle?.letterSpacing ?? '',
      overflowWrap: headingStyle?.overflowWrap ?? '',
      wordBreak: headingStyle?.wordBreak ?? '',
      headingWidth: rect?.width ?? 0,
      headingScrollWidth: heading?.scrollWidth ?? 0,
      headingClientWidth: heading?.clientWidth ?? 0,
      headingHeight: rect?.height ?? 0,
      stageOverflowY: stageStyle?.overflowY ?? '',
      surfaceOverflowY: surfaceStyle?.overflowY ?? '',
      surfaceMaxHeight: surfaceStyle?.maxHeight ?? '',
      actionBottom: action?.getBoundingClientRect().bottom ?? 0,
      actionTop: action?.getBoundingClientRect().top ?? 0,
      actionVisible: Boolean(action && action.getBoundingClientRect().width > 0 && action.getBoundingClientRect().height > 0),
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }
  })
}
