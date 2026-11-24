import { ValidationError, ValidationPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { validationFailed } from '../domain/app-error';
import { isCalendarDate, isIsoDateTime, isMonth } from '../time/wib';

const MESSAGES: Record<string, (field: string, args: unknown[]) => string> = {
  whitelistValidation: (f) => `Field ${f} tidak dikenal`,
  isDefined: (f) => `${f} wajib diisi`,
  isNotEmpty: (f) => `${f} wajib diisi`,
  isString: (f) => `${f} harus berupa teks`,
  isInt: (f) => `${f} harus bilangan bulat`,
  isBoolean: (f) => `${f} harus true atau false`,
  isEmail: (f) => `${f} harus alamat email yang valid`,
  isUUID: (f) => `${f} harus UUID yang valid`,
  isIn: (f, a) => `${f} harus salah satu dari: ${(a[0] as unknown[]).join(', ')}`,
  isEnum: (f) => `${f} berisi nilai yang tidak dikenal`,
  isArray: (f) => `${f} harus berupa daftar`,
  arrayMinSize: (f, a) => `${f} minimal berisi ${String(a[0])} item`,
  arrayMaxSize: (f, a) => `${f} maksimal berisi ${String(a[0])} item`,
  arrayUnique: (f) => `${f} tidak boleh berisi nilai dobel`,
  min: (f, a) => `${f} minimal ${String(a[0])}`,
  max: (f, a) => `${f} maksimal ${String(a[0])}`,
  minLength: (f, a) => `${f} minimal ${String(a[0])} karakter`,
  maxLength: (f, a) => `${f} maksimal ${String(a[0])} karakter`,
  matches: (f) => `Format ${f} tidak valid`,
  nestedValidation: (f) => `${f} tidak valid`,
};

function flatten(errors: ValidationError[], parent = '', out: Record<string, string> = {}): Record<string, string> {
  for (const err of errors) {
    const path = parent ? (/^\d+$/.test(err.property) ? `${parent}[${err.property}]` : `${parent}.${err.property}`) : err.property;
    if (err.constraints && !out[path]) {
      const [key, raw] = Object.entries(err.constraints)[0];
      const translate = MESSAGES[key];
      out[path] = translate ? translate(path, extractArgs(raw)) : raw;
    }
    if (err.children?.length) flatten(err.children, path, out);
  }
  return out;
}

/** class-validator menulis argumen di pesan bawaan; ambil angka/daftar pertama untuk pesan Indonesia. */
function extractArgs(raw: string): unknown[] {
  const list = /one of the following values: (.+)$/.exec(raw);
  if (list) return [list[1].split(', ')];
  const num = /(-?\d+(?:\.\d+)?)/.exec(raw);
  return num ? [num[1]] : [];
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    stopAtFirstError: true,
    exceptionFactory: (errors) => validationFailed(flatten(errors)),
  });
}

/** Lempar VALIDATION_FAILED jika body PATCH kosong (`minProperties: 1`). */
export function assertHasFields(dto: object): void {
  const hasAny = Object.values(dto).some((v) => v !== undefined);
  if (!hasAny) throw validationFailed({ body: 'Minimal satu field harus dikirim' });
}

/** Buang spasi awal/akhir untuk string. */
export const Trim = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

/** Trim lalu ubah string kosong jadi `null` (field opsional yang bisa dihapus). */
export const TrimToNull = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });

function custom(name: string, test: (v: unknown) => boolean, message: (f: string) => string, options?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name,
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) => test(value),
        defaultMessage: (args: ValidationArguments) => message(args.property),
      },
    });
  };
}

export const IsCalendarDate = (options?: ValidationOptions) =>
  custom('isCalendarDate', (v) => typeof v === 'string' && isCalendarDate(v), (f) => `${f} harus tanggal format YYYY-MM-DD`, options);

export const IsMonth = (options?: ValidationOptions) =>
  custom('isMonth', (v) => typeof v === 'string' && isMonth(v), (f) => `${f} harus bulan format YYYY-MM`, options);

export const IsDateTime = (options?: ValidationOptions) =>
  custom(
    'isDateTime',
    (v) => typeof v === 'string' && isIsoDateTime(v),
    (f) => `${f} harus tanggal dan jam ISO 8601, contoh 2026-11-24T03:00:00Z`,
    options,
  );

/** Panjang dalam byte UTF-8 (bcrypt hanya memakai 72 byte pertama). */
export const MaxUtf8Bytes = (max: number, options?: ValidationOptions) =>
  custom(
    'maxUtf8Bytes',
    (v) => typeof v !== 'string' || utf8Length(v) <= max,
    (f) => `${f} maksimal ${max} byte (huruf beraksen atau emoji dihitung lebih dari 1)`,
    options,
  );

export function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length;
}

export const TIME_RE =/^([01][0-9]|2[0-3]):[0-5][0-9]$/;
export const isPresent = (field: string) => (o: Record<string, unknown>) => o[field] !== undefined;
