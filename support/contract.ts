import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020';

/**
 * Valida respostas contra o openapi.json que a própria homologação publica
 * (OpenAPI 3.1 = JSON Schema 2020-12). Se o back renomear ou tirar um campo
 * obrigatório sem atualizar o contrato, ou o contrato mudar sem o back, o
 * teste acusa.
 */
export class Contract {
  private readonly ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
  private readonly cache = new Map<string, ValidateFunction>();

  constructor(spec: object) {
    this.ajv.addSchema(spec, 'openapi');
  }

  /** "TournamentPublicResponse" ou "TournamentPublicResponse[]" para listas. */
  private validator(name: string): ValidateFunction {
    let validate = this.cache.get(name);
    if (!validate) {
      const ref = { $ref: `openapi#/components/schemas/${name.replace(/\[\]$/, '')}` };
      validate = this.ajv.compile(name.endsWith('[]') ? { type: 'array', items: ref } : ref);
      this.cache.set(name, validate);
    }
    return validate;
  }

  /** Lista de erros de schema; vazia quando a resposta bate com o contrato. */
  errors(body: unknown, schemaName: string): string[] {
    const validate = this.validator(schemaName);
    if (validate(body)) return [];
    return (validate.errors ?? []).map(e => `${e.instancePath || '(raiz)'} ${e.message}`);
  }
}
