import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatRupiah, rupiahSpeech } from '../format';
import type { TypographyVariant } from '../theme/tokens';
import { useColors, useReduceMotion } from '../theme/use-theme';
import { Txt, type TxtProps } from './text';

type AmountProps = Omit<TxtProps, 'children'> & {
  value: number;
  sign?: '+' | '-';
  variant?: TypographyVariant;
};

/** Nominal `Rp1.500.000`, angka tabular, dibacakan "1 juta 500 ribu rupiah". */
export function Amount({ value, sign, variant = 'bodyStrong', ...rest }: AmountProps) {
  const speech = `${sign === '+' ? 'tambah ' : sign === '-' ? 'kurang ' : ''}${rupiahSpeech(value)}`;
  return (
    <Txt variant={variant} tabular accessibilityLabel={speech} {...rest}>
      {formatRupiah(value, sign)}
    </Txt>
  );
}

/** Animasi hitung ke nilai baru (≤ 400 ms), mati jika kurangi gerakan aktif. */
function useCountTo(value: number): number {
  const reduceMotion = useReduceMotion();
  const [shown, setShown] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (reduceMotion || from === value) {
      setShown(value);
      return;
    }
    const start = Date.now();
    const duration = 400;
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion]);
  return shown;
}

type HighlightAmountProps = {
  value: number;
  /** `false` untuk menampilkan angka tanpa sapuan stabilo. */
  highlighted?: boolean;
  label?: string;
  testID?: string;
};

/** Angka terpenting di layar dengan sapuan stabilo (satu per layar). */
export function HighlightAmount({ value, highlighted = true, label, testID }: HighlightAmountProps) {
  const colors = useColors();
  const shown = useCountTo(value);
  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`${label ? `${label}, ` : ''}${rupiahSpeech(value)}`}
      testID={testID}
    >
      {highlighted ? <View style={[styles.stroke, { backgroundColor: colors.highlight }]} /> : null}
      <Txt variant="amountXL" tabular style={highlighted ? { color: colors.onHighlight } : null}>
        {formatRupiah(shown)}
      </Txt>
    </View>
  );
}

/** Teks besar dengan sapuan stabilo (dipakai kode undangan). */
export function HighlightText({ children, accessibilityLabel }: { children: string; accessibilityLabel?: string }) {
  const colors = useColors();
  return (
    <View style={styles.wrap} accessible accessibilityLabel={accessibilityLabel}>
      <View style={[styles.stroke, { backgroundColor: colors.highlight }]} />
      <Txt variant="amountXL" style={[styles.spaced, { color: colors.onHighlight }]}>
        {children}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start', paddingHorizontal: 4 },
  stroke: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 2,
    height: '60%',
    borderRadius: 4,
    transform: [{ rotate: '-2deg' }],
  },
  spaced: { letterSpacing: 6, fontFamily: 'AtkinsonHyperlegible_700Bold' },
});
