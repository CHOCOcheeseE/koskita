// Deklarasi minimal global Jest supaya `tsc --noEmit` mobile tetap hijau tanpa @types/jest.
// Tes dijalankan dengan Jest milik backend: lihat docs/qa/README.md.
interface QaMatchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeNull(): void;
  toHaveBeenCalledTimes(count: number): void;
  toThrow(expected?: unknown): void;
  rejects: { toMatchObject(expected: unknown): Promise<void> };
  not: QaMatchers;
}

interface QaMock {
  (...args: unknown[]): unknown;
  mock: { calls: unknown[][] };
}

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => unknown): void;
declare function beforeEach(fn: () => unknown): void;
declare function afterEach(fn: () => unknown): void;
declare function expect(actual: unknown): QaMatchers;
declare const jest: { fn(impl?: (...args: never[]) => unknown): QaMock };
