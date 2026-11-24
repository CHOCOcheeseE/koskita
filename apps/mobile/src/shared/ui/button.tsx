import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, touchTarget } from '../theme/tokens';
import { useColors } from '../theme/use-theme';
import { Txt } from './text';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger-text';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Teks kerja saat menyimpan, mis. "Menyimpan…". */
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  loadingLabel = 'Menyimpan…',
  disabled,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const colors = useColors();
  const inactive = disabled || loading;
  const containerStyle: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: colors.primary, borderRadius: radius.input }
      : variant === 'secondary'
        ? { borderColor: colors.line, borderWidth: 1.5, borderRadius: radius.input, backgroundColor: colors.surface }
        : { alignItems: 'flex-start', paddingHorizontal: 0 };
  const textColor =
    variant === 'primary' ? 'onPrimary' : variant === 'danger-text' ? 'statusUnpaid' : 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        inactive ? styles.inactive : null,
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      <Txt variant="bodyStrong" color={textColor}>
        {loading ? loadingLabel : label}
      </Txt>
    </Pressable>
  );
}

/** Tombol mengambang berlabel teks ("+ Pengeluaran"), bukan ikon saja. */
export function Fab({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label.replace('+', 'Tambah')}
      testID={testID}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: colors.primary, shadowColor: '#000' },
        pressed ? styles.pressed : null,
      ]}
    >
      <Txt variant="bodyStrong" color="onPrimary">
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
  fab: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
