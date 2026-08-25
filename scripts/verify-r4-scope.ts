import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const baseline = process.argv[2] ?? '6bd6fb4a208bcfed07cafff06645b36fc4dc59a9'
const trackedChanges = execFileSync('git', ['diff', '--name-only', baseline], { cwd: root, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean)
const untrackedChanges = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean)
const changedFiles = [...new Set([...trackedChanges, ...untrackedChanges])].sort()
const allowedExact = new Set(['package.json', 'pnpm-lock.yaml', 'FINAL_V1_3_CORE_LEARNING_REPORT.md', 'LULA_FINAL_REPLY.md'])
const allowedPrefixes = [
  'audit/v1.3-context-quality/',
  'audit/v1.3-context-human-quality/',
  'data-source/examples/',
  'scripts/',
  'tests/',
  'public/data/cet6-vocab.v1.json',
]
const frozenViolations = changedFiles.filter((file) => !allowedExact.has(file) && !allowedPrefixes.some((prefix) => file.startsWith(prefix)))
const result = {
  version: 1,
  baseline,
  changedFiles,
  allowedExact: [...allowedExact],
  allowedPrefixes,
  frozenViolations,
  uiMotionFrozen: frozenViolations.length === 0,
}
const auditRoot = resolve(root, 'audit/v1.3-context-human-quality')
await mkdir(auditRoot, { recursive: true })
await writeFile(resolve(auditRoot, 'scope-check.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
if (frozenViolations.length) throw new Error(`Round 4 scope violation: ${frozenViolations.join(', ')}`)
console.log(`Round 4 scope check PASS: ${changedFiles.length} changed files; UI/Motion frozen.`)
