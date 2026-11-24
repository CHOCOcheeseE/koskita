import { Text, type TextProps } from 'react-native';

import { typography, type TypographyVariant } from '../theme/tokens';
import { useColors } from '../theme/use-theme';

type ColorName = 'ink' | 'inkMuted' | 'primary' | 'statusPaid' | 'statusPending' | 'statusUnpaid' | 'onPrimary';

export type TxtProps = TextProps & {
  variant?: TypographyVariant;
  color?: ColorName;
  tabular?: boolean;
};

/** Teks dengan token tipografi. Ikut ukuran huruf sistem (allowFontScaling). */
export function Txt({ variant = 'body', color = 'ink', tabular, style, ...rest }: TxtProps) {
  const colors = useColors();
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={variant === 'amountXL' ? 1.6 : undefined}
      style={[
        typography[variant],
        { color: colors[color] },
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
