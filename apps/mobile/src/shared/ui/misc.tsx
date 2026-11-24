import * as Clipboard from 'expo-clipboard';
import type { ReactNode } from 'react';
import { Modal, Pressable, Share, StyleSheet, View } from 'react-native';

import { radius, screenGutter, spacing, touchTarget } from '../theme/tokens';
import { useColors } from '../theme/use-theme';
import { HighlightText } from './amount';
import { Button } from './button';
import { useToast } from './feedback';
import { Txt } from './text';

const AVATAR_COLORS = ['#2346A8', '#256A43', '#8A5A0B', '#6B3FA0', '#1F6F78', '#9C3D5B'];

/** Inisial 2 huruf, warna latar dari daftar tetap. */
export function Avatar({ initials, onPress, accessibilityLabel }: { initials: string; onPress?: () => void; accessibilityLabel?: string }) {
  const seed = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const body = (
    <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[seed % AVATAR_COLORS.length] }]}>
      <Txt variant="bodyStrong" style={styles.avatarText}>
        {initials}
      </Txt>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} hitSlop={4}>
      {body}
    </Pressable>
  );
}

type ListRowProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  below?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  muted?: boolean;
  testID?: string;
};

/** Baris daftar: area sentuh penuh, judul, subjudul, nilai kanan. */
export function ListRow({ title, subtitle, right, below, onPress, accessibilityLabel, muted, testID }: ListRowProps) {
  const colors = useColors();
  const content = (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <View style={styles.rowTop}>
          <Txt variant="body" color={muted ? 'inkMuted' : 'ink'} style={styles.flex} numberOfLines={2}>
            {title}
          </Txt>
          {right}
        </View>
        {subtitle ? (
          <Txt variant="label" color="inkMuted" numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
        {below}
      </View>
    </View>
  );
  return (
    <View style={[styles.rowWrap, { borderBottomColor: colors.lineSoft }]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          testID={testID}
          style={({ pressed }) => (pressed ? styles.pressed : null)}
        >
          {content}
        </Pressable>
      ) : (
        <View accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} testID={testID}>
          {content}
        </View>
      )}
    </View>
  );
}

/** Kode undangan berjarak + Salin dan Bagikan (Share bawaan RN). */
export function InviteCodeCard({ code, groupName }: { code: string; groupName: string }) {
  const toast = useToast();
  return (
    <View style={styles.invite}>
      <HighlightText accessibilityLabel={`Kode grup ${code.split('').join(', ')}`}>{code}</HighlightText>
      <View style={styles.inviteActions}>
        <Button
          label="Salin kode"
          variant="secondary"
          onPress={async () => {
            await Clipboard.setStringAsync(code);
            toast.show('Kode disalin');
          }}
        />
        <Button
          label="Bagikan"
          variant="secondary"
          onPress={() => Share.share({ message: `Gabung grup ${groupName} di KosKita pakai kode ${code}` })}
        />
      </View>
    </View>
  );
}

/** Lembar bawah sederhana (menu ⋯, kode undangan, anggota). */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Tutup" accessibilityRole="button" />
      <View style={[styles.sheet, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
        <View style={styles.sheetHeader}>
          <Txt variant="heading" accessibilityRole="header" style={styles.flex}>
            {title}
          </Txt>
          <Button label="Tutup" variant="text" onPress={onClose} />
        </View>
        {children}
      </View>
    </Modal>
  );
}

/** Kotak centang tugas 48 dp. */
export function TaskCheckbox({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.checkTarget}
    >
      <View
        style={[
          styles.check,
          { borderColor: checked ? colors.statusPaid : colors.line, backgroundColor: checked ? colors.statusPaid : colors.surface },
        ]}
      >
        {checked ? (
          <Txt variant="bodyStrong" style={{ color: colors.surface }}>
            ✓
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  avatar: { width: touchTarget, height: touchTarget, borderRadius: touchTarget / 2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF' },
  rowWrap: { borderBottomWidth: StyleSheet.hairlineWidth * 2 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: touchTarget + 8, paddingVertical: spacing.md, gap: spacing.md },
  rowMain: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  invite: { gap: spacing.lg, alignItems: 'flex-start', paddingVertical: spacing.md },
  inviteActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: screenGutter,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center' },
  checkTarget: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  check: { width: 26, height: 26, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
