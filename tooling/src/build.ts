import type { SpecSource } from './loader.js'

export function buildDocument(spec: SpecSource, info: any): any {
  const methods = [...spec.methods]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => {
      const y = m.yaml
      const method: any = {
        name: y.name,
        summary: y.summary,
        description: m.md,
        tags: [{ name: m.transport }],
        paramStructure: 'by-position',
        params: y.params ?? [],
        result: y.result,
        errors: y.errors ?? [],
        examples: y.examples ?? [],
      }
      if (y.status === 'deprecated') method.deprecated = true
      if (y.status) method['x-solana-status'] = y.status
      if (y.implementations) method['x-solana-implementations'] = y.implementations
      if (y.notification) method['x-notification'] = y.notification
      return method
    })

  // The OpenRPC errorObject is `additionalProperties: false` and, unlike the
  // root object and methodObject, allows no `^x-` extensions. So component
  // errors stay strictly {code, message} and everything we want to say about
  // them rides in a root-level x-solana-errors map keyed by error name.
  const errors: Record<string, any> = {}
  const errorExtensions: Record<string, any> = {}
  for (const [name, e] of Object.entries<any>(spec.errors)) {
    errors[name] = { code: e.code, message: e.message }
    const ext: any = {}
    if (e.description) ext.description = e.description
    if (e.data) ext.dataSchema = e.data
    if (e.emittedBy) ext.emittedBy = e.emittedBy
    if (Object.keys(ext).length > 0) errorExtensions[name] = ext
  }

  return {
    openrpc: '1.2.6',
    info: {
      title: info.title,
      version: info.version,
      ...(info.description ? { description: info.description } : {}),
      ...(info.license ? { license: info.license } : {}),
    },
    methods,
    components: { schemas: spec.schemas, errors },
    ...(Object.keys(errorExtensions).length > 0
      ? { 'x-solana-errors': errorExtensions }
      : {}),
  }
}
