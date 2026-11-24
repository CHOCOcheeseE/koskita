/** Satu halaman hasil paginasi kursor. `nextCursor` null = tidak ada halaman berikutnya. */
export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};
