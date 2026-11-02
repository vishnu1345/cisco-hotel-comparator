// Architecture boundary checks (architecture.md §4, §8.2, §10.4).
// These read source files as text; they do not execute application code.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(process.cwd(), 'src')
const sourceFiles = readdirSync(SRC, { recursive: true })
  .filter((file) => /\.(js|jsx)$/.test(file))
  .map((file) => ({ file, text: readFileSync(join(SRC, file), 'utf8') }))

const importLines = (text) => text.split('\n').filter((line) => /^\s*import\s/.test(line))
// Drops /* … */ and // comments so documentation that *mentions* a forbidden name is not flagged.
const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

describe('architecture boundaries', () => {
  it('no runtime module imports the expected-results fixture or anything under tests/', () => {
    for (const { file, text } of sourceFiles) {
      for (const line of importLines(text)) {
        expect(line, file).not.toMatch(/expectedResults|fixtures|tests\//)
      }
    }
  })

  it('domain modules do not import React or the DOM', () => {
    for (const { file, text } of sourceFiles.filter((f) => f.file.startsWith('domain'))) {
      for (const line of importLines(text)) {
        expect(line, file).not.toMatch(/react/i)
      }
      expect(text, file).not.toMatch(/\bdocument\.|\bwindow\./)
    }
  })

  it('calculation and ranking code never reads map coordinates', () => {
    for (const name of ['calculations.js', 'ranking.js']) {
      const code = withoutComments(readFileSync(join(SRC, 'domain', name), 'utf8'))
      expect(code, name).not.toMatch(/map_position|\.x\b|\.y\b/)
    }
  })
})
