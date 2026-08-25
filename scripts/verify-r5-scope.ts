import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const baseline = process.argv[2] ?? '20ffd8aec30ea4b5ce2b4479f57fc5ebe59e6b8b'
const trackedChanges = execFileSync('git', ['diff', '--name-only', baseline], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)
const untrackedChanges = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)
const changedFiles = [...new Set([...trackedChanges, ...untrackedChanges])].sort()

const allowedExact = new Set([
  'FINAL_V1_3_CORE_LEARNING_REPORT.md',
  'LULA_FINAL_REPLY.md',
  'package.json',
  'pnpm-lock.yaml',
])
const allowedPrefixes = [
  'audit/v1.3-context-final-semantic/',
  'audit/v1.3-context-human-quality/',
  'audit/v1.3-context-quality/',
  'data-source/examples/',
  'scripts/',
  'tests/unit/',
  'public/data/cet6-vocab.v1.json',
]
const frozenViolations = changedFiles.filter(
  (file) => !allowedExact.has(file) && !allowedPrefixes.some((prefix) => file.startsWith(prefix)),
)
const sourceChanges = changedFiles.filter((file) => file.startsWith('src/'))
const motionOrFsrsChanges = changedFiles.filter((file) =>
  /(^|\/)(motion|fsrs)(\/|[-.])|\.(css|scss)$/.test(file),
)
const result = {
  version: 1,
  baseline,
  changedFiles,
  allowedExact: [...allowedExact],
  allowedPrefixes,
  sourceChanges,
  motionOrFsrsChanges,
  frozenViolations,
  uiMotionFsrsFrozen: sourceChanges.length === 0 && motionOrFsrsChanges.length === 0 && frozenViolations.length === 0,
  note: 'Round 5 changes are limited to semantic review, durable curation, rebuild artifacts, validation, tests, and audit evidence.',
}

const auditRoot = resolve(root, 'audit/v1.3-context-final-semantic')
await mkdir(auditRoot, { recursive: true })
await writeFile(resolve(auditRoot, 'scope-check-r5.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')

if (!result.uiMotionFsrsFrozen) {
  throw new Error(`Round 5 frozen-scope violation: ${[...sourceChanges, ...motionOrFsrsChanges, ...frozenViolations].join(', ')}`)
}
console.log(`Round 5 scope check PASS: ${changedFiles.length} changed files; UI/Motion/FSRS frozen.`)
