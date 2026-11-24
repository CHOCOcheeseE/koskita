/** Format rupiah untuk pesan error, contoh 10000 -> "Rp10.000". */
export function formatRupiah(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const digits = Math.abs(Math.trunc(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}Rp${digits}`;
}
