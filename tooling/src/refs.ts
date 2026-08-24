/** Recursively collect every $ref string in a YAML-parsed tree. */
export function collectRefs(node: any): string[] {
  const refs: string[] = []
  const walk = (n: any): void => {
    if (Array.isArray(n)) { n.forEach(walk); return }
    if (n && typeof n === 'object') {
      for (const [k, v] of Object.entries(n)) {
        if (k === '$ref' && typeof v === 'string') refs.push(v)
        else walk(v)
      }
    }
  }
  walk(node)
  return refs
}
