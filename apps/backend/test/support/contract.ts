import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { load } from 'js-yaml';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Json = Record<string, unknown>;

const CONTRACT_PATH = resolve(__dirname, '../../../../contracts/openapi.yaml');
const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

function closeObjects(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(closeObjects);
    return;
  }
  if (typeof node !== 'object' || node === null) return;
  const obj = node as Json;
  if (typeof obj.properties === 'object' && obj.additionalProperties === undefined) obj.additionalProperties = false;
  Object.values(obj).forEach(closeObjects);
}

const escapePointer =(s: string) => s.replace(/~/g, '~0').replace(/\//g, '~1');

/** Validator respons berdasarkan contracts/openapi.yaml (OpenAPI 3.1 = JSON Schema 2020-12). */
export class ContractChecker {
  private readonly doc: Json;
  private readonly ajv: Ajv2020;
  readonly covered = new Set<string>();

  constructor() {
    this.doc = load(readFileSync(CONTRACT_PATH, 'utf8')) as Json;
    // Salinan khusus tes: objek yang punya `properties` dianggap tertutup, jadi field di luar kontrak ketahuan.
    closeObjects((this.doc.components as Json).schemas);
    closeObjects(this.doc.paths);
    this.ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats(this.ajv);
    this.ajv.addSchema({ ...this.doc, $id: 'openapi' });
  }

  /** Semua operasi di kontrak, format "METHOD /path". */
  allOperations(): string[] {
    const ops: string[] = [];
    for (const [path, item] of Object.entries(this.doc.paths as Json)) {
      for (const m of METHODS) if ((item as Json)[m]) ops.push(`${m.toUpperCase()} ${path}`);
    }
    return ops.sort();
  }

  /** Lempar error jika status tidak ada di kontrak atau body tidak cocok dengan skemanya. */
  check(method: string, pathTemplate: string, status: number, body: unknown): void {
    const m = method.toLowerCase();
    const op = ((this.doc.paths as Json)[pathTemplate] as Json | undefined)?.[m] as Json | undefined;
    if (!op) throw new Error(`Operasi ${method} ${pathTemplate} tidak ada di kontrak`);
    this.covered.add(`${method.toUpperCase()} ${pathTemplate}`);

    const responses = op.responses as Json;
    let response = responses[String(status)] as Json | undefined;
    let pointer = `/paths/${escapePointer(pathTemplate)}/${m}/responses/${status}`;
    if (!response) throw new Error(`Status ${status} tidak didokumentasikan untuk ${method} ${pathTemplate}`);
    if (typeof response.$ref === 'string') {
      pointer = response.$ref.slice(1);
      const name = response.$ref.split('/').pop()!;
      response = ((this.doc.components as Json).responses as Json)[name] as Json;
    }

    const content = response.content as Json | undefined;
    if (!content) {
      if (body !== undefined && body !== '' && !(typeof body === 'object' && body !== null && Object.keys(body).length === 0)) {
        throw new Error(`${method} ${pathTemplate} ${status} seharusnya tanpa body`);
      }
      return;
    }
    const validate = this.ajv.compile({ $ref: `openapi#${pointer}/content/application~1json/schema` });
    if (!validate(body)) {
      throw new Error(
        `Respons ${method} ${pathTemplate} ${status} tidak cocok kontrak:\n${JSON.stringify(validate.errors, null, 2)}\nBody: ${JSON.stringify(body)}`,
      );
    }
  }
}
