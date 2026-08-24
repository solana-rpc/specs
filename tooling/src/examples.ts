import { Ajv, type ValidateFunction } from 'ajv'
import addFormatsModule from 'ajv-formats'

// ajv-formats ships CommonJS; under NodeNext ESM the plugin arrives on `.default`.
const addFormats = addFormatsModule.default

/**
 * Compile a schema that may contain '#/components/schemas/X' refs by wrapping
 * it together with the full shared-schema set so the refs resolve locally.
 */
export function compileWithComponents(
  schema: any,
  schemas: Record<string, any>,
): ValidateFunction {
  const ajv = new Ajv({ strict: false, allowUnionTypes: true })
  addFormats(ajv)
  return ajv.compile({ allOf: [schema], components: { schemas } })
}
