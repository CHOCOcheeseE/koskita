import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Alert, Animated, Platform, StyleSheet, View } from 'react-native';

import { radius, spacing } from '../theme/tokens';
import { useColors, useReduceMotion } from '../theme/use-theme';
import { Button } from './button';
import { Txt } from './text';

/** Kalimat ajakan + satu tombol. Tanpa ilustrasi. */
export function EmptyState({
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  testID,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  testID?: string;
}) {
  return (
    <View style={styles.empty} testID={testID}>
      <Txt variant="body" color="inkMuted">
        {message}
      </Txt>
      {actionLabel && onAction ? (
        <View style={styles.emptyActions}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
          {secondaryLabel && onSecondary ? (
            <Button label={secondaryLabel} onPress={onSecondary} variant="secondary" />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Panel error + Coba lagi. Varian `bar` = bilah tipis di atas data lama. */
export function ErrorPanel({ message, onRetry, bar }: { message: string; onRetry?: () => void; bar?: boolean }) {
  const colors = useColors();
  return (
    <View
      style={[styles.error, bar ? styles.errorBar : null, { backgroundColor: colors.statusUnpaidSoft }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Txt variant={bar ? 'label' : 'body'} style={styles.flex}>
        {message}
      </Txt>
      {onRetry ? <Button label="Coba lagi" onPress={onRetry} variant={bar ? 'text' : 'secondary'} /> : null}
    </View>
  );
}

/** Bilah info di atas form/tombol. `tone` menentukan latar lembut. */
export function InfoBar({ message, tone = 'pending' }: { message: string; tone?: 'pending' | 'unpaid' | 'paid' }) {
  const colors = useColors();
  const bg = tone === 'unpaid' ? colors.statusUnpaidSoft : tone === 'paid' ? colors.statusPaidSoft : colors.statusPendingSoft;
  return (
    <View style={[styles.info, { backgroundColor: bg }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Txt variant="label">{message}</Txt>
    </View>
  );
}

/** Balok kerangka berdenyut pelan; diam jika kurangi gerakan aktif. */
export function Skeleton({ width = '100%', height = 16, style }: { width?: number | `${number}%`; height?: number; style?: object }) {
  const colors = useColors();
  const reduceMotion = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);
  return (
    <Animated.View
      style={[{ width, height, borderRadius: 6, backgroundColor: colors.lineSoft, opacity }, styles.skeleton, style]}
    />
  );
}

/** Kerangka layar: satu angka besar + beberapa baris. */
export function ScreenSkeleton({ label, rows = 5 }: { label: string; rows?: number }) {
  return (
    <View accessible accessibilityLabel={`Memuat ${label}`} accessibilityRole="progressbar">
      <Skeleton width="40%" height={14} />
      <Skeleton width="60%" height={40} />
      <Skeleton width="80%" height={14} />
      <View style={styles.skeletonGap} />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={20} width={i % 2 ? '85%' : '100%'} />
      ))}
    </View>
  );
}

export type BadgeKind = 'belum_bayar' | 'menunggu_konfirmasi' | 'lunas' | 'settled' | 'open' | 'overdue' | 'due_soon';

const BADGE: Record<BadgeKind, { icon: string; tone: 'unpaid' | 'pending' | 'paid' | 'muted' }> = {
  belum_bayar: { icon: '○', tone: 'unpaid' },
  menunggu_konfirmasi: { icon: '◷', tone: 'pending' },
  lunas: { icon: '✓', tone: 'paid' },
  settled: { icon: '✓', tone: 'paid' },
  open: { icon: '', tone: 'muted' },
  overdue: { icon: '!', tone: 'unpaid' },
  due_soon: { icon: '◷', tone: 'pending' },
};

/** Lencana status: selalu teks + ikon, bukan warna saja. */
export function StatusBadge({ kind, label }: { kind: BadgeKind; label: string }) {
  const colors = useColors();
  const { icon, tone } = BADGE[kind];
  const fg =
    tone === 'unpaid' ? colors.statusUnpaid : tone === 'pending' ? colors.statusPending : tone === 'paid' ? colors.statusPaid : colors.inkMuted;
  const bg =
    tone === 'unpaid'
      ? colors.statusUnpaidSoft
      : tone === 'pending'
        ? colors.statusPendingSoft
        : tone === 'paid'
          ? colors.statusPaidSoft
          : 'transparent';
  return (
    <View
      style={[styles.badge, { backgroundColor: bg, borderColor: tone === 'muted' ? colors.line : bg }]}
      accessible
      accessibilityLabel={label}
    >
      <Txt variant="caption" style={{ color: fg }}>
        {icon ? `${icon} ` : ''}
        {label}
      </Txt>
    </View>
  );
}

/** Bilah horizontal anggaran/kategori; varian `over` penuh merah. */
export function ProgressBar({ ratio, over, accessibilityLabel }: { ratio: number; over?: boolean; accessibilityLabel?: string }) {
  const colors = useColors();
  const pct = Math.max(0, Math.min(1, over ? 1 : ratio)) * 100;
  return (
    <View
      style={[styles.bar, { backgroundColor: colors.lineSoft }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: over ? colors.statusUnpaid : colors.primary }]} />
    </View>
  );
}

// ---------------------------------------------------------------- toast

type ToastContextValue = { show: (message: string) => void };
const ToastContext = createContext<ToastContextValue>({ show: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const colors = useColors();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    AccessibilityInfo.announceForAccessibility(text);
    timer.current = setTimeout(() => setMessage(null), 3000);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={[styles.toast, { backgroundColor: colors.ink }]} accessibilityLiveRegion="polite">
            <Txt variant="body" style={{ color: colors.bg }}>
              {message}
            </Txt>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

// ---------------------------------------------------------------- dialog

type ConfirmOptions = { title: string; message?: string; confirmLabel: string; cancelLabel?: string; destructive?: boolean };

/** Dialog konfirmasi bawaan: judul, kalimat akibat, Batal + aksi. */
export function confirmAction({ title, message, confirmLabel, cancelLabel = 'Batal', destructive }: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' && window.confirm(`${title}${message ? `\n\n${message}` : ''}`);
    return Promise.resolve(ok);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { paddingVertical: spacing.lg, gap: spacing.md },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { borderRadius: radius.panel, padding: spacing.lg, gap: spacing.md, marginVertical: spacing.md },
  errorBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, borderRadius: radius.input },
  info: { borderRadius: radius.input, padding: spacing.md, marginBottom: spacing.md },
  skeleton: { marginBottom: spacing.sm },
  skeletonGap: { height: spacing.xl },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
  },
  bar: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill },
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', paddingHorizontal: 20 },
  toast: { borderRadius: radius.input, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, maxWidth: 480 },
});
