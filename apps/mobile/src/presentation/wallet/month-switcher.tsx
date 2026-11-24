import { Pressable, StyleSheet, View } from 'react-native';

import { shiftMonth } from '@/domain/shared/wib';
import { formatMonth } from '@/shared/format';
import { touchTarget } from '@/shared/theme/tokens';
import { Txt } from '@/shared/ui/text';

/** ‹ November 2026 › — tombol › nonaktif di bulan berjalan (bulan depan belum bisa dibuka). */
export function MonthSwitcher({ month, currentMonth, onChange }: { month: string; currentMonth: string; onChange: (m: string) => void }) {
  const canNext = month < currentMonth;
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(prev)}
        accessibilityRole="button"
        accessibilityLabel={`Bulan sebelumnya, ${formatMonth(prev)}`}
        style={styles.arrow}
      >
        <Txt variant="heading" color="primary">
          ‹
        </Txt>
      </Pressable>
      <Txt variant="heading" accessibilityRole="header" style={styles.label}>
        {formatMonth(month)}
      </Txt>
      <Pressable
        onPress={() => canNext && onChange(next)}
        disabled={!canNext}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canNext }}
        accessibilityLabel={canNext ? `Bulan berikutnya, ${formatMonth(next)}` : 'Bulan berikutnya belum bisa dibuka'}
        style={[styles.arrow, !canNext ? styles.disabled : null]}
      >
        <Txt variant="heading" color="primary">
          ›
        </Txt>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  arrow: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  label: { minWidth: 170, textAlign: 'center' },
  disabled: { opacity: 0.3 },
});
