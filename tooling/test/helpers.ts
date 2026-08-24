import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** Create a throwaway spec-repo tree from a { relativePath: content } map. */
export function makeFixture(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'specfix-'))
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(root, rel)
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, content)
  }
  return root
}
