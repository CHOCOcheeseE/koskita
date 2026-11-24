import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState, type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { formatThousands, parseDigits } from '../format';
import { fonts, radius, spacing, touchTarget, typography } from '../theme/tokens';
import { useColors } from '../theme/use-theme';
import { Txt } from './text';

type InputRef = ComponentProps<typeof TextInput>['ref'];

type FieldShellProps = {
  label: string;
  helper?: string;
  error?: string;
  counter?: string;
  children: React.ReactNode;
};

function FieldShell({ label, helper, error, counter, children }: FieldShellProps) {
  return (
    <View style={styles.field}>
      <Txt variant="label" color="inkMuted" style={styles.label}>
        {label}
      </Txt>
      {children}
      <View style={styles.helperRow}>
        {error ? (
          <Txt variant="label" color="statusUnpaid" accessibilityLiveRegion="polite" style={styles.flex}>
            ! {error}
          </Txt>
        ) : helper ? (
          <Txt variant="label" color="inkMuted" style={styles.flex}>
            {helper}
          </Txt>
        ) : (
          <View style={styles.flex} />
        )}
        {counter ? (
          <Txt variant="label" color="inkMuted" tabular>
            {counter}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  helper?: string;
  error?: string;
  showCounter?: boolean;
  inputRef?: InputRef;
  /** Tampilkan tombol lihat/sembunyikan untuk kata sandi. */
  password?: boolean;
};

/** Label di atas, helper/penghitung karakter, error di bawah. */
export function TextField({ label, helper, error, showCounter, inputRef, password, value, maxLength, ...rest }: TextFieldProps) {
  const colors = useColors();
  const [hidden, setHidden] = useState(true);
  const counter = showCounter && maxLength ? `${(value ?? '').length}/${maxLength}` : undefined;
  return (
    <FieldShell label={label} helper={helper} error={error} counter={counter}>
      <View
        style={[
          styles.inputBox,
          { backgroundColor: colors.surface, borderColor: error ? colors.statusUnpaid : colors.line },
        ]}
      >
        <TextInput
          ref={inputRef}
          value={value}
          maxLength={maxLength}
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor={colors.inkMuted}
          secureTextEntry={password ? hidden : undefined}
          style={[styles.input, typography.body, { color: colors.ink }]}
          {...rest}
        />
        {password ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'}
            style={styles.eye}
          >
            <Txt variant="label" color="primary">
              {hidden ? 'Lihat' : 'Tutup'}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </FieldShell>
  );
}

type AmountFieldProps = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string;
  helper?: string;
  large?: boolean;
  autoFocus?: boolean;
  inputRef?: InputRef;
  testID?: string;
};

/** Prefiks "Rp", pemisah ribuan saat mengetik, nilai integer. */
export function AmountField({ label, value, onChange, error, helper, large, autoFocus, inputRef, testID }: AmountFieldProps) {
  const colors = useColors();
  const text = value === null ? '' : formatThousands(value);
  const textStyle = large ? typography.amountXL : typography.bodyStrong;
  return (
    <FieldShell label={label} helper={helper} error={error}>
      <View
        style={[
          styles.inputBox,
          { backgroundColor: colors.surface, borderColor: error ? colors.statusUnpaid : colors.line },
          large ? styles.largeBox : null,
        ]}
      >
        <Txt variant={large ? 'amountL' : 'bodyStrong'} color="inkMuted" style={styles.prefix}>
          Rp
        </Txt>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={(t) => onChange(parseDigits(t))}
          keyboardType="number-pad"
          inputMode="numeric"
          autoFocus={autoFocus}
          accessibilityLabel={`${label}, rupiah`}
          accessibilityHint={error}
          placeholder="0"
          placeholderTextColor={colors.inkMuted}
          testID={testID}
          style={[styles.input, textStyle, { color: colors.ink, fontVariant: ['tabular-nums'] }]}
          maxFontSizeMultiplier={large ? 1.6 : undefined}
        />
      </View>
    </FieldShell>
  );
}

type Option<T extends string | number> = { value: T; label: string; accessibilityLabel?: string };

type SegmentedProps<T extends string | number> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
};

/** 2–3 pilihan sejajar, peran tablist. */
export function Segmented<T extends string | number>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.segmented, { borderColor: colors.line, backgroundColor: colors.surface }]}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={o.accessibilityLabel ?? o.label}
            style={[styles.segment, selected ? { backgroundColor: colors.primary } : null]}
          >
            <Txt variant="bodyStrong" color={selected ? 'onPrimary' : 'ink'}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

type ChipGroupProps<T extends string | number> = {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  error?: string;
  compact?: boolean;
};

