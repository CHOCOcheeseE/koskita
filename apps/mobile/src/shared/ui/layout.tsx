import type { ReactNode } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { screenGutter, spacing, touchTarget } from '../theme/tokens';
import { useColors } from '../theme/use-theme';
import { Txt } from './text';

type ScreenProps = {
  children: ReactNode;
  header?: ReactNode;
  /** Tombol mengambang atau aksi bawah yang tidak ikut menggulir. */
  floating?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Dipanggil saat gulir mendekati bawah (muat halaman berikutnya). */
  onEndReached?: () => void;
  scroll?: boolean;
  testID?: string;
};

export function Screen({ children, header, floating, refreshing, onRefresh, onEndReached, scroll = true, testID }: ScreenProps) {
  const colors = useColors();
  const handleScroll = onEndReached
    ? (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 240) onEndReached();
      }
    : undefined;
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]} edges={['top', 'left', 'right']} testID={testID}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, floating ? styles.withFloating : null]}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={200}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content]}>{children}</View>
      )}
      {floating ? <View style={styles.floating}>{floating}</View> : null}
    </SafeAreaView>
  );
}

type HeaderAction = { label: string; onPress: () => void; accessibilityLabel?: string };

type ScreenHeaderProps = {
  title?: string;
  left?: HeaderAction;
  right?: HeaderAction | ReactNode;
  large?: boolean;
};

function isAction(value: unknown): value is HeaderAction {
  return typeof value === 'object' && value !== null && 'onPress' in value && 'label' in value;
}

/** Judul layar dengan aksi kiri (Kembali/Batal) dan kanan. */
export function ScreenHeader({ title, left, right, large }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {left ? (
          <Pressable
            onPress={left.onPress}
            accessibilityRole="button"
            accessibilityLabel={left.accessibilityLabel ?? left.label}
            style={styles.headerAction}
            hitSlop={8}
          >
            <Txt variant="bodyStrong" color="primary">
              {left.label}
            </Txt>
          </Pressable>
        ) : (
          <View />
        )}
        {!large && title ? (
          <Txt variant="bodyStrong" accessibilityRole="header" numberOfLines={1} style={styles.headerTitleSmall}>
            {title}
          </Txt>
        ) : null}
        {isAction(right) ? (
          <Pressable
            onPress={right.onPress}
            accessibilityRole="button"
            accessibilityLabel={right.accessibilityLabel ?? right.label}
            style={[styles.headerAction, styles.headerActionRight]}
            hitSlop={8}
          >
            <Txt variant="bodyStrong" color="primary">
              {right.label}
            </Txt>
          </Pressable>
        ) : (
          (right ?? <View style={styles.headerAction} />)
        )}
      </View>
      {large && title ? (
        <Txt variant="title" accessibilityRole="header" style={styles.largeTitle}>
          {title}
        </Txt>
      ) : null}
    </View>
  );
}

/** Garis tipis + judul bagian. */
export function SectionDivider({ title, right }: { title?: string; right?: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <View style={[styles.rule, { backgroundColor: colors.lineSoft }]} />
      {title ? (
        <View style={styles.sectionRow}>
          <Txt variant="heading" accessibilityRole="header">
            {title}
          </Txt>
          {right}
        </View>
      ) : null}
    </View>
  );
}

export function Gap({ size = 'lg' }: { size?: keyof typeof spacing }) {
  return <View style={{ height: spacing[size] }} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: screenGutter, paddingBottom: spacing.xxl },
  withFloating: { paddingBottom: 120 },
  floating: { position: 'absolute', right: screenGutter, bottom: spacing.xl },
  header: { paddingHorizontal: screenGutter, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: touchTarget },
  headerAction: { minHeight: touchTarget, minWidth: touchTarget, justifyContent: 'center' },
  headerActionRight: { alignItems: 'flex-end' },
  headerTitleSmall: { flex: 1, textAlign: 'center', marginHorizontal: spacing.sm },
  largeTitle: { marginTop: spacing.xs, marginBottom: spacing.md },
  section: { marginTop: spacing.xl, marginBottom: spacing.md },
  rule: { height: StyleSheet.hairlineWidth * 2 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg },
});
