import type { ShareStatus } from '@/domain/split-bill/split-bill';

/** Teks lencana status bagian (kosakata desain 9.1). */
export const SHARE_STATUS_LABEL: Record<ShareStatus, string> = {
  belum_bayar: 'Belum bayar',
  menunggu_konfirmasi: 'Nunggu konfirmasi',
  lunas: 'Lunas',
};