/** Pilihan tunggal berbentuk chip (kategori, hari), peran radiogroup. */
export function ChipGroup<T extends string | number>({ options, value, onChange, accessibilityLabel, error, compact }: ChipGroupProps<T>) {
  const colors = useColors();
  return (
    <View>
      <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={styles.chips}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLabel={o.accessibilityLabel ?? o.label}
              style={[
                styles.chip,
                compact ? styles.chipCompact : null,
                {
                  borderColor: selected ? colors.primary : colors.line,
                  backgroundColor: selected ? colors.primary : colors.surface,
                },
              ]}
            >
              <Txt variant="bodyStrong" color={selected ? 'onPrimary' : 'ink'}>
                {o.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Txt variant="label" color="statusUnpaid" style={styles.chipError}>
          ! {error}
        </Txt>
      ) : null}
    </View>
  );
}

type CodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helper?: string;
  autoFocus?: boolean;
};

/** 6 kotak kode undangan, huruf besar otomatis. Satu TextInput tersembunyi menampung ketikan. */
export function CodeInput({ value, onChange, error, helper, autoFocus }: CodeInputProps) {
  const colors = useColors();
  const chars = value.padEnd(6, ' ').slice(0, 6).split('');
  return (
    <FieldShell label="Kode grup dari temanmu" helper={helper} error={error}>
      <View style={styles.codeWrap}>
        <View style={styles.codeRow} pointerEvents="none" importantForAccessibility="no-hide-descendants">
          {chars.map((c, i) => (
            <View
              key={i}
              style={[
                styles.codeBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: error ? colors.statusUnpaid : i === value.length ? colors.primary : colors.line,
                },
              ]}
            >
              <Txt variant="amountL" style={{ fontFamily: fonts.bodyBold }}>
                {c.trim()}
              </Txt>
            </View>
          ))}
        </View>
        <TextInput
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6))}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          autoFocus={autoFocus}
          maxLength={6}
          accessibilityLabel="Kode grup, 6 karakter"
          style={styles.codeHidden}
          caretHidden
        />
      </View>
    </FieldShell>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Date lokal dengan jam dinding sama seperti tanggal/jam WIB (picker bekerja di jam dinding). */
function wallClockDate(date: string, time = '12:00'): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

type PickerFieldProps = {
  label: string;
  /** Tanggal `YYYY-MM-DD` atau jam `HH:mm`. */
  value: string;
  display: string;
  mode: 'date' | 'time';
  onChange: (value: string) => void;
  /** Batas maksimal tanggal `YYYY-MM-DD` (mis. hari ini). */
  maxDate?: string;
  error?: string;
  helper?: string;
};

/** Membungkus picker bawaan; nilai selalu dalam jam dinding WIB. */
export function PickerField({ label, value, display, mode, onChange, maxDate, error, helper }: PickerFieldProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const current = mode === 'date' ? wallClockDate(value) : wallClockDate('2026-01-01', value);
  const handle = (date?: Date) => {
    if (!date) return;
    onChange(
      mode === 'date'
        ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
        : `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    );
  };
  const maximumDate = maxDate ? wallClockDate(maxDate, '23:59') : undefined;
  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode,
        is24Hour: true,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set') handle(date);
        },
      });
    } else {
      setOpen((o) => !o);
    }
  };
  return (
    <FieldShell label={label} helper={helper} error={error}>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${display}`}
        accessibilityHint="Ketuk untuk mengubah"
        style={[styles.inputBox, styles.pickerBox, { backgroundColor: colors.surface, borderColor: error ? colors.statusUnpaid : colors.line }]}
      >
        <Txt variant="body" tabular style={styles.flex}>
          {display}
        </Txt>
        <Txt variant="body" color="inkMuted">
          ▾
        </Txt>
      </Pressable>
      {open && Platform.OS !== 'android' ? (
        <DateTimePicker
          value={current}
          mode={mode}
          is24Hour
          display="spinner"
          locale="id-ID"
          maximumDate={maximumDate}
          onChange={(_, date) => handle(date)}
        />
      ) : null}
    </FieldShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.xs },
  helperRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, minHeight: 4 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.input,
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
  },
  largeBox: { minHeight: 72 },
  pickerBox: { justifyContent: 'space-between' },
  input: { flex: 1, paddingVertical: spacing.sm },
  prefix: { marginRight: spacing.sm },
  eye: { minHeight: touchTarget, minWidth: touchTarget, alignItems: 'center', justifyContent: 'center' },
  segmented: { flexDirection: 'row', borderWidth: 1.5, borderRadius: radius.input, overflow: 'hidden' },
  segment: { flex: 1, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  chipCompact: { paddingHorizontal: spacing.md, minWidth: touchTarget, alignItems: 'center' },
  chipError: { marginTop: spacing.xs },
  codeWrap: { position: 'relative' },
  codeRow: { flexDirection: 'row', gap: spacing.sm },
  codeBox: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 56,
    borderWidth: 1.5,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeHidden: { ...StyleSheet.absoluteFill, opacity: 0.02, color: 'transparent' },
});
