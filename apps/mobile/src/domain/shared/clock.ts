/** Sumber waktu sekarang. Diinjeksi supaya aturan berbasis tanggal bisa dites. */
export interface Clock {
  now(): Date;
}
